import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { apiRateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = apiRateLimit.check(request)
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
          'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString()
        }
      }
    )
  }
  
  try {
    // Check if service role key is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not configured')
      return NextResponse.json({ 
        error: 'Server configuration error: Missing service role key' 
      }, { status: 500 })
    }

    const supabase = await createClient()
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use admin client to get current user's tenant_id (bypasses RLS)
    const adminClient = createAdminClient()
    const { data: currentUser, error: userError } = await adminClient
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single()

    if (userError || !currentUser) {
      console.error('Error fetching current user:', userError)
      return NextResponse.json({ 
        error: 'User not found',
        details: userError?.message 
      }, { status: 404 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const role = searchParams.get('role')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Fetch all users in tenant using admin client (bypasses RLS)
    let query = adminClient
      .from('users')
      .select('*', { count: 'exact' })
      .eq('tenant_id', currentUser.tenant_id)
      .order('created_at', { ascending: false })

    if (role && (role === 'admin' || role === 'sales_person')) {
      query = query.eq('role', role as 'admin' | 'sales_person')
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data, error, count } = await query.range(from, to)

    if (error) {
      console.error('Error fetching users list:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      users: data,
      total: count ?? 0,
      page,
      pageSize,
      totalPages: Math.ceil((count ?? 0) / pageSize),
    })
  } catch (error: any) {
    console.error('Error in GET /api/users:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // Apply stricter rate limiting for user creation
  const rateLimitResult = apiRateLimit.check(request)
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
          'Retry-After': Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString()
        }
      }
    )
  }

  try {
    // Check if service role key is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not configured')
      return NextResponse.json({ 
        error: 'Server configuration error: Missing service role key' 
      }, { status: 500 })
    }

    const supabase = await createClient()
    
    // Check if user is authenticated and is an admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use admin client to get current user's role (bypasses RLS)
    const adminClient = createAdminClient()
    const { data: currentUser, error: userError } = await adminClient
      .from('users')
      .select('role, tenant_id')
      .eq('id', user.id)
      .single()

    if (userError || !currentUser || currentUser.role !== 'admin') {
      console.error('Error fetching current user or not admin:', userError)
      return NextResponse.json({ 
        error: 'Only admins can create users',
        details: userError?.message 
      }, { status: 403 })
    }

    const body = await request.json()
    const { email, password, full_name, role, store_id } = body

    // Validate input
    if (!email || !password || !full_name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate store_id is provided for sales_person role
    if (role === 'sales_person' && !store_id) {
      return NextResponse.json({ error: 'Store is required for sales person role' }, { status: 400 })
    }

    // Validate store_id is null for admin role
    const finalStoreId = role === 'admin' ? null : store_id

    // Create auth user using admin API
    const { data: authData, error: authError2 } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        tenant_id: currentUser.tenant_id,
        role,
      },
    })

    if (authError2) {
      return NextResponse.json({ error: authError2.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    // Create user record in users table using admin client (bypasses RLS)
    const { data: userData, error: insertError } = await adminClient
      .from('users')
      .insert({
        id: authData.user.id,
        tenant_id: currentUser.tenant_id,
        email,
        full_name,
        role,
        store_id: finalStoreId,
      })
      .select()
      .single()

    if (insertError) {
      // Rollback: delete the auth user
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: insertError.message }, { status: 400 })
    }

    return NextResponse.json(userData, { status: 201 })
  } catch (error: any) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

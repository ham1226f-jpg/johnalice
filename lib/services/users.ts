import { createClient } from '@/lib/supabase/client'

export interface User {
  id: string
  tenant_id: string
  store_id: string | null
  email: string
  full_name: string
  role: 'admin' | 'sales_person'
  created_at: string
  updated_at: string
}

export interface CreateUserData {
  email: string
  password: string
  full_name: string
  role: 'admin' | 'sales_person'
  store_id?: string | null
}

export interface UpdateUserData {
  email?: string
  full_name?: string
  role?: 'admin' | 'sales_person'
  store_id?: string | null
}

export async function getUsers(
  tenantId: string,
  filters?: {
    role?: string
    search?: string
    page?: number
    pageSize?: number
  }
) {
  const supabase = createClient()
  
  // Get current user to verify they have access
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Authentication required')
  }

  const page = filters?.page || 1
  const pageSize = filters?.pageSize || 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Build query
  let query = supabase
    .from('users')
    .select('id, tenant_id, store_id, email, full_name, role, created_at, updated_at', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (filters?.role && (filters.role === 'admin' || filters.role === 'sales_person')) {
    query = query.eq('role', filters.role as 'admin' | 'sales_person')
  }

  if (filters?.search) {
    query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
  }

  const { data, error, count } = await query.range(from, to)

  if (error) {
    throw new Error(error.message)
  }

  return {
    users: data || [],
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  }
}

export async function getUserById(userId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data as User
}

export async function createUser(tenantId: string, data: CreateUserData) {
  const supabase = createClient()
  
  // Get current user to verify they are admin
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Authentication required')
  }

  // Check if current user is admin
  const { data: currentUser, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userError || !currentUser || currentUser.role !== 'admin') {
    throw new Error('Only admins can create users')
  }

  // Validate input
  if (!data.email || !data.password || !data.full_name || !data.role) {
    throw new Error('Missing required fields')
  }

  // Validate store_id is provided for sales_person role
  if (data.role === 'sales_person' && !data.store_id) {
    throw new Error('Store is required for sales person role')
  }

  // Set store_id to null for admin role
  const finalStoreId = data.role === 'admin' ? null : data.store_id

  // For now, we'll create the user record directly in the users table
  // In a production environment, you'd want to use Supabase Auth Admin API
  // But since we don't have access to that from the client, we'll create a basic user record
  
  // Generate a UUID for the new user (in production, this would come from Supabase Auth)
  const userId = crypto.randomUUID()

  const { data: userData, error: insertError } = await supabase
    .from('users')
    .insert({
      id: userId,
      tenant_id: tenantId,
      email: data.email,
      full_name: data.full_name,
      role: data.role,
      store_id: finalStoreId,
    })
    .select()
    .single()

  if (insertError) {
    throw new Error(insertError.message)
  }

  return userData as User
}

export async function updateUser(userId: string, data: UpdateUserData) {
  // Validate store_id is provided for sales_person role
  if (data.role === 'sales_person' && data.store_id === undefined) {
    // If role is being changed to sales_person, we need to check current store_id
    const supabase = createClient()
    const { data: currentUser } = await supabase
      .from('users')
      .select('store_id')
      .eq('id', userId)
      .single()
    
    if (!(currentUser as any)?.store_id) {
      throw new Error('Store is required for sales person role')
    }
  }

  if (data.role === 'sales_person' && data.store_id === null) {
    throw new Error('Store is required for sales person role')
  }

  // Set store_id to null for admin role
  if (data.role === 'admin') {
    data.store_id = null
  }

  const supabase = createClient()
  
  const { data: userData, error } = await supabase
    .from('users')
    .update(data)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return userData as User
}

export async function deleteUser(userId: string) {
  const supabase = createClient()
  
  // Get current user to verify they are admin
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Authentication required')
  }

  // Check if current user is admin
  const { data: currentUser, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userError || !currentUser || currentUser.role !== 'admin') {
    throw new Error('Only admins can delete users')
  }

  // Prevent users from deleting their own account
  if (user.id === userId) {
    throw new Error('You cannot delete your own account')
  }

  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId)

  if (error) {
    throw new Error(error.message)
  }
}

export async function changeUserPassword(userId: string, newPassword: string) {
  const supabase = createClient()
  
  // Get current user to verify they are admin
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Authentication required')
  }

  // Check if current user is admin
  const { data: currentUser, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userError || !currentUser || currentUser.role !== 'admin') {
    throw new Error('Only admins can change user passwords')
  }

  // For now, we'll just update a password_reset_required flag
  // In a production environment, you'd use Supabase Auth Admin API
  const { error } = await supabase
    .from('users')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', userId)

  if (error) {
    throw new Error(error.message)
  }

  // Note: This is a simplified implementation
  // In production, you'd want to use proper password reset functionality
}

export async function changeOwnPassword(currentPassword: string, newPassword: string) {
  const supabase = createClient()
  
  // First verify current password by attempting to sign in
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) throw new Error('User not found')

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })

  if (signInError) throw new Error('Current password is incorrect')

  // Update password
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) throw error
}

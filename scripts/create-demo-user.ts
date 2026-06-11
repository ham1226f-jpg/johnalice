// Run this script to create a demo user
// Usage: npx tsx scripts/create-demo-user.ts

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createDemoUser() {
  console.log('Creating demo user...')

  // 1. Sign up the user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: 'demo@restaurant.com',
    password: 'demo123',
    options: {
      data: {
        full_name: 'Demo Admin'
      }
    }
  })

  if (authError) {
    console.error('Auth error:', authError.message)
    return
  }

  if (!authData.user) {
    console.error('No user created')
    return
  }

  console.log('✓ Auth user created:', authData.user.id)

  // 2. Create tenant
  const { data: tenantData, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      name: 'Demo Restaurant',
      settings: {
        low_stock_threshold: 10,
        currency: 'USD',
      },
    })
    .select()
    .single()

  if (tenantError) {
    console.error('Tenant error:', tenantError.message)
    return
  }

  console.log('✓ Tenant created:', tenantData.id)

  // 3. Create user profile
  const { error: userError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      tenant_id: tenantData.id,
      email: 'demo@restaurant.com',
      full_name: 'Demo Admin',
      role: 'admin',
    })

  if (userError) {
    console.error('User profile error:', userError.message)
    return
  }

  console.log('✓ User profile created')
  console.log('\n✅ Demo user created successfully!')
  console.log('\nLogin credentials:')
  console.log('Email: demo@restaurant.com')
  console.log('Password: demo123')
}

createDemoUser().catch(console.error)

import { createClient } from '@/lib/supabase/client'
import { Store, UserRole } from '@/types'

/**
 * Store management service
 * 
 * Note: This service requires the stores table and store_id columns to exist in the database.
 * Run migrations in order:
 * 1. create_stores_table.sql
 * 2. add_store_id_columns.sql
 * 3. migrate_data_to_stores.sql
 * 4. update_rls_policies_for_stores.sql
 * 
 * After running migrations, regenerate Supabase types to resolve TypeScript errors.
 */

export interface CreateStoreInput {
  name: string
  settings?: {
    low_stock_threshold?: number
    currency?: string
    tax_rate?: number
  }
}

export interface UpdateStoreInput {
  name?: string
  settings?: {
    low_stock_threshold?: number
    currency?: string
    tax_rate?: number
  }
}

/**
 * Get all stores available to a user based on their role
 * - Admins can access all stores in their tenant
 * - Sales persons can only access their assigned store
 */
export async function getStoresForUser(
  tenantId: string,
  userId: string,
  userRole: UserRole
): Promise<Store[]> {
  const supabase = createClient()

  if (userRole === 'admin') {
    // Admins can access all stores in their tenant
    const { data, error } = await supabase
      .from('stores' as any)
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data as any as Store[]
  } else {
    // Sales persons can only access their assigned store
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('store_id')
      .eq('id', userId)
      .single()

    if (userError) throw userError
    if (!(userData as any).store_id) {
      throw new Error('User is not assigned to any store')
    }

    const { data, error } = await supabase
      .from('stores' as any)
      .select('*')
      .eq('id', (userData as any).store_id)
      .single()

    if (error) throw error
    return [data as any as Store]
  }
}

/**
 * Create a new store
 * Validates that the store name is unique within the tenant
 */
export async function createStore(
  tenantId: string,
  input: CreateStoreInput
): Promise<Store> {
  const supabase = createClient()

  // Check if store name already exists in this tenant
  const { data: existingStore, error: checkError } = await supabase
    .from('stores' as any)
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('name', input.name)
    .maybeSingle()

  if (checkError) throw checkError

  if (existingStore) {
    throw new Error('Store name already exists in this tenant')
  }

  // Create the store
  const { data, error } = await supabase
    .from('stores' as any)
    .insert({
      tenant_id: tenantId,
      name: input.name,
      settings: input.settings || {},
    })
    .select()
    .single()

  if (error) throw error
  return data as any as Store
}

/**
 * Update an existing store
 */
export async function updateStore(
  storeId: string,
  updates: UpdateStoreInput
): Promise<Store> {
  const supabase = createClient()

  // If updating name, check for uniqueness
  if (updates.name) {
    const { data: currentStore, error: fetchError } = await supabase
      .from('stores' as any)
      .select('tenant_id')
      .eq('id', storeId)
      .single()

    if (fetchError) throw fetchError

    const { data: existingStore, error: checkError } = await supabase
      .from('stores' as any)
      .select('id')
      .eq('tenant_id', (currentStore as any).tenant_id)
      .eq('name', updates.name)
      .neq('id', storeId)
      .maybeSingle()

    if (checkError) throw checkError

    if (existingStore) {
      throw new Error('Store name already exists in this tenant')
    }
  }

  const { data, error } = await supabase
    .from('stores' as any)
    .update(updates)
    .eq('id', storeId)
    .select()
    .single()

  if (error) throw error
  return data as any as Store
}

/**
 * Check if a user can access a specific store
 * - Admins can access all stores in their tenant
 * - Sales persons can only access their assigned store
 */
export async function canAccessStore(
  userId: string,
  storeId: string,
  userRole: UserRole
): Promise<boolean> {
  const supabase = createClient()

  // Get user details
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('tenant_id, store_id')
    .eq('id', userId)
    .single()

  if (userError) {
    console.error('Unauthorized store access attempt: Failed to fetch user data', { userId, storeId, error: userError })
    throw userError
  }

  // Get store details
  const { data: storeData, error: storeError } = await supabase
    .from('stores' as any)
    .select('tenant_id')
    .eq('id', storeId)
    .single()

  if (storeError) {
    console.error('Store not found or access denied', { userId, storeId, error: storeError })
    throw storeError
  }

  // Check if store belongs to user's tenant
  if ((userData as any).tenant_id !== (storeData as any).tenant_id) {
    console.error('Unauthorized store access attempt: Store does not belong to user tenant', { 
      userId, 
      storeId, 
      userTenantId: (userData as any).tenant_id, 
      storeTenantId: (storeData as any).tenant_id 
    })
    return false
  }

  // Admins can access all stores in their tenant
  if (userRole === 'admin') {
    return true
  }

  // Sales persons can only access their assigned store
  const hasAccess = (userData as any).store_id === storeId
  
  if (!hasAccess) {
    console.error('Unauthorized store access attempt: Sales person attempted to access unassigned store', { 
      userId, 
      storeId, 
      assignedStoreId: (userData as any).store_id 
    })
  }
  
  return hasAccess
}

/**
 * Get available stores for a user (alias for getStoresForUser)
 * This function provides a more intuitive name for the same functionality
 */
export async function getUserStores(
  tenantId: string,
  userId: string,
  userRole: UserRole
): Promise<Store[]> {
  return getStoresForUser(tenantId, userId, userRole)
}

/**
 * Delete a store
 * Validates that the store has no associated data before deletion
 */
export async function deleteStore(storeId: string): Promise<void> {
  const supabase = createClient()

  // Check for associated data
  const dependencies: string[] = []

  // Check users
  const { count: userCount, error: userError } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)

  if (userError) throw userError
  if (userCount && userCount > 0) {
    dependencies.push(`${userCount} user(s)`)
  }

  // Check products
  const { count: productCount, error: productError } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)

  if (productError) throw productError
  if (productCount && productCount > 0) {
    dependencies.push(`${productCount} product(s)`)
  }

  // Check transactions
  const { count: transactionCount, error: transactionError } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)

  if (transactionError) throw transactionError
  if (transactionCount && transactionCount > 0) {
    dependencies.push(`${transactionCount} transaction(s)`)
  }

  // Check customers
  const { count: customerCount, error: customerError } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)

  if (customerError) throw customerError
  if (customerCount && customerCount > 0) {
    dependencies.push(`${customerCount} customer(s)`)
  }

  // Check expenses
  const { count: expenseCount, error: expenseError } = await supabase
    .from('expenses')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)

  if (expenseError) throw expenseError
  if (expenseCount && expenseCount > 0) {
    dependencies.push(`${expenseCount} expense(s)`)
  }

  // Check purchase orders
  const { count: poCount, error: poError } = await supabase
    .from('purchase_orders')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)

  if (poError) throw poError
  if (poCount && poCount > 0) {
    dependencies.push(`${poCount} purchase order(s)`)
  }

  // If there are dependencies, throw an error
  if (dependencies.length > 0) {
    throw new Error(
      `Cannot delete store: Store has associated ${dependencies.join(', ')}`
    )
  }

  // Delete the store
  const { error } = await supabase
    .from('stores' as any)
    .delete()
    .eq('id', storeId)

  if (error) throw error
}

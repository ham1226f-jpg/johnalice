import { createClient } from '@/lib/supabase/client'
import { Product } from '@/types'

export interface CreateProductInput {
  sku?: string
  barcode?: string
  name: string
  description?: string
  category: string
  price: number | null
  cost: number | null
  stock_quantity: number
  low_stock_threshold: number
  is_variable_price?: boolean
  image_url?: string | null
  store_id?: string
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  id: string
}

export async function getProducts(tenantId: string, filters?: {
  search?: string
  category?: string
  archived?: boolean
  page?: number
  pageSize?: number
  storeId?: string
}) {
  const supabase = createClient()
  
  let query = supabase
    .from('products')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .eq('is_archived', filters?.archived ?? false)
    .order('created_at', { ascending: false })

  // Apply store filter
  if (filters?.storeId) {
    query = query.eq('store_id', filters.storeId)
  }

  // Apply search filter
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%,barcode.ilike.%${filters.search}%`)
  }

  // Apply category filter
  if (filters?.category) {
    query = query.eq('category', filters.category)
  }

  // Apply pagination
  const page = filters?.page ?? 1
  const pageSize = filters?.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) throw error

  return {
    products: data as Product[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function getProduct(id: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Product
}

export async function createProduct(tenantId: string, userId: string, input: CreateProductInput, storeId?: string) {
  const supabase = createClient()
  
  // Validate price based on is_variable_price flag
  if (!input.is_variable_price && (input.price === null || input.price === undefined)) {
    throw new Error('Price is required for fixed-price products')
  }
  
  // Validate storeId is provided
  if (!storeId) {
    throw new Error('Store ID is required to create a product')
  }
  
  // Generate SKU if not provided
  let sku = input.sku
  if (!sku || sku.trim() === '') {
    // Get the count of existing products to generate a unique SKU
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
    
    const productNumber = (count || 0) + 1
    sku = `SKU-${String(productNumber).padStart(5, '0')}`
  }
  
  // Prepare data, converting null to undefined for Supabase
  const insertData: any = {
    tenant_id: tenantId,
    created_by: userId,
    store_id: storeId,
    is_variable_price: input.is_variable_price ?? false,
    base_unit: 'piece',
    purchase_unit: 'piece',
    unit_conversion_ratio: 1,
    ...input,
    sku, // Use generated or provided SKU
  }
  
  // Convert null to undefined for optional fields
  if (insertData.cost === null) delete insertData.cost
  if (insertData.price === null) delete insertData.price
  
  const { data, error } = await supabase
    .from('products')
    .insert(insertData)
    .select()
    .single()

  if (error) throw error
  return data as Product
}

export async function updateProduct(input: UpdateProductInput) {
  const supabase = createClient()
  
  const { id, ...updates } = input
  
  // Validate price based on is_variable_price flag if being updated
  if (updates.is_variable_price !== undefined) {
    if (!updates.is_variable_price && (updates.price === null || updates.price === undefined)) {
      throw new Error('Price is required for fixed-price products')
    }
  }
  
  // Prepare updates, converting null to undefined for Supabase
  const updateData: any = { ...updates }
  if (updateData.cost === null) delete updateData.cost
  if (updateData.price === null) delete updateData.price
  
  const { data, error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Product
}

export async function archiveProduct(id: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('products')
    .update({ is_archived: true })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Product
}

export async function restoreProduct(id: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('products')
    .update({ is_archived: false })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Product
}

export async function getCategories(tenantId: string, storeId?: string) {
  const supabase = createClient()
  
  let query = supabase
    .from('products')
    .select('category')
    .eq('tenant_id', tenantId)
    .eq('is_archived', false)

  // Apply store filter
  if (storeId) {
    query = query.eq('store_id', storeId)
  }

  const { data, error } = await query

  if (error) throw error

  // Get unique categories
  const categories = [...new Set(data.map(p => p.category))].filter(Boolean)
  return categories
}

export async function getProductByBarcode(tenantId: string, barcode: string, storeId?: string) {
  const supabase = createClient()
  
  let query = supabase
    .from('products')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('barcode', barcode)
    .eq('is_archived', false)

  // Apply store filter
  if (storeId) {
    query = query.eq('store_id', storeId)
  }

  const { data, error } = await query.maybeSingle()

  if (error) throw error
  return data as Product | null
}

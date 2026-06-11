import { createClient } from '@/lib/supabase/client'
import { PurchaseOrder } from '@/types'

export interface Supplier {
  name: string
  contact: string | null
}

export async function getSuppliers(tenantId: string): Promise<Supplier[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('purchase_orders')
    .select('supplier_name, supplier_contact')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Get unique suppliers by name
  const suppliersMap = new Map<string, Supplier>()
  for (const row of data || []) {
    if (!suppliersMap.has(row.supplier_name)) {
      suppliersMap.set(row.supplier_name, {
        name: row.supplier_name,
        contact: row.supplier_contact,
      })
    }
  }

  return Array.from(suppliersMap.values())
}

export interface CreatePurchaseOrderInput {
  supplier_name: string
  supplier_contact?: string
  expected_delivery_date: string
  notes?: string
  store_id?: string
  items: {
    product_id: string
    product_name: string
    quantity: number
    cost_per_unit: number
  }[]
}

export interface UpdatePurchaseOrderInput extends Partial<CreatePurchaseOrderInput> {
  id: string
}

export async function getPurchaseOrders(
  tenantId: string,
  filters?: {
    status?: string
    dateFrom?: string
    dateTo?: string
    page?: number
    pageSize?: number
    storeId?: string
  }
) {
  const supabase = createClient()

  let query = supabase
    .from('purchase_orders')
    .select('*, items:purchase_order_items(*)', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  // Apply store filter
  if (filters?.storeId) {
    query = query.eq('store_id', filters.storeId)
  }

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (filters?.dateFrom) {
    query = query.gte('created_at', filters.dateFrom)
  }

  if (filters?.dateTo) {
    query = query.lte('created_at', filters.dateTo)
  }

  const page = filters?.page ?? 1
  const pageSize = filters?.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) throw error

  return {
    purchaseOrders: data as any[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function getPurchaseOrder(id: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('purchase_orders')
    .select('*, items:purchase_order_items(*)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as any
}

export async function createPurchaseOrder(
  tenantId: string,
  userId: string,
  input: CreatePurchaseOrderInput,
  storeId?: string
) {
  const supabase = createClient()

  // Validate storeId is provided
  if (!storeId) {
    throw new Error('Store ID is required to create a purchase order')
  }

  const totalCost = input.items.reduce(
    (sum, item) => sum + item.quantity * item.cost_per_unit,
    0
  )

  const { data: po, error: poError } = await supabase
    .from('purchase_orders')
    .insert({
      tenant_id: tenantId,
      store_id: storeId,
      supplier_name: input.supplier_name,
      supplier_contact: input.supplier_contact,
      expected_delivery_date: input.expected_delivery_date,
      notes: input.notes,
      total_cost: totalCost,
      status: 'draft',
      created_by: userId,
    } as any)
    .select()
    .single()

  if (poError) throw poError

  const itemsToInsert = input.items.map((item) => ({
    tenant_id: tenantId,
    purchase_order_id: po.id,
    product_id: item.product_id,
    product_name: item.product_name,
    quantity: item.quantity,
    cost_per_unit: item.cost_per_unit,
    total_cost: item.quantity * item.cost_per_unit,
  }))

  const { error: itemsError } = await supabase
    .from('purchase_order_items')
    .insert(itemsToInsert)

  if (itemsError) throw itemsError

  return getPurchaseOrder(po.id)
}

export async function updatePurchaseOrder(input: UpdatePurchaseOrderInput) {
  const supabase = createClient()

  const { id, items, ...updates } = input

  const updatesWithCost: any = { ...updates }
  
  if (items) {
    const totalCost = items.reduce(
      (sum, item) => sum + item.quantity * item.cost_per_unit,
      0
    )
    updatesWithCost.total_cost = totalCost
  }

  const { data, error } = await supabase
    .from('purchase_orders')
    .update(updatesWithCost)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  if (items) {
    await supabase.from('purchase_order_items').delete().eq('purchase_order_id', id)

    const { data: po } = await supabase
      .from('purchase_orders')
      .select('tenant_id')
      .eq('id', id)
      .single()

    const itemsToInsert = items.map((item) => ({
      tenant_id: po?.tenant_id,
      purchase_order_id: id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      cost_per_unit: item.cost_per_unit,
      total_cost: item.quantity * item.cost_per_unit,
    }))

    await supabase.from('purchase_order_items').insert(itemsToInsert as any)
  }

  return getPurchaseOrder(id)
}

export async function updatePurchaseOrderStatus(
  id: string,
  status: 'draft' | 'ordered' | 'received' | 'completed',
  tenantId?: string,
  userId?: string,
  currentStoreId?: string
) {
  const supabase = createClient()

  // If marking as received, automatically restock inventory and mark as completed
  if (status === 'received' && tenantId && userId) {
    const po = await getPurchaseOrder(id)
    
    // Validate purchase order store matches currentStore
    if (currentStoreId && po.store_id !== currentStoreId) {
      throw new Error('Cannot receive purchase order in a different store than originally assigned')
    }
    
    // Update stock for each item
    for (const item of po.items) {
      const { data: product } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', item.product_id)
        .single()

      const newStock = Number(product?.stock_quantity || 0) + item.quantity

      await supabase
        .from('products')
        .update({ stock_quantity: newStock })
        .eq('id', item.product_id)

      await supabase.from('stock_history').insert({
        tenant_id: tenantId,
        store_id: po.store_id,
        product_id: item.product_id,
        type: 'restock',
        quantity_change: item.quantity,
        quantity_after: newStock,
        reason: `Restock from PO ${po.po_number}`,
        reference_id: id,
        created_by: userId,
      })
    }

    // Mark as completed directly
    const { data, error } = await supabase
      .from('purchase_orders')
      .update({ status: 'completed' } as any)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  const { data, error } = await supabase
    .from('purchase_orders')
    .update({ status } as any)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function restockFromPurchaseOrder(
  tenantId: string,
  userId: string,
  poId: string
) {
  const supabase = createClient()

  const po = await getPurchaseOrder(poId)

  if (po.status !== 'received') {
    throw new Error('Purchase order must be in received status to restock')
  }

  for (const item of po.items) {
    const { data: product } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', item.product_id)
      .single()

    const newStock = Number(product?.stock_quantity || 0) + item.quantity

    await supabase
      .from('products')
      .update({ stock_quantity: newStock })
      .eq('id', item.product_id)

    await supabase.from('stock_history').insert({
      tenant_id: tenantId,
      store_id: po.store_id,
      product_id: item.product_id,
      type: 'restock',
      quantity_change: item.quantity,
      quantity_after: newStock,
      reason: `Restock from PO ${po.po_number}`,
      reference_id: poId,
      created_by: userId,
    })
  }

  await updatePurchaseOrderStatus(poId, 'completed')

  return getPurchaseOrder(poId)
}

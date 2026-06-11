import { createClient } from '@/lib/supabase/client'
import { Transaction, TransactionItem } from '@/types'

export interface CreateTransactionInput {
  customer_id?: string
  served_by?: string
  store_id?: string
  items: {
    product_id: string
    product_name: string
    product_sku: string
    quantity: number
    unit_price: number
  }[]
  subtotal: number
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  discount_amount: number
  total: number
  payment_method: 'cash' | 'mpesa' | 'bank' | 'debt'
  amount_tendered?: number
  deposit_amount?: number // For partial payments on debt
}

export async function createTransaction(
  tenantId: string,
  userId: string,
  input: CreateTransactionInput,
  storeId?: string
) {
  const supabase = createClient()

  // Validate storeId is provided
  if (!storeId) {
    throw new Error('Store ID is required to create a transaction')
  }

  // Validate all products belong to the same store
  for (const item of input.items) {
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('store_id')
      .eq('id', item.product_id)
      .single()

    if (productError) throw productError

    if ((product as any).store_id !== storeId) {
      throw new Error(`Product ${item.product_name} belongs to a different store`)
    }
  }

  // Start a transaction by creating the main transaction record
  const depositAmount = input.deposit_amount || 0
  const outstandingBalance = input.payment_method === 'debt' ? input.total - depositAmount : 0
  
  const { data: transaction, error: transactionError } = await supabase
    .from('transactions')
    .insert({
      tenant_id: tenantId,
      store_id: storeId,
      customer_id: input.customer_id || null,
      subtotal: input.subtotal,
      discount_type: input.discount_type,
      discount_value: input.discount_value,
      discount_amount: input.discount_amount,
      total: input.total,
      payment_method: input.payment_method,
      status: outstandingBalance > 0 ? 'debt_pending' : 'completed',
      outstanding_balance: outstandingBalance,
      created_by: userId,
    } as any)
    .select()
    .single()

  if (transactionError) throw transactionError
  
  // If there's a deposit on a debt transaction, record it as a payment
  if (input.payment_method === 'debt' && depositAmount > 0) {
    const { error: paymentError } = await supabase
      .from('debt_payments')
      .insert({
        tenant_id: tenantId,
        transaction_id: transaction.id,
        amount: depositAmount,
        payment_method: 'cash', // Deposits are typically cash
        recorded_by: userId,
      })
    
    if (paymentError) throw paymentError
  }

  // Create transaction items
  const itemsToInsert = input.items.map((item) => ({
    tenant_id: tenantId,
    transaction_id: transaction.id,
    product_id: item.product_id,
    product_name: item.product_name,
    product_sku: item.product_sku,
    quantity: item.quantity,
    unit_price: item.unit_price,
    subtotal: item.quantity * item.unit_price,
  }))

  const { error: itemsError } = await supabase
    .from('transaction_items')
    .insert(itemsToInsert)

  if (itemsError) throw itemsError

  // Update product stock quantities and create stock history
  for (const item of input.items) {
    // Get current stock
    const { data: product } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', item.product_id)
      .single()

    const newStock = Number(product?.stock_quantity || 0) - item.quantity

    // Decrease stock
    const { error: stockError } = await supabase
      .from('products')
      .update({ stock_quantity: newStock })
      .eq('id', item.product_id)

    if (stockError) throw stockError

    // Create stock history
    const { error: historyError } = await supabase
      .from('stock_history')
      .insert({
        tenant_id: tenantId,
        store_id: storeId,
        product_id: item.product_id,
        type: 'sale',
        quantity_change: -item.quantity,
        quantity_after: newStock,
        reason: `Sale - Transaction ${transaction.transaction_number}`,
        reference_id: transaction.id,
        created_by: userId,
      })

    if (historyError) throw historyError
  }

  // Update customer total purchases if customer is provided
  if (input.customer_id) {
    const { data: customer } = await supabase
      .from('customers')
      .select('total_purchases')
      .eq('id', input.customer_id)
      .single()

    const newTotal = Number(customer?.total_purchases || 0) + input.total

    const { error: customerError } = await supabase
      .from('customers')
      .update({ total_purchases: newTotal })
      .eq('id', input.customer_id)

    if (customerError) throw customerError
  }

  // Fetch the complete transaction with items
  const { data: completeTransaction, error: fetchError } = await supabase
    .from('transactions')
    .select('*, items:transaction_items(*)')
    .eq('id', transaction.id)
    .single()

  if (fetchError) throw fetchError

  // Fetch customer separately if needed
  let customer = null
  if (input.customer_id) {
    const { data: customerData } = await supabase
      .from('customers')
      .select('*')
      .eq('id', input.customer_id)
      .single()
    customer = customerData
  }

  return { ...completeTransaction, customer } as any
}

export async function getTransactions(
  tenantId: string,
  filters?: {
    dateFrom?: string
    dateTo?: string
    paymentMethod?: string
    search?: string
    page?: number
    pageSize?: number
    userId?: string // Optional: filter by specific user (for sales persons)
    storeId?: string // Optional: filter by store
  }
) {
  const supabase = createClient()

  // Use a single query with joins for better performance
  let query = supabase
    .from('transactions')
    .select(`
      *,
      customer:customers(*),
      created_by_user:users!created_by(id, full_name, email, role)
    `, { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  // Apply store filter
  if (filters?.storeId) {
    query = query.eq('store_id', filters.storeId)
  }

  // Filter by user if provided (RLS will also enforce this for sales persons)
  if (filters?.userId) {
    query = query.eq('created_by', filters.userId)
  }

  // Apply date filters
  if (filters?.dateFrom) {
    query = query.gte('created_at', filters.dateFrom)
  }
  if (filters?.dateTo) {
    query = query.lte('created_at', filters.dateTo)
  }

  // Apply payment method filter
  if (filters?.paymentMethod && filters.paymentMethod !== 'all') {
    query = query.eq('payment_method', filters.paymentMethod)
  }

  // Apply search filter
  if (filters?.search) {
    query = query.or(`transaction_number.ilike.%${filters.search}%`)
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
    transactions: data as any,
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function getTransaction(id: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      items:transaction_items(*),
      customer:customers(*),
      created_by_user:users!created_by(id, full_name, email, role)
    `)
    .eq('id', id)
    .single()

  if (error) throw error

  return data as any
}

export async function createImmediateSale(
  tenantId: string,
  userId: string,
  storeId: string,
  productId: string,
  productName: string,
  productSku: string,
  customPrice: number,
  customerId?: string
) {
  const supabase = createClient()

  // Validate price
  if (customPrice <= 0) {
    throw new Error('Invalid price: must be greater than 0')
  }

  // Check stock availability
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single()

  if (productError) throw productError

  if (!product?.is_variable_price) {
    throw new Error('Product is not configured for variable pricing')
  }

  if (Number(product?.stock_quantity || 0) <= 0) {
    throw new Error('Product is out of stock')
  }

  // Create transaction with single item
  const transactionInput: CreateTransactionInput = {
    customer_id: customerId,
    served_by: userId,
    items: [{
      product_id: productId,
      product_name: productName,
      product_sku: productSku,
      quantity: 1,
      unit_price: customPrice,
    }],
    subtotal: customPrice,
    discount_type: 'fixed',
    discount_value: 0,
    discount_amount: 0,
    total: customPrice,
    payment_method: 'cash', // Default to cash for immediate sales
  }

  return createTransaction(tenantId, userId, transactionInput, storeId)
}

export async function deleteTransaction(
  transactionId: string,
  userId: string
) {
  const supabase = createClient()

  // Get the full transaction with items
  const { data: transaction, error: fetchError } = await supabase
    .from('transactions')
    .select(`
      *,
      items:transaction_items(*)
    `)
    .eq('id', transactionId)
    .single() as { data: any; error: any }

  if (fetchError) throw fetchError
  if (!transaction) throw new Error('Transaction not found')

  // Check if transaction is from today
  const transactionDate = new Date(transaction.created_at)
  const today = new Date()
  const isToday = 
    transactionDate.getDate() === today.getDate() &&
    transactionDate.getMonth() === today.getMonth() &&
    transactionDate.getFullYear() === today.getFullYear()

  if (!isToday) {
    throw new Error('Can only delete transactions from today')
  }

  // Only allow deleting completed or debt_pending transactions
  if (transaction.status !== 'completed' && transaction.status !== 'debt_pending') {
    throw new Error('Can only delete completed or debt pending transactions')
  }

  // Restore stock for each item
  for (const item of transaction.items) {
    // Get current stock
    const { data: product } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', item.product_id)
      .single()

    const newStock = Number(product?.stock_quantity || 0) + item.quantity

    // Increase stock back
    const { error: stockError } = await supabase
      .from('products')
      .update({ stock_quantity: newStock })
      .eq('id', item.product_id)

    if (stockError) throw stockError

    // Create stock history for reversal
    const { error: historyError } = await supabase
      .from('stock_history')
      .insert({
        tenant_id: transaction.tenant_id,
        store_id: transaction.store_id,
        product_id: item.product_id,
        type: 'adjustment',
        quantity_change: item.quantity,
        quantity_after: newStock,
        reason: `Transaction deleted - ${transaction.transaction_number}`,
        reference_id: transactionId,
        created_by: userId,
      })

    if (historyError) throw historyError
  }

  // Update customer total purchases if customer exists
  if (transaction.customer_id) {
    const { data: customer } = await supabase
      .from('customers')
      .select('total_purchases')
      .eq('id', transaction.customer_id)
      .single()

    const newTotalPurchases = Math.max(0, Number(customer?.total_purchases || 0) - transaction.total)
    
    const { error: customerError } = await supabase
      .from('customers')
      .update({ total_purchases: newTotalPurchases })
      .eq('id', transaction.customer_id)

    if (customerError) throw customerError
  }

  // Delete transaction items first (foreign key constraint)
  const { error: deleteItemsError } = await supabase
    .from('transaction_items')
    .delete()
    .eq('transaction_id', transactionId)

  if (deleteItemsError) throw deleteItemsError

  // Delete the transaction
  const { error: deleteError } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId)

  if (deleteError) throw deleteError

  return { success: true, message: 'Transaction deleted successfully' }
}

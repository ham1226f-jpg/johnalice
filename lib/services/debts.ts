import { createClient } from '@/lib/supabase/client'
import { DebtTransaction, DebtSummary, CustomerDebtSummary, DebtPayment, Customer } from '@/types'

export interface DebtFilters {
  search?: string
  dateFrom?: string
  dateTo?: string
  customerId?: string
  sortBy?: 'date' | 'amount' | 'customer' | 'daysOverdue'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
  showCleared?: boolean
}

export interface RecordPaymentInput {
  transaction_id: string
  amount: number
  payment_method: 'cash' | 'mpesa' | 'bank'
}

// Calculate days overdue from a date
function calculateDaysOverdue(createdAt: string): number {
  const created = new Date(createdAt)
  const now = new Date()
  const diffTime = now.getTime() - created.getTime()
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

// Get debt aging category
export function getAgingCategory(daysOverdue: number): 'current' | 'overdue_30' | 'overdue_60' | 'overdue_90' {
  if (daysOverdue <= 30) return 'current'
  if (daysOverdue <= 60) return 'overdue_30'
  if (daysOverdue <= 90) return 'overdue_60'
  return 'overdue_90'
}

export async function getDebts(
  tenantId: string,
  filters?: DebtFilters & { storeId?: string }
) {
  const supabase = createClient()

  // Using any to work around Supabase type generation lag
  let query = (supabase as any)
    .from('transactions')
    .select(`
      *,
      customer:customers(*),
      created_by_user:users!created_by(id, full_name, email, role),
      payments:debt_payments(*)
    `, { count: 'exact' })
    .eq('tenant_id', tenantId)
    .eq('payment_method', 'debt')
    .in('status', filters?.showCleared ? ['debt_pending', 'completed'] : ['debt_pending'])

  // Apply store filter
  if (filters?.storeId) {
    query = query.eq('store_id', filters.storeId)
  }

  // Apply customer filter
  if (filters?.customerId) {
    query = query.eq('customer_id', filters.customerId)
  }

  // Apply date filters
  if (filters?.dateFrom) {
    query = query.gte('created_at', filters.dateFrom)
  }
  if (filters?.dateTo) {
    query = query.lte('created_at', filters.dateTo)
  }

  // Apply search filter (customer name or transaction number)
  if (filters?.search) {
    query = query.or(`transaction_number.ilike.%${filters.search}%,customer.name.ilike.%${filters.search}%`)
  }

  // Apply sorting
  const sortBy = filters?.sortBy || 'date'
  const sortOrder = filters?.sortOrder || 'desc'
  
  switch (sortBy) {
    case 'date':
      query = query.order('created_at', { ascending: sortOrder === 'asc' })
      break
    case 'amount':
      query = query.order('outstanding_balance', { ascending: sortOrder === 'asc' })
      break
    case 'customer':
      // Sort by customer name requires post-processing
      query = query.order('created_at', { ascending: false })
      break
    case 'daysOverdue':
      // Days overdue is same as date but reversed
      query = query.order('created_at', { ascending: sortOrder === 'desc' })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }

  // Apply pagination
  const page = filters?.page ?? 1
  const pageSize = filters?.pageSize ?? 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) throw error

  // Transform to DebtTransaction with computed fields
  const debts: DebtTransaction[] = (data || []).map((t: any) => {
    const totalPaid = (t.payments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0)
    return {
      ...t,
      days_overdue: calculateDaysOverdue(t.created_at),
      total_paid: totalPaid,
    }
  })

  // Post-process sorting for customer name if needed
  if (sortBy === 'customer') {
    debts.sort((a, b) => {
      const nameA = a.customer?.name || ''
      const nameB = b.customer?.name || ''
      return sortOrder === 'asc' 
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA)
    })
  }

  return {
    debts,
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function getDebtSummary(tenantId: string, storeId?: string): Promise<DebtSummary> {
  const supabase = createClient()

  // Get all pending debt transactions
  let query = (supabase as any)
    .from('transactions')
    .select('id, customer_id, outstanding_balance, created_at')
    .eq('tenant_id', tenantId)
    .eq('status', 'debt_pending')
    .gt('outstanding_balance', 0)

  // Apply store filter
  if (storeId) {
    query = query.eq('store_id', storeId)
  }

  const { data: debts, error: debtsError } = await query

  if (debtsError) throw debtsError

  // Get payments for this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  let paymentsQuery = (supabase as any)
    .from('debt_payments')
    .select('amount, payment_date, transaction_id')
    .eq('tenant_id', tenantId)
    .gte('payment_date', startOfMonth.toISOString())

  const { data: monthPayments, error: monthError } = await paymentsQuery

  if (monthError) throw monthError

  // Filter payments by store if needed
  let filteredPayments = monthPayments || []
  if (storeId) {
    const transactionIds = (debts || []).map((d: any) => d.id)
    filteredPayments = filteredPayments.filter((p: any) => transactionIds.includes(p.transaction_id))
  }

  // Calculate totals
  let totalOutstanding = 0
  const customerIds = new Set<string>()
  const aging = { current: 0, overdue_30: 0, overdue_60: 0, overdue_90: 0 }

  for (const debt of debts || []) {
    const balance = Number(debt.outstanding_balance)
    totalOutstanding += balance
    
    if (debt.customer_id) {
      customerIds.add(debt.customer_id)
    }

    const daysOverdue = calculateDaysOverdue(debt.created_at)
    const category = getAgingCategory(daysOverdue)
    aging[category] += balance
  }

  // Calculate collections
  let collectedThisMonth = 0
  let collectedToday = 0

  for (const payment of filteredPayments) {
    const amount = Number(payment.amount)
    collectedThisMonth += amount
    
    const paymentDate = new Date(payment.payment_date)
    if (paymentDate >= startOfToday) {
      collectedToday += amount
    }
  }

  return {
    total_outstanding: totalOutstanding,
    customer_count: customerIds.size,
    aging,
    collected_this_month: collectedThisMonth,
    collected_today: collectedToday,
  }
}

export async function getDebtsByCustomer(
  tenantId: string,
  filters?: { search?: string }
): Promise<CustomerDebtSummary[]> {
  const supabase = createClient()

  // Get all pending debts with customer info
  const { data, error } = await (supabase as any)
    .from('transactions')
    .select(`
      *,
      customer:customers(*),
      payments:debt_payments(*)
    `)
    .eq('tenant_id', tenantId)
    .eq('status', 'debt_pending')
    .gt('outstanding_balance', 0)
    .not('customer_id', 'is', null)

  if (error) throw error

  // Group by customer
  const customerMap = new Map<string, CustomerDebtSummary>()

  for (const t of data || []) {
    if (!t.customer) continue

    const customerId = t.customer.id
    const totalPaid = (t.payments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0)
    
    const debtTransaction: DebtTransaction = {
      ...t,
      days_overdue: calculateDaysOverdue(t.created_at),
      total_paid: totalPaid,
    }

    if (customerMap.has(customerId)) {
      const existing = customerMap.get(customerId)!
      existing.total_outstanding += Number(t.outstanding_balance)
      existing.transaction_count += 1
      existing.debts.push(debtTransaction)
      
      // Update oldest debt date
      if (new Date(t.created_at) < new Date(existing.oldest_debt_date)) {
        existing.oldest_debt_date = t.created_at
      }
    } else {
      customerMap.set(customerId, {
        customer: t.customer,
        total_outstanding: Number(t.outstanding_balance),
        transaction_count: 1,
        oldest_debt_date: t.created_at,
        debts: [debtTransaction],
      })
    }
  }

  let results = Array.from(customerMap.values())

  // Apply search filter
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase()
    results = results.filter(r => 
      r.customer.name.toLowerCase().includes(searchLower) ||
      r.customer.phone?.toLowerCase().includes(searchLower) ||
      r.customer.email?.toLowerCase().includes(searchLower)
    )
  }

  // Sort by total outstanding (highest first)
  results.sort((a, b) => b.total_outstanding - a.total_outstanding)

  return results
}


export async function recordDebtPayment(
  tenantId: string,
  userId: string,
  input: RecordPaymentInput,
  userStoreId?: string
): Promise<DebtPayment> {
  const supabase = createClient()

  // Get the current transaction
  const { data: transaction, error: txError } = await (supabase as any)
    .from('transactions')
    .select('id, outstanding_balance, status, store_id')
    .eq('id', input.transaction_id)
    .eq('tenant_id', tenantId)
    .single()

  if (txError) throw txError
  if (!transaction) throw new Error('Transaction not found')
  if (transaction.status !== 'debt_pending') throw new Error('Transaction is not a pending debt')

  // Validate debt transaction belongs to user's store (for sales persons)
  if (userStoreId && transaction.store_id !== userStoreId) {
    throw new Error('Cannot record payment for debt from a different store')
  }

  const currentBalance = Number(transaction.outstanding_balance)
  
  // Validate payment amount
  if (input.amount <= 0) {
    throw new Error('Payment amount must be greater than zero')
  }
  if (input.amount > currentBalance) {
    throw new Error(`Payment amount (${input.amount}) exceeds outstanding balance (${currentBalance})`)
  }

  // Create the payment record
  const { data: payment, error: paymentError } = await (supabase as any)
    .from('debt_payments')
    .insert({
      tenant_id: tenantId,
      transaction_id: input.transaction_id,
      amount: input.amount,
      payment_method: input.payment_method,
      recorded_by: userId,
    })
    .select(`
      *,
      recorded_by_user:users!recorded_by(id, full_name, email, role)
    `)
    .single()

  if (paymentError) throw paymentError

  // Calculate new balance
  const newBalance = currentBalance - input.amount
  const newStatus = newBalance === 0 ? 'completed' : 'debt_pending'

  // Update the transaction
  const { error: updateError } = await (supabase as any)
    .from('transactions')
    .update({
      outstanding_balance: newBalance,
      status: newStatus,
    })
    .eq('id', input.transaction_id)

  if (updateError) throw updateError

  return payment as DebtPayment
}

// Get payment history for a specific transaction
export async function getPaymentHistory(
  transactionId: string
): Promise<DebtPayment[]> {
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .from('debt_payments')
    .select(`
      *,
      recorded_by_user:users!recorded_by(id, full_name, email, role)
    `)
    .eq('transaction_id', transactionId)
    .order('payment_date', { ascending: true })

  if (error) throw error

  return (data || []) as DebtPayment[]
}

// Get a single debt transaction with full details
export async function getDebtTransaction(
  transactionId: string
): Promise<DebtTransaction | null> {
  const supabase = createClient()

  const { data, error } = await (supabase as any)
    .from('transactions')
    .select(`
      *,
      customer:customers(*),
      created_by_user:users!created_by(id, full_name, email, role),
      payments:debt_payments(
        *,
        recorded_by_user:users!recorded_by(id, full_name, email, role)
      ),
      items:transaction_items(*)
    `)
    .eq('id', transactionId)
    .single()

  if (error) throw error
  if (!data) return null

  const totalPaid = (data.payments || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0)

  return {
    ...data,
    days_overdue: calculateDaysOverdue(data.created_at),
    total_paid: totalPaid,
  } as DebtTransaction
}

// Validate if a payment amount is valid
export function validatePaymentAmount(
  amount: number,
  outstandingBalance: number
): { valid: boolean; error?: string } {
  if (amount <= 0) {
    return { valid: false, error: 'Payment amount must be greater than zero' }
  }
  if (amount > outstandingBalance) {
    return { valid: false, error: `Payment amount exceeds outstanding balance of ${outstandingBalance}` }
  }
  return { valid: true }
}

// Calculate balance after payment
export function calculateNewBalance(
  currentBalance: number,
  paymentAmount: number
): { newBalance: number; isFullyPaid: boolean } {
  const newBalance = currentBalance - paymentAmount
  return {
    newBalance,
    isFullyPaid: newBalance === 0,
  }
}

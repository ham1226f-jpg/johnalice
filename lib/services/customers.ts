import { createClient } from '@/lib/supabase/client'
import { Customer } from '@/types'

export interface CreateCustomerInput {
  name: string
  phone?: string
  email?: string
  store_id?: string
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {
  id: string
}

export async function getCustomers(
  tenantId: string,
  filters?: {
    search?: string
    page?: number
    pageSize?: number
    storeId?: string
  }
) {
  const supabase = createClient()
  
  let query = supabase
    .from('customers')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true })

  // Apply store filter
  if (filters?.storeId) {
    query = query.eq('store_id', filters.storeId)
  }

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
  }

  // Apply pagination
  const page = filters?.page ?? 1
  const pageSize = filters?.pageSize ?? 50
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) throw error
  
  return {
    customers: data as Customer[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function getCustomer(id: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Customer
}

export async function createCustomer(tenantId: string, input: CreateCustomerInput, storeId?: string) {
  const supabase = createClient()
  
  // Validate storeId is provided
  if (!storeId) {
    throw new Error('Store ID is required to create a customer')
  }
  
  const { data, error } = await supabase
    .from('customers')
    .insert({
      tenant_id: tenantId,
      store_id: storeId,
      ...input,
      total_purchases: 0,
    })
    .select()
    .single()

  if (error) throw error
  return data as Customer
}

export async function updateCustomer(input: UpdateCustomerInput) {
  const supabase = createClient()
  
  const { id, ...updates } = input
  
  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Customer
}

export async function getCustomerTransactions(customerId: string, limit = 10) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('transactions')
    .select('*, items:transaction_items(*)')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

// Credit management interfaces
export interface UpdateCustomerCreditInput {
  id: string
  is_credit_approved: boolean
  credit_limit: number | null
}

export interface CustomerCreditStatus {
  customer: Customer
  outstanding_debt: number
  available_credit: number
  pending_transactions: number
}

export interface CreditValidationResult {
  allowed: boolean
  reason?: string
  available_credit?: number
  requested_amount?: number
}

// Update customer credit settings
export async function updateCustomerCredit(input: UpdateCustomerCreditInput): Promise<Customer> {
  const supabase = createClient()
  
  // Validate: if credit approved, limit must be > 0
  if (input.is_credit_approved && (!input.credit_limit || input.credit_limit <= 0)) {
    throw new Error('Credit limit must be greater than zero for approved customers')
  }
  
  // If not approved, clear the limit
  const creditLimit = input.is_credit_approved ? input.credit_limit : null
  
  const { data, error } = await (supabase as any)
    .from('customers')
    .update({
      is_credit_approved: input.is_credit_approved,
      credit_limit: creditLimit,
    })
    .eq('id', input.id)
    .select()
    .single()

  if (error) throw error
  return data as Customer
}

// Get customer credit status with outstanding debt calculation
export async function getCustomerCreditStatus(customerId: string): Promise<CustomerCreditStatus> {
  const supabase = createClient()
  
  // Get customer details
  const { data: customer, error: customerError } = await (supabase as any)
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single()

  if (customerError) throw customerError
  if (!customer) throw new Error('Customer not found')

  // Get outstanding debt (sum of outstanding_balance for debt_pending transactions)
  const { data: debts, error: debtsError } = await (supabase as any)
    .from('transactions')
    .select('outstanding_balance')
    .eq('customer_id', customerId)
    .eq('status', 'debt_pending')
    .gt('outstanding_balance', 0)

  if (debtsError) throw debtsError

  const outstandingDebt = (debts || []).reduce(
    (sum: number, t: any) => sum + Number(t.outstanding_balance || 0),
    0
  )

  const creditLimit = Number(customer.credit_limit || 0)
  const availableCredit = customer.is_credit_approved 
    ? Math.max(0, creditLimit - outstandingDebt)
    : 0

  return {
    customer: {
      ...customer,
      outstanding_debt: outstandingDebt,
      available_credit: availableCredit,
    } as Customer,
    outstanding_debt: outstandingDebt,
    available_credit: availableCredit,
    pending_transactions: (debts || []).length,
  }
}

// Validate if a credit sale is allowed for a customer
export async function validateCreditSale(
  customerId: string,
  saleAmount: number
): Promise<CreditValidationResult> {
  const supabase = createClient()
  
  // Get customer details
  const { data: customer, error: customerError } = await (supabase as any)
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single()

  if (customerError) throw customerError
  if (!customer) {
    return {
      allowed: false,
      reason: 'Customer not found',
    }
  }

  // Check if customer is credit approved
  if (!customer.is_credit_approved) {
    return {
      allowed: false,
      reason: 'Customer is not approved for credit purchases',
    }
  }

  // Get current outstanding debt
  const { data: debts, error: debtsError } = await (supabase as any)
    .from('transactions')
    .select('outstanding_balance')
    .eq('customer_id', customerId)
    .eq('status', 'debt_pending')
    .gt('outstanding_balance', 0)

  if (debtsError) throw debtsError

  const outstandingDebt = (debts || []).reduce(
    (sum: number, t: any) => sum + Number(t.outstanding_balance || 0),
    0
  )

  const creditLimit = Number(customer.credit_limit || 0)
  const availableCredit = creditLimit - outstandingDebt

  // Check if sale would exceed credit limit
  if (saleAmount > availableCredit) {
    return {
      allowed: false,
      reason: `Sale amount (${saleAmount}) exceeds available credit (${availableCredit})`,
      available_credit: availableCredit,
      requested_amount: saleAmount,
    }
  }

  return {
    allowed: true,
    available_credit: availableCredit,
    requested_amount: saleAmount,
  }
}

// Calculate available credit for a customer
export function calculateAvailableCredit(
  creditLimit: number,
  outstandingDebt: number
): number {
  return Math.max(0, creditLimit - outstandingDebt)
}

// Validate credit approval settings
export function validateCreditApproval(
  isApproved: boolean,
  creditLimit: number | null
): { valid: boolean; error?: string } {
  if (isApproved && (!creditLimit || creditLimit <= 0)) {
    return {
      valid: false,
      error: 'Credit limit must be greater than zero for approved customers',
    }
  }
  return { valid: true }
}

// Create customer with credit approval atomically
export interface CreateCustomerWithCreditInput {
  name: string
  phone?: string
  email?: string
  credit_limit: number
  store_id: string
}

export async function createCustomerWithCredit(
  tenantId: string,
  input: CreateCustomerWithCreditInput
): Promise<Customer> {
  const supabase = createClient()
  
  if (!input.store_id) {
    throw new Error('Store ID is required')
  }
  
  if (!input.credit_limit || input.credit_limit <= 0) {
    throw new Error('Credit limit must be greater than zero')
  }
  
  const { data, error } = await supabase
    .from('customers')
    .insert({
      tenant_id: tenantId,
      store_id: input.store_id,
      name: input.name,
      phone: input.phone,
      email: input.email,
      is_credit_approved: true,
      credit_limit: input.credit_limit,
      total_purchases: 0,
    })
    .select()
    .single()

  if (error) throw error
  return data as Customer
}

// Delete a customer
export async function deleteCustomer(customerId: string): Promise<void> {
  const supabase = createClient()
  
  // Check if customer has any transactions
  const { data: transactions, error: checkError } = await supabase
    .from('transactions')
    .select('id')
    .eq('customer_id', customerId)
    .limit(1)

  if (checkError) throw checkError
  
  if (transactions && transactions.length > 0) {
    throw new Error('Cannot delete customer with existing transactions')
  }
  
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', customerId)

  if (error) throw error
}

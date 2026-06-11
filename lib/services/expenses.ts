import { createClient } from '@/lib/supabase/client'
import { Expense, ExpenseCategory, ExpenseSummary, ExpenseAudit } from '@/types'

// Filter interfaces
export interface ExpenseFilters {
  dateFrom?: string
  dateTo?: string
  categoryId?: string
  page?: number
  pageSize?: number
}

export interface CreateExpenseInput {
  category_id: string
  amount: number
  description?: string
  receipt_reference?: string
  expense_date: string
  store_id?: string
}

export interface UpdateExpenseInput extends Partial<CreateExpenseInput> {
  id: string
}

// ==================== Category Functions ====================

export async function getExpenseCategories(tenantId: string): Promise<ExpenseCategory[]> {
  const supabase = createClient()
  
  const { data, error } = await (supabase as any)
    .from('expense_categories')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true })

  if (error) throw error
  return (data || []) as ExpenseCategory[]
}

export async function createExpenseCategory(
  tenantId: string,
  name: string
): Promise<ExpenseCategory> {
  const supabase = createClient()
  
  // Check for duplicate name
  const { data: existing } = await (supabase as any)
    .from('expense_categories')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('name', name)
    .single()

  if (existing) {
    throw new Error(`Category "${name}" already exists`)
  }
  
  const { data, error } = await (supabase as any)
    .from('expense_categories')
    .insert({
      tenant_id: tenantId,
      name,
      is_default: false,
    })
    .select()
    .single()

  if (error) throw error
  return data as ExpenseCategory
}

export async function deleteExpenseCategory(categoryId: string): Promise<void> {
  const supabase = createClient()
  
  // Check if category has expenses
  const { data: expenses, error: checkError } = await (supabase as any)
    .from('expenses')
    .select('id')
    .eq('category_id', categoryId)
    .limit(1)

  if (checkError) throw checkError
  
  if (expenses && expenses.length > 0) {
    throw new Error('Cannot delete category with existing expenses')
  }
  
  const { error } = await (supabase as any)
    .from('expense_categories')
    .delete()
    .eq('id', categoryId)

  if (error) throw error
}

// ==================== Expense Functions ====================

export async function getExpenses(
  tenantId: string,
  filters?: ExpenseFilters & { storeId?: string }
) {
  const supabase = createClient()
  
  let query = (supabase as any)
    .from('expenses')
    .select(`
      *,
      category:expense_categories(*),
      created_by_user:users!created_by(id, full_name, email, role)
    `, { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('expense_date', { ascending: false })

  // Apply store filter
  if (filters?.storeId) {
    query = query.eq('store_id', filters.storeId)
  }

  // Apply date filters
  if (filters?.dateFrom) {
    query = query.gte('expense_date', filters.dateFrom)
  }
  if (filters?.dateTo) {
    query = query.lte('expense_date', filters.dateTo)
  }

  // Apply category filter
  if (filters?.categoryId) {
    query = query.eq('category_id', filters.categoryId)
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
    expenses: (data || []) as Expense[],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  }
}

export async function createExpense(
  tenantId: string,
  userId: string,
  input: CreateExpenseInput,
  storeId?: string
): Promise<Expense> {
  const supabase = createClient()
  
  // Validate required fields
  if (!input.category_id) throw new Error('Category is required')
  if (!input.amount || input.amount <= 0) throw new Error('Amount must be greater than zero')
  if (!input.expense_date) throw new Error('Expense date is required')
  if (!storeId) throw new Error('Store ID is required to create an expense')
  
  const { data, error } = await (supabase as any)
    .from('expenses')
    .insert({
      tenant_id: tenantId,
      store_id: storeId,
      category_id: input.category_id,
      amount: input.amount,
      description: input.description || null,
      receipt_reference: input.receipt_reference || null,
      expense_date: input.expense_date,
      created_by: userId,
    })
    .select(`
      *,
      category:expense_categories(*),
      created_by_user:users!created_by(id, full_name, email, role)
    `)
    .single()

  if (error) throw error
  return data as Expense
}

export async function updateExpense(
  userId: string,
  input: UpdateExpenseInput
): Promise<Expense> {
  const supabase = createClient()
  
  const { id, ...updates } = input
  
  // Get current expense for audit
  const { data: currentExpense, error: fetchError } = await (supabase as any)
    .from('expenses')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError
  if (!currentExpense) throw new Error('Expense not found')

  // Build changes object for audit
  const changes: Record<string, { old: unknown; new: unknown }> = {}
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined && currentExpense[key] !== value) {
      changes[key] = { old: currentExpense[key], new: value }
    }
  }

  // Update the expense
  const { data, error } = await (supabase as any)
    .from('expenses')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(`
      *,
      category:expense_categories(*),
      created_by_user:users!created_by(id, full_name, email, role)
    `)
    .single()

  if (error) throw error

  // Create audit record if there were changes
  if (Object.keys(changes).length > 0) {
    await (supabase as any)
      .from('expense_audit')
      .insert({
        expense_id: id,
        changed_by: userId,
        changes,
      })
  }

  return data as Expense
}

export async function deleteExpense(expenseId: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await (supabase as any)
    .from('expenses')
    .delete()
    .eq('id', expenseId)

  if (error) throw error
}

export async function getExpense(expenseId: string): Promise<Expense | null> {
  const supabase = createClient()
  
  const { data, error } = await (supabase as any)
    .from('expenses')
    .select(`
      *,
      category:expense_categories(*),
      created_by_user:users!created_by(id, full_name, email, role)
    `)
    .eq('id', expenseId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }
  return data as Expense
}

// ==================== Summary Functions ====================

export async function getExpenseSummary(
  tenantId: string,
  filters?: { dateFrom?: string; dateTo?: string; storeId?: string }
): Promise<ExpenseSummary> {
  const supabase = createClient()
  
  let query = (supabase as any)
    .from('expenses')
    .select(`
      amount,
      category:expense_categories(*)
    `)
    .eq('tenant_id', tenantId)

  // Apply store filter
  if (filters?.storeId) {
    query = query.eq('store_id', filters.storeId)
  }

  if (filters?.dateFrom) {
    query = query.gte('expense_date', filters.dateFrom)
  }
  if (filters?.dateTo) {
    query = query.lte('expense_date', filters.dateTo)
  }

  const { data, error } = await query

  if (error) throw error

  // Calculate totals by category
  const categoryTotals = new Map<string, { category: ExpenseCategory; amount: number }>()
  let total = 0

  for (const expense of data || []) {
    const amount = Number(expense.amount)
    total += amount

    if (expense.category) {
      const categoryId = expense.category.id
      if (categoryTotals.has(categoryId)) {
        categoryTotals.get(categoryId)!.amount += amount
      } else {
        categoryTotals.set(categoryId, {
          category: expense.category as ExpenseCategory,
          amount,
        })
      }
    }
  }

  return {
    total,
    by_category: Array.from(categoryTotals.values()).sort((a, b) => b.amount - a.amount),
  }
}

// ==================== Audit Functions ====================

export async function getExpenseAuditHistory(expenseId: string): Promise<ExpenseAudit[]> {
  const supabase = createClient()
  
  const { data, error } = await (supabase as any)
    .from('expense_audit')
    .select(`
      *,
      changed_by_user:users!changed_by(id, full_name, email, role)
    `)
    .eq('expense_id', expenseId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as ExpenseAudit[]
}

// ==================== Validation Functions ====================

export function validateExpenseInput(input: CreateExpenseInput): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!input.category_id) errors.push('Category is required')
  if (!input.amount || input.amount <= 0) errors.push('Amount must be greater than zero')
  if (!input.expense_date) errors.push('Expense date is required')
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

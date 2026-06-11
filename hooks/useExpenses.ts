import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useStore } from '@/contexts/StoreContext'
import { createClient } from '@/lib/supabase/client'
import {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseCategories,
  createExpenseCategory,
  deleteExpenseCategory,
  getExpenseSummary,
  ExpenseFilters,
  CreateExpenseInput,
  UpdateExpenseInput,
} from '@/lib/services/expenses'

export function useExpenses(filters?: ExpenseFilters) {
  const { tenant } = useAuth()
  const { currentStore } = useStore()
  const queryClient = useQueryClient()
  const supabase = createClient()

  const query = useQuery({
    queryKey: ['expenses', tenant?.id, currentStore?.id, filters],
    queryFn: () => getExpenses(tenant!.id, { ...filters, storeId: currentStore!.id }),
    enabled: !!tenant && !!currentStore?.id,
    staleTime: 30000,
  })

  // Subscribe to realtime changes
  useEffect(() => {
    if (!tenant?.id || !currentStore?.id) return

    const channel = supabase
      .channel('expenses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `tenant_id=eq.${tenant.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['expenses'] })
          queryClient.invalidateQueries({ queryKey: ['expense-summary'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenant?.id, currentStore?.id, queryClient, supabase])

  return query
}

export function useExpense(expenseId: string) {
  return useQuery({
    queryKey: ['expense', expenseId],
    queryFn: () => getExpense(expenseId),
    enabled: !!expenseId,
  })
}

export function useExpenseCategories() {
  const { tenant } = useAuth()

  return useQuery({
    queryKey: ['expense-categories', tenant?.id],
    queryFn: () => getExpenseCategories(tenant!.id),
    enabled: !!tenant,
    staleTime: 60000, // 1 minute - categories don't change often
  })
}

export function useExpenseSummary(filters?: { dateFrom?: string; dateTo?: string }) {
  const { tenant } = useAuth()
  const { currentStore } = useStore()

  return useQuery({
    queryKey: ['expense-summary', tenant?.id, currentStore?.id, filters],
    queryFn: () => getExpenseSummary(tenant!.id, { ...filters, storeId: currentStore!.id }),
    enabled: !!tenant && !!currentStore?.id,
    staleTime: 30000, // 30 seconds
  })
}

export function useCreateExpense() {
  const { tenant, user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateExpenseInput) => {
      const { store_id, ...expenseData } = input
      return createExpense(tenant!.id, user!.id, expenseData, store_id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['expense-summary'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useUpdateExpense() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateExpenseInput) =>
      updateExpense(user!.id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['expense', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['expense-summary'] })
    },
  })
}

export function useDeleteExpense() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (expenseId: string) => deleteExpense(expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['expense-summary'] })
    },
  })
}

export function useCreateExpenseCategory() {
  const { tenant } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (name: string) => createExpenseCategory(tenant!.id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] })
    },
  })
}

export function useDeleteExpenseCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (categoryId: string) => deleteExpenseCategory(categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expense-categories'] })
    },
  })
}

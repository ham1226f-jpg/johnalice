import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useStore } from '@/contexts/StoreContext'
import { createClient } from '@/lib/supabase/client'
import {
  getTransactions,
  getTransaction,
  createTransaction,
  deleteTransaction,
  CreateTransactionInput,
} from '@/lib/services/transactions'

export function useTransactions(filters?: {
  dateFrom?: string
  dateTo?: string
  paymentMethod?: string
  search?: string
  page?: number
  pageSize?: number
}) {
  const { tenant, user } = useAuth()
  const { currentStore } = useStore()
  const queryClient = useQueryClient()
  const supabase = createClient()

  // For sales persons, automatically filter by their user ID
  // RLS will enforce this, but we add it here for clarity
  const enhancedFilters = {
    ...filters,
    userId: user?.role === 'sales_person' ? user.id : undefined,
  }

  const query = useQuery({
    queryKey: ['transactions', tenant?.id, currentStore?.id, enhancedFilters],
    queryFn: () => getTransactions(tenant!.id, { ...enhancedFilters, storeId: currentStore!.id }),
    enabled: !!tenant && !!currentStore?.id,
  })

  // Subscribe to realtime changes
  useEffect(() => {
    if (!tenant?.id || !currentStore?.id) return

    const channel = supabase
      .channel('transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `tenant_id=eq.${tenant.id}`,
        },
        (payload) => {
          console.log('Transaction change detected:', payload)
          // Invalidate all transaction queries for this tenant
          queryClient.invalidateQueries({ queryKey: ['transactions'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenant?.id, currentStore?.id, queryClient, supabase])

  return query
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: ['transaction', id],
    queryFn: () => getTransaction(id),
    enabled: !!id,
  })
}

export function useCreateTransaction() {
  const { tenant, user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateTransactionInput) => {
      const { store_id, ...transactionData } = input
      return createTransaction(tenant!.id, user!.id, transactionData, store_id)
    },
    onSuccess: (newTransaction) => {
      // Immediately invalidate queries to refetch with the new transaction
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      
      // Force immediate refetch of transaction queries
      queryClient.refetchQueries({ queryKey: ['transactions'], type: 'active' })
    },
  })
}

export function useDeleteTransaction() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (transactionId: string) =>
      deleteTransaction(transactionId, user!.id),
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['stock-history'] })
      
      // Force immediate refetch
      queryClient.refetchQueries({ queryKey: ['transactions'], type: 'active' })
    },
  })
}

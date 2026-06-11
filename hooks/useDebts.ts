import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useStore } from '@/contexts/StoreContext'
import { createClient } from '@/lib/supabase/client'
import {
  getDebts,
  getDebtSummary,
  getDebtsByCustomer,
  recordDebtPayment,
  getPaymentHistory,
  getDebtTransaction,
  DebtFilters,
  RecordPaymentInput,
} from '@/lib/services/debts'

export function useDebts(filters?: DebtFilters) {
  const { tenant } = useAuth()
  const { currentStore } = useStore()
  const queryClient = useQueryClient()
  const supabase = createClient()

  const query = useQuery({
    queryKey: ['debts', tenant?.id, currentStore?.id, filters],
    queryFn: () => getDebts(tenant!.id, { ...filters, storeId: currentStore!.id }),
    enabled: !!tenant && !!currentStore?.id,
    staleTime: 30000,
  })

  // Subscribe to realtime changes
  useEffect(() => {
    if (!tenant?.id || !currentStore?.id) return

    const channel = supabase
      .channel('debts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `tenant_id=eq.${tenant.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['debts'] })
          queryClient.invalidateQueries({ queryKey: ['debt-summary'] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'debt_payments',
          filter: `tenant_id=eq.${tenant.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['debts'] })
          queryClient.invalidateQueries({ queryKey: ['debt-summary'] })
          queryClient.invalidateQueries({ queryKey: ['debts-by-customer'] })
          queryClient.invalidateQueries({ queryKey: ['debt-transaction'] })
          queryClient.invalidateQueries({ queryKey: ['payment-history'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenant?.id, currentStore?.id, queryClient, supabase])

  return query
}

export function useDebtSummary() {
  const { tenant } = useAuth()
  const { currentStore } = useStore()

  return useQuery({
    queryKey: ['debt-summary', tenant?.id, currentStore?.id],
    queryFn: () => getDebtSummary(tenant!.id, currentStore!.id),
    enabled: !!tenant && !!currentStore?.id,
    staleTime: 30000, // 30 seconds
  })
}

export function useDebtsByCustomer(filters?: { search?: string }) {
  const { tenant } = useAuth()

  return useQuery({
    queryKey: ['debts-by-customer', tenant?.id, filters],
    queryFn: () => getDebtsByCustomer(tenant!.id, filters),
    enabled: !!tenant,
    staleTime: 30000,
  })
}

export function useDebtTransaction(transactionId: string) {
  return useQuery({
    queryKey: ['debt-transaction', transactionId],
    queryFn: () => getDebtTransaction(transactionId),
    enabled: !!transactionId,
  })
}

export function usePaymentHistory(transactionId: string) {
  return useQuery({
    queryKey: ['payment-history', transactionId],
    queryFn: () => getPaymentHistory(transactionId),
    enabled: !!transactionId,
  })
}

export function useRecordPayment() {
  const { tenant, user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: RecordPaymentInput) =>
      recordDebtPayment(tenant!.id, user!.id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] })
      queryClient.invalidateQueries({ queryKey: ['debt-summary'] })
      queryClient.invalidateQueries({ queryKey: ['debt-transaction'] })
      queryClient.invalidateQueries({ queryKey: ['payment-history'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

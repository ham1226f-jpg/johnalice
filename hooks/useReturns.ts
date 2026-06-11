import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useStore } from '@/contexts/StoreContext'
import { createClient } from '@/lib/supabase/client'
import {
  createReturn,
  getReturns,
  getReturnById,
  approveReturn,
  rejectReturn,
  revertReturnToPending,
  CreateReturnData,
} from '@/lib/services/returns'

export function useReturns(filters?: {
  status?: string
  search?: string
  dateFrom?: string
  dateTo?: string
  page?: number
  pageSize?: number
}) {
  const { tenant } = useAuth()
  const { currentStore } = useStore()
  const queryClient = useQueryClient()
  const supabase = createClient()

  const query = useQuery({
    queryKey: ['returns', tenant?.id, currentStore?.id, filters],
    queryFn: () => getReturns(tenant!.id, { ...filters, storeId: currentStore!.id }),
    enabled: !!tenant && !!currentStore?.id,
    staleTime: 30000,
  })

  // Subscribe to realtime changes
  useEffect(() => {
    if (!tenant?.id || !currentStore?.id) return

    const channel = supabase
      .channel('returns-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'returns',
          filter: `tenant_id=eq.${tenant.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['returns', tenant.id, currentStore.id] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenant?.id, currentStore?.id, queryClient, supabase])

  return query
}

export function useReturn(returnId: string) {
  return useQuery({
    queryKey: ['return', returnId],
    queryFn: () => getReturnById(returnId),
    enabled: !!returnId,
    staleTime: 30000,
  })
}

export function useCreateReturn() {
  const { tenant, user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateReturnData) =>
      createReturn(tenant!.id, user!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] })
      // Invalidate dashboard in case it shows pending returns count
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === 'dashboard-kpis'
      })
    },
  })
}

export function useApproveReturn() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (returnId: string) => approveReturn(returnId, user!.id),
    onSuccess: () => {
      // Invalidate all related queries to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['returns'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['stock-history'] })
      queryClient.invalidateQueries({ queryKey: ['low-stock-products'] })
      // Use partial matching for dashboard-kpis since it has dynamic params
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === 'dashboard-kpis'
      })
      queryClient.invalidateQueries({ queryKey: ['sales-trend'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

export function useRejectReturn() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (returnId: string) => rejectReturn(returnId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] })
      // Invalidate dashboard in case it shows pending returns count
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === 'dashboard-kpis'
      })
    },
  })
}

export function useRevertReturnToPending() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (returnId: string) => revertReturnToPending(returnId),
    onSuccess: () => {
      // Invalidate all related queries to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['returns'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['stock-history'] })
      queryClient.invalidateQueries({ queryKey: ['low-stock-products'] })
      // Use partial matching for dashboard-kpis since it has dynamic params
      queryClient.invalidateQueries({ 
        predicate: (query) => query.queryKey[0] === 'dashboard-kpis'
      })
      queryClient.invalidateQueries({ queryKey: ['sales-trend'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

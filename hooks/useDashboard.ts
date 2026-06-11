import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useStore } from '@/contexts/StoreContext'
import { createClient } from '@/lib/supabase/client'
import { getDashboardKPIs, getLowStockProducts, getSalesTrend, getDailySummary, getPaymentMethodBreakdown } from '@/lib/services/dashboard'

export function useDashboardKPIs(startDate?: Date, endDate?: Date) {
  const { tenant } = useAuth()
  const { currentStore } = useStore()
  const queryClient = useQueryClient()
  const supabase = createClient()

  const query = useQuery({
    queryKey: ['dashboard-kpis', tenant?.id, currentStore?.id, startDate, endDate],
    queryFn: () => getDashboardKPIs(tenant!.id, startDate, endDate, currentStore!.id),
    enabled: !!tenant && !!currentStore?.id,
    staleTime: 30000,
    refetchInterval: 30000,
  })

  // Subscribe to realtime changes for dashboard-related tables
  useEffect(() => {
    if (!tenant?.id || !currentStore?.id) return

    const channel = supabase
      .channel('dashboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `tenant_id=eq.${tenant.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] })
          queryClient.invalidateQueries({ queryKey: ['sales-trend'] })
          queryClient.invalidateQueries({ queryKey: ['daily-summary'] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `tenant_id=eq.${tenant.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['low-stock-products'] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `tenant_id=eq.${tenant.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] })
          queryClient.invalidateQueries({ queryKey: ['daily-summary'] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'returns',
          filter: `tenant_id=eq.${tenant.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] })
          queryClient.invalidateQueries({ queryKey: ['sales-trend'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenant?.id, currentStore?.id, queryClient, supabase])

  return query
}

export function useLowStockProducts() {
  const { tenant } = useAuth()
  const { currentStore } = useStore()

  return useQuery({
    queryKey: ['low-stock-products', tenant?.id, currentStore?.id],
    queryFn: () => getLowStockProducts(tenant!.id, currentStore!.id),
    enabled: !!tenant && !!currentStore?.id,
    staleTime: 60000,
  })
}

export function useSalesTrend(days: number = 30, startDate?: Date, endDate?: Date) {
  const { tenant } = useAuth()
  const { currentStore } = useStore()

  return useQuery({
    queryKey: ['sales-trend', tenant?.id, currentStore?.id, days, startDate, endDate],
    queryFn: () => getSalesTrend(tenant!.id, days, startDate, endDate, currentStore!.id),
    enabled: !!tenant && !!currentStore?.id,
    staleTime: 30000,
  })
}


export function useDailySummary(startDate?: Date, endDate?: Date) {
  const { tenant } = useAuth()
  const { currentStore } = useStore()

  return useQuery({
    queryKey: ['daily-summary', tenant?.id, currentStore?.id, startDate, endDate],
    queryFn: () => getDailySummary(tenant!.id, startDate, endDate, currentStore!.id),
    enabled: !!tenant && !!currentStore?.id,
    staleTime: 30000,
    refetchInterval: 30000,
  })
}

export function usePaymentMethodBreakdown(startDate?: Date, endDate?: Date) {
  const { tenant } = useAuth()
  const { currentStore } = useStore()

  return useQuery({
    queryKey: ['payment-method-breakdown', tenant?.id, currentStore?.id, startDate, endDate],
    queryFn: () => getPaymentMethodBreakdown(tenant!.id, startDate, endDate, currentStore!.id),
    enabled: !!tenant && !!currentStore?.id,
    staleTime: 30000,
  })
}

export function useInventoryAnalytics() {
  const { tenant } = useAuth()
  const { currentStore } = useStore()
  const queryClient = useQueryClient()
  const supabase = createClient()

  const query = useQuery({
    queryKey: ['inventory-analytics', tenant?.id, currentStore?.id],
    queryFn: async () => {
      const { getInventoryAnalytics } = await import('@/lib/services/dashboard')
      return getInventoryAnalytics(tenant!.id, currentStore!.id)
    },
    enabled: !!tenant && !!currentStore?.id,
    staleTime: 60000,
  })

  // Subscribe to product changes
  useEffect(() => {
    if (!tenant?.id || !currentStore?.id) return

    const channel = supabase
      .channel('inventory-analytics-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `tenant_id=eq.${tenant.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['inventory-analytics'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenant?.id, currentStore?.id, queryClient, supabase])

  return query
}

export function useTopProducts(limit: number = 10, startDate?: Date, endDate?: Date) {
  const { tenant } = useAuth()
  const { currentStore } = useStore()

  return useQuery({
    queryKey: ['top-products', tenant?.id, currentStore?.id, limit, startDate, endDate],
    queryFn: async () => {
      const { getTopProducts } = await import('@/lib/services/dashboard')
      return getTopProducts(tenant!.id, limit, startDate, endDate, currentStore!.id)
    },
    enabled: !!tenant && !!currentStore?.id,
    staleTime: 60000,
  })
}

export function useCategoryStockValue() {
  const { tenant } = useAuth()
  const { currentStore } = useStore()

  return useQuery({
    queryKey: ['category-stock-value', tenant?.id, currentStore?.id],
    queryFn: async () => {
      const { getCategoryStockValue } = await import('@/lib/services/dashboard')
      return getCategoryStockValue(tenant!.id, currentStore!.id)
    },
    enabled: !!tenant && !!currentStore?.id,
    staleTime: 60000,
  })
}

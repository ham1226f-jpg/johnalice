import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { adjustStock, getStockHistory, StockAdjustmentInput } from '@/lib/services/stock'

export function useAdjustStock() {
  const { tenant, user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: StockAdjustmentInput) =>
      adjustStock(tenant!.id, user!.id, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product', variables.productId] })
      queryClient.invalidateQueries({ queryKey: ['stock-history', variables.productId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] })
      queryClient.invalidateQueries({ queryKey: ['low-stock-products'] })
    },
  })
}

export function useStockHistory(productId: string, filters?: {
  type?: string
  page?: number
  pageSize?: number
}) {
  return useQuery({
    queryKey: ['stock-history', productId, filters],
    queryFn: () => getStockHistory(productId, filters),
    enabled: !!productId,
  })
}

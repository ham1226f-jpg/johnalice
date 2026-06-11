import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useStore } from '@/contexts/StoreContext'
import { createClient } from '@/lib/supabase/client'
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  archiveProduct,
  restoreProduct,
  getCategories,
  CreateProductInput,
  UpdateProductInput,
} from '@/lib/services/products'

export function useProducts(filters?: {
  search?: string
  category?: string
  archived?: boolean
  page?: number
  pageSize?: number
}) {
  const { tenant } = useAuth()
  const { currentStore } = useStore()
  const queryClient = useQueryClient()
  const supabase = createClient()

  const query = useQuery({
    queryKey: ['products', tenant?.id, currentStore?.id, filters],
    queryFn: () => getProducts(tenant!.id, { ...filters, storeId: currentStore!.id }),
    enabled: !!tenant?.id && !!currentStore?.id,
    staleTime: 60 * 1000, // Override default to 60 seconds for products
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: false, // Don't refetch on window focus
  })

  // Subscribe to realtime changes
  useEffect(() => {
    if (!tenant?.id || !currentStore?.id) return

    const channel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: `tenant_id=eq.${tenant.id}`,
        },
        () => {
          // Invalidate products queries when any change occurs
          // Use a small delay to batch multiple rapid changes
          setTimeout(() => {
            queryClient.invalidateQueries({ 
              queryKey: ['products', tenant.id, currentStore.id],
              refetchType: 'active' // Only refetch active queries
            })
          }, 500)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenant?.id, currentStore?.id, queryClient, supabase])

  return query
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id),
    enabled: !!id,
  })
}

export function useCreateProduct() {
  const { tenant, user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateProductInput) => {
      const { store_id, ...productData } = input
      return createProduct(tenant!.id, user!.id, productData, store_id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.refetchQueries({ queryKey: ['products'], type: 'active' })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateProductInput) => updateProduct(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product', data.id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.refetchQueries({ queryKey: ['products'], type: 'active' })
    },
  })
}

export function useArchiveProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => archiveProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.refetchQueries({ queryKey: ['products'], type: 'active' })
    },
  })
}

export function useRestoreProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => restoreProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })
}

export function useCategories() {
  const { tenant } = useAuth()

  return useQuery({
    queryKey: ['categories', tenant?.id],
    queryFn: () => getCategories(tenant!.id),
    enabled: !!tenant,
  })
}

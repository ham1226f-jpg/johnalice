import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useStore } from '@/contexts/StoreContext'
import { createClient } from '@/lib/supabase/client'
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  getCustomerTransactions,
  createCustomerWithCredit,
  CreateCustomerInput,
  UpdateCustomerInput,
  CreateCustomerWithCreditInput,
} from '@/lib/services/customers'

export function useCustomers(filters?: {
  search?: string
  page?: number
  pageSize?: number
}) {
  const { tenant } = useAuth()
  const { currentStore } = useStore()
  const queryClient = useQueryClient()
  const supabase = createClient()

  const query = useQuery({
    queryKey: ['customers', tenant?.id, currentStore?.id, filters],
    queryFn: () => getCustomers(tenant!.id, { ...filters, storeId: currentStore!.id }),
    enabled: !!tenant && !!currentStore?.id,
  })

  // Subscribe to realtime changes
  useEffect(() => {
    if (!tenant?.id || !currentStore?.id) return

    const channel = supabase
      .channel('customers-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customers',
          filter: `tenant_id=eq.${tenant.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['customers', tenant.id, currentStore.id] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tenant?.id, currentStore?.id, queryClient, supabase])

  return query
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => getCustomer(id),
    enabled: !!id,
  })
}

export function useCreateCustomer() {
  const { tenant } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateCustomerInput) => {
      const { store_id, ...customerData } = input
      return createCustomer(tenant!.id, customerData, store_id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

export function useCreateCustomerWithCredit() {
  const { tenant } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateCustomerWithCreditInput) =>
      createCustomerWithCredit(tenant!.id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateCustomerInput) => updateCustomer(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customer', data.id] })
    },
  })
}

export function useCustomerTransactions(customerId: string, limit = 10) {
  return useQuery({
    queryKey: ['customer-transactions', customerId, limit],
    queryFn: () => getCustomerTransactions(customerId, limit),
    enabled: !!customerId,
  })
}

import {
  updateCustomerCredit,
  getCustomerCreditStatus,
  validateCreditSale,
  UpdateCustomerCreditInput,
} from '@/lib/services/customers'

export function useCustomerCreditStatus(customerId: string) {
  return useQuery({
    queryKey: ['customer-credit-status', customerId],
    queryFn: () => getCustomerCreditStatus(customerId),
    enabled: !!customerId,
  })
}

export function useUpdateCustomerCredit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateCustomerCreditInput) => updateCustomerCredit(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customer', data.id] })
      queryClient.invalidateQueries({ queryKey: ['customer-credit-status', data.id] })
    },
  })
}

export function useValidateCreditSale(customerId: string, saleAmount: number) {
  return useQuery({
    queryKey: ['validate-credit-sale', customerId, saleAmount],
    queryFn: () => validateCreditSale(customerId, saleAmount),
    enabled: !!customerId && saleAmount > 0,
  })
}

import { deleteCustomer } from '@/lib/services/customers'

export function useDeleteCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (customerId: string) => deleteCustomer(customerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { Store } from '@/types'
import { getStoresForUser } from '@/lib/services/stores'
import { useAuth } from './AuthContext'

interface StoreContextType {
  currentStore: Store | null
  availableStores: Store[]
  loading: boolean
  switchStore: (storeId: string) => Promise<void>
  canSwitchStores: boolean
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

const STORE_STORAGE_KEY = 'selected_store_id'

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user, tenant, loading: authLoading } = useAuth()
  const [currentStore, setCurrentStore] = useState<Store | null>(null)
  const [availableStores, setAvailableStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)

  // Determine if user can switch stores
  const canSwitchStores = user?.role === 'admin' && availableStores.length > 1

  // Load available stores when user/tenant changes
  useEffect(() => {
    if (authLoading) {
      return
    }

    if (!user || !tenant) {
      setCurrentStore(null)
      setAvailableStores([])
      setLoading(false)
      return
    }

    loadStores()
  }, [user, tenant, authLoading])

  async function loadStores() {
    if (!user || !tenant) return

    try {
      setLoading(true)
      
      // Fetch available stores for user
      const stores = await getStoresForUser(tenant.id, user.id, user.role)
      setAvailableStores(stores)

      if (stores.length === 0) {
        console.error('Store not found: No stores available for user')
        setCurrentStore(null)
        return
      }

      // Determine which store to select
      let selectedStore: Store | null = null

      if (user.role === 'sales_person') {
        // Sales persons: auto-select their assigned store
        selectedStore = stores.find(s => s.id === user.store_id) || stores[0]
      } else {
        // Admins: try to restore last selected store
        const storedStoreId = getStoredStoreId()
        
        if (storedStoreId) {
          selectedStore = stores.find(s => s.id === storedStoreId) || null
          
          // If stored store is invalid (not in available stores), clear it
          if (!selectedStore) {
            console.error('Store not found: Stored store selection is no longer valid, clearing storage')
            clearStoredStoreId()
          }
        }
        
        // Fallback to first available store
        if (!selectedStore) {
          selectedStore = stores[0]
        }
      }

      setCurrentStore(selectedStore)
      
      // Persist selection
      if (selectedStore) {
        saveStoreId(selectedStore.id)
      }
    } catch (error) {
      console.error('Error loading stores:', error)
      setCurrentStore(null)
      setAvailableStores([])
    } finally {
      setLoading(false)
    }
  }

  const switchStore = useCallback(async (storeId: string) => {
    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can switch stores')
    }

    const store = availableStores.find(s => s.id === storeId)
    if (!store) {
      throw new Error('Store not found')
    }

    setCurrentStore(store)
    saveStoreId(storeId)
  }, [user, availableStores])

  // Helper functions for storage
  function clearStoredStoreId() {
    try {
      sessionStorage.removeItem(STORE_STORAGE_KEY)
      localStorage.removeItem(STORE_STORAGE_KEY)
    } catch (error) {
      console.error('Error clearing stored store ID:', error)
    }
  }

  function getStoredStoreId(): string | null {
    try {
      // Try sessionStorage first
      const sessionStoreId = sessionStorage.getItem(STORE_STORAGE_KEY)
      if (sessionStoreId) return sessionStoreId

      // Fallback to localStorage
      const localStoreId = localStorage.getItem(STORE_STORAGE_KEY)
      return localStoreId
    } catch (error) {
      console.error('Error reading stored store ID:', error)
      return null
    }
  }

  function saveStoreId(storeId: string) {
    try {
      sessionStorage.setItem(STORE_STORAGE_KEY, storeId)
      localStorage.setItem(STORE_STORAGE_KEY, storeId)
    } catch (error) {
      console.error('Error saving store ID:', error)
    }
  }

  const value: StoreContextType = {
    currentStore,
    availableStores,
    loading,
    switchStore,
    canSwitchStores,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const context = useContext(StoreContext)
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
}

'use client'

import { useState } from 'react'
import { useStore } from '@/contexts/StoreContext'
import { Store as StoreIcon, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function StoreSelector() {
  const { currentStore, availableStores, switchStore, canSwitchStores, loading } = useStore()
  const [isSwitching, setIsSwitching] = useState(false)

  const handleStoreChange = async (storeId: string) => {
    if (!canSwitchStores || storeId === currentStore?.id) {
      return
    }

    const previousStore = currentStore
    setIsSwitching(true)

    try {
      await switchStore(storeId)
      const newStore = availableStores.find(s => s.id === storeId)
      toast.success(`Switched to ${newStore?.name}`)
    } catch (error: any) {
      // Revert to previous store on error
      console.error('Store switch failed:', error)
      toast.error(error.message || 'Failed to switch store')
      
      // The context should still have the previous store, but we ensure it
      if (previousStore && currentStore?.id !== previousStore.id) {
        try {
          await switchStore(previousStore.id)
        } catch (revertError) {
          console.error('Failed to revert store:', revertError)
        }
      }
    } finally {
      setIsSwitching(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
        <StoreIcon className="h-4 w-4 animate-pulse" />
        <span className="hidden sm:inline">Loading...</span>
      </div>
    )
  }

  // No store available
  if (!currentStore) {
    return null
  }

  // Read-only display (sales person or single store)
  if (!canSwitchStores) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm">
        <StoreIcon className="h-4 w-4 text-muted-foreground" />
        <span className="hidden sm:inline font-medium">{currentStore.name}</span>
      </div>
    )
  }

  // Switchable dropdown (admin with multiple stores)
  return (
    <div className="flex items-center gap-2">
      <StoreIcon className="h-4 w-4 text-muted-foreground hidden sm:block" />
      <Select
        value={currentStore.id}
        onValueChange={handleStoreChange}
        disabled={isSwitching}
      >
        <SelectTrigger className="w-[180px] h-9">
          <SelectValue>
            {isSwitching ? 'Switching...' : currentStore.name}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {availableStores.map((store) => (
            <SelectItem key={store.id} value={store.id}>
              {store.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

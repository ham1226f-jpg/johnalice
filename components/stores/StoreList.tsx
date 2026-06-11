'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Store } from '@/types'
import { getStoresForUser, deleteStore } from '@/lib/services/stores'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StoreForm } from './StoreForm'
import { format } from 'date-fns'
import {
  Plus,
  Store as StoreIcon,
  Edit,
  Trash2,
  Settings,
} from 'lucide-react'
import { toast } from 'sonner'

export function StoreList() {
  const { user, tenant } = useAuth()
  const [stores, setStores] = useState<Store[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showStoreForm, setShowStoreForm] = useState(false)
  const [selectedStore, setSelectedStore] = useState<Store | null>(null)

  useEffect(() => {
    if (user && tenant) {
      loadStores()
    }
  }, [user, tenant])

  async function loadStores() {
    if (!user || !tenant) return

    try {
      setIsLoading(true)
      const data = await getStoresForUser(tenant.id, user.id, user.role)
      setStores(data)
    } catch (error: any) {
      toast.error(error.message || 'Failed to load stores')
    } finally {
      setIsLoading(false)
    }
  }

  const openEditForm = (store: Store) => {
    setSelectedStore(store)
    setShowStoreForm(true)
  }

  const openCreateForm = () => {
    setSelectedStore(null)
    setShowStoreForm(true)
  }

  const handleDelete = async (store: Store) => {
    if (!confirm(`Are you sure you want to delete store "${store.name}"? This action cannot be undone and will fail if the store has associated data.`)) {
      return
    }

    try {
      await deleteStore(store.id)
      toast.success('Store deleted successfully')
      loadStores()
    } catch (error: any) {
      // Extract dependency information from error message
      const errorMessage = error.message || 'Failed to delete store'
      toast.error(errorMessage)
    }
  }

  const handleFormSuccess = () => {
    loadStores()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Stores</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {stores.length} {stores.length === 1 ? 'store' : 'stores'} in your organization
          </p>
        </div>
        <Button onClick={openCreateForm}>
          <Plus className="h-4 w-4 mr-2" />
          Add Store
        </Button>
      </div>

      {/* Stores List */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <div className="space-y-3">
                <div className="h-4 bg-muted animate-pulse rounded" />
                <div className="h-6 bg-muted animate-pulse rounded" />
                <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
              </div>
            </Card>
          ))}
        </div>
      ) : stores.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <Card key={store.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <StoreIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{store.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        Created {format(new Date(store.created_at), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Store Settings */}
                {(store.settings?.low_stock_threshold || store.settings?.currency || store.settings?.tax_rate) && (
                  <div className="space-y-1">
                    {store.settings.low_stock_threshold && (
                      <div className="flex items-center gap-2 text-sm">
                        <Settings className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Low Stock: {store.settings.low_stock_threshold}
                        </span>
                      </div>
                    )}
                    {store.settings.currency && (
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className="text-xs">
                          {store.settings.currency}
                        </Badge>
                      </div>
                    )}
                    {store.settings.tax_rate && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">
                          Tax: {store.settings.tax_rate}%
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditForm(store)}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(store)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <StoreIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No stores found</h3>
          <p className="text-muted-foreground mb-4">
            Get started by adding your first store
          </p>
          <Button onClick={openCreateForm}>
            <Plus className="h-4 w-4 mr-2" />
            Add Store
          </Button>
        </Card>
      )}

      {/* Store Form Modal */}
      <StoreForm
        store={selectedStore}
        open={showStoreForm}
        onOpenChange={(open) => {
          setShowStoreForm(open)
          if (!open) setSelectedStore(null)
        }}
        onSuccess={handleFormSuccess}
      />
    </div>
  )
}

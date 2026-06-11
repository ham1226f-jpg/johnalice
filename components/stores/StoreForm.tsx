'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { Store } from '@/types'
import { createStore, updateStore } from '@/lib/services/stores'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

const storeSchema = z.object({
  name: z.string().min(1, 'Store name is required').max(100, 'Store name is too long'),
  low_stock_threshold: z.number().min(0, 'Must be 0 or greater').optional(),
  currency: z.string().optional(),
  tax_rate: z.number().min(0, 'Must be 0 or greater').max(100, 'Must be 100 or less').optional(),
})

type StoreFormData = z.infer<typeof storeSchema>

interface StoreFormProps {
  store: Store | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function StoreForm({ store, open, onOpenChange, onSuccess }: StoreFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { tenant } = useAuth()

  const isEditing = !!store

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StoreFormData>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      name: '',
      low_stock_threshold: undefined,
      currency: '',
      tax_rate: undefined,
    },
  })

  useEffect(() => {
    if (store) {
      reset({
        name: store.name,
        low_stock_threshold: store.settings?.low_stock_threshold,
        currency: store.settings?.currency || '',
        tax_rate: store.settings?.tax_rate,
      })
    } else {
      reset({
        name: '',
        low_stock_threshold: undefined,
        currency: '',
        tax_rate: undefined,
      })
    }
  }, [store, reset])

  async function onSubmit(data: StoreFormData) {
    if (!tenant) {
      toast.error('No tenant found')
      return
    }

    setIsLoading(true)
    try {
      const settings = {
        low_stock_threshold: data.low_stock_threshold,
        currency: data.currency || undefined,
        tax_rate: data.tax_rate,
      }

      if (isEditing) {
        await updateStore(store.id, {
          name: data.name,
          settings,
        })
        toast.success('Store updated successfully')
      } else {
        await createStore(tenant.id, {
          name: data.name,
          settings,
        })
        toast.success('Store created successfully')
      }

      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || `Failed to ${isEditing ? 'update' : 'create'} store`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Store' : 'Add New Store'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Store Name *</Label>
            <Input
              {...register('name')}
              placeholder="Main Store"
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
            <Input
              {...register('low_stock_threshold', { valueAsNumber: true })}
              type="number"
              placeholder="10"
            />
            {errors.low_stock_threshold && (
              <p className="text-sm text-destructive mt-1">{errors.low_stock_threshold.message}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Alert when product stock falls below this level
            </p>
          </div>

          <div>
            <Label htmlFor="currency">Currency</Label>
            <Input
              {...register('currency')}
              placeholder="KES"
            />
            {errors.currency && (
              <p className="text-sm text-destructive mt-1">{errors.currency.message}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Currency code for this store (e.g., KES, USD)
            </p>
          </div>

          <div>
            <Label htmlFor="tax_rate">Tax Rate (%)</Label>
            <Input
              {...register('tax_rate', { valueAsNumber: true })}
              type="number"
              step="0.01"
              placeholder="16"
            />
            {errors.tax_rate && (
              <p className="text-sm text-destructive mt-1">{errors.tax_rate.message}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Tax rate percentage for this store
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading 
                ? (isEditing ? 'Updating...' : 'Creating...') 
                : (isEditing ? 'Update Store' : 'Create Store')
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

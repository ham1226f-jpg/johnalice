'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAdjustStock } from '@/hooks/useStock'
import { toast } from 'sonner'
import { Product } from '@/types'

const adjustmentSchema = z.object({
  type: z.enum(['restock', 'adjustment']),
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  reason: z.string().min(3, 'Reason must be at least 3 characters'),
})

type AdjustmentFormData = z.infer<typeof adjustmentSchema>

interface StockAdjustmentModalProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StockAdjustmentModal({ product, open, onOpenChange }: StockAdjustmentModalProps) {
  const [isAdjustment, setIsAdjustment] = useState(false)
  const adjustStock = useAdjustStock()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<AdjustmentFormData>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      type: 'restock',
      quantity: 0,
      reason: '',
    },
  })

  const quantity = watch('quantity')

  async function onSubmit(data: AdjustmentFormData) {
    if (!product) return

    try {
      // For adjustment, calculate the difference to reach the target quantity
      // For restock, just add the quantity
      const quantityChange = isAdjustment 
        ? data.quantity - Number(product.stock_quantity) // Set to specific quantity
        : data.quantity // Add to existing quantity

      await adjustStock.mutateAsync({
        productId: product.id,
        type: data.type,
        quantityChange,
        reason: data.reason,
      })

      toast.success(`Stock ${data.type === 'restock' ? 'restocked' : 'adjusted'} successfully`)
      reset()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to adjust stock')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Stock - {product?.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Current Stock</Label>
            <p className="text-2xl font-bold">{product?.stock_quantity} {product?.base_unit}</p>
          </div>

          <div>
            <Label htmlFor="type">Type</Label>
            <select
              {...register('type')}
              id="type"
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              onChange={(e) => setIsAdjustment(e.target.value === 'adjustment')}
            >
              <option value="restock">Restock (Add to current stock)</option>
              <option value="adjustment">Adjustment (Set to specific quantity)</option>
            </select>
            {errors.type && (
              <p className="mt-1 text-sm text-destructive">{errors.type.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="quantity">
              {isAdjustment ? 'New Stock Quantity' : 'Quantity to Add'}
            </Label>
            <Input
              {...register('quantity', { valueAsNumber: true })}
              id="quantity"
              type="number"
              step="0.01"
              placeholder={isAdjustment ? 'Enter new total quantity' : 'Enter quantity to add'}
            />
            {isAdjustment && product && quantity !== undefined && (
              <p className="text-xs text-muted-foreground mt-1">
                Current: {product.stock_quantity} {product.base_unit} → Change: {' '}
                <span className={quantity - Number(product.stock_quantity) >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {quantity - Number(product.stock_quantity) >= 0 ? '+' : ''}
                  {(quantity - Number(product.stock_quantity)).toFixed(2)} {product.base_unit}
                </span>
              </p>
            )}
            {errors.quantity && (
              <p className="mt-1 text-sm text-destructive">{errors.quantity.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="reason">Reason</Label>
            <textarea
              {...register('reason')}
              id="reason"
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              placeholder="Enter reason for adjustment"
            />
            {errors.reason && (
              <p className="mt-1 text-sm text-destructive">{errors.reason.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={adjustStock.isPending}>
              {adjustStock.isPending ? 'Adjusting...' : 'Adjust Stock'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

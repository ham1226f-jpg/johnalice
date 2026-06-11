'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useCreateReturn } from '@/hooks/useReturns'
import { useTransaction } from '@/hooks/useTransactions'
import { useStore } from '@/contexts/StoreContext'
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
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Minus, Plus, Package, AlertCircle } from 'lucide-react'

const returnSchema = z.object({
  transaction_id: z.string().min(1, 'Transaction is required'),
  reason: z.string().min(10, 'Please provide a detailed reason (at least 10 characters)'),
})

type ReturnFormData = z.infer<typeof returnSchema>

interface CreateReturnModalProps {
  transactionId?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ReturnItemState {
  product_id: string
  product_name: string
  product_sku: string
  max_quantity: number
  unit_price: number
  quantity: number
}

export function CreateReturnModal({ transactionId, open, onOpenChange }: CreateReturnModalProps) {
  const { currentStore } = useStore()
  const [isLoading, setIsLoading] = useState(false)
  const [returnItems, setReturnItems] = useState<ReturnItemState[]>([])
  const [storeValidationError, setStoreValidationError] = useState<string | null>(null)
  const createReturn = useCreateReturn()

  const { data: transaction } = useTransaction(transactionId || '')

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ReturnFormData>({
    resolver: zodResolver(returnSchema),
    defaultValues: {
      transaction_id: transactionId || '',
      reason: '',
    },
  })

  // Update transaction_id when prop changes
  useEffect(() => {
    if (transactionId) {
      setValue('transaction_id', transactionId)
    }
  }, [transactionId, setValue])

  // Initialize return items from transaction and validate store
  useEffect(() => {
    if (transaction?.items) {
      // Validate transaction belongs to current store
      if (currentStore && transaction.store_id !== currentStore.id) {
        setStoreValidationError(
          `This transaction belongs to a different store. Please switch to the correct store to process this return.`
        )
        setReturnItems([])
      } else {
        setStoreValidationError(null)
        setReturnItems(
          transaction.items.map((item: any) => ({
            product_id: item.product_id,
            product_name: item.product_name,
            product_sku: item.product_sku,
            max_quantity: item.quantity,
            unit_price: item.unit_price,
            quantity: 0,
          }))
        )
      }
    }
  }, [transaction, currentStore])

  const updateItemQuantity = (productId: string, delta: number) => {
    setReturnItems(items =>
      items.map(item => {
        if (item.product_id === productId) {
          const newQuantity = Math.max(0, Math.min(item.max_quantity, item.quantity + delta))
          return { ...item, quantity: newQuantity }
        }
        return item
      })
    )
  }

  const setItemQuantity = (productId: string, quantity: number) => {
    setReturnItems(items =>
      items.map(item => {
        if (item.product_id === productId) {
          const newQuantity = Math.max(0, Math.min(item.max_quantity, quantity))
          return { ...item, quantity: newQuantity }
        }
        return item
      })
    )
  }

  const selectedItems = returnItems.filter(item => item.quantity > 0)
  const totalAmount = selectedItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)

  async function onSubmit(data: ReturnFormData) {
    if (storeValidationError) {
      toast.error('Cannot process return: transaction from different store')
      return
    }

    if (selectedItems.length === 0) {
      toast.error('Please select at least one item to return')
      return
    }

    if (!currentStore) {
      toast.error('No store selected')
      return
    }

    setIsLoading(true)
    try {
      await createReturn.mutateAsync({
        transaction_id: data.transaction_id,
        reason: data.reason,
        items: selectedItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.quantity * item.unit_price,
        })),
      })

      toast.success('Return request created successfully')
      onOpenChange(false)
      reset()
      setReturnItems([])
      setStoreValidationError(null)
    } catch (error: any) {
      toast.error(error.message || 'Failed to create return')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Return</DialogTitle>
          {transaction && (
            <div className="text-sm text-muted-foreground mt-2">
              Transaction: {transaction.transaction_number}
              {transaction.customer && ` • Customer: ${transaction.customer.name}`}
            </div>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Store Validation Error */}
          {storeValidationError && (
            <div className="p-4 bg-destructive/10 border border-destructive rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-destructive">Store Mismatch</p>
                <p className="text-sm text-destructive/90 mt-1">{storeValidationError}</p>
              </div>
            </div>
          )}

          {/* Items Selection */}
          <div>
            <Label>Select Items to Return</Label>
            <div className="mt-2 space-y-2">
              {returnItems.length > 0 ? (
                returnItems.map(item => (
                  <div
                    key={item.product_id}
                    className="flex items-center gap-4 p-3 border border-border rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{item.product_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        SKU: {item.product_sku} • KSH {item.unit_price.toFixed(2)} each
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Max returnable: {item.max_quantity}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateItemQuantity(item.product_id, -1)}
                        disabled={item.quantity === 0}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      
                      <Input
                        type="number"
                        min="0"
                        max={item.max_quantity}
                        value={item.quantity}
                        onChange={(e) => setItemQuantity(item.product_id, parseInt(e.target.value) || 0)}
                        className="w-20 text-center"
                      />
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateItemQuantity(item.product_id, 1)}
                        disabled={item.quantity >= item.max_quantity}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    {item.quantity > 0 && (
                      <div className="text-right min-w-[80px]">
                        <p className="font-semibold">
                          KSH {(item.quantity * item.unit_price).toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center border border-border rounded-lg">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    {transaction ? 'No items available for return' : 'Loading transaction items...'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Return Summary */}
          {selectedItems.length > 0 && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Selected Items:</span>
                <Badge>{selectedItems.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Return Amount:</span>
                <span className="text-lg font-bold">KSH {totalAmount.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Reason */}
          <div>
            <Label htmlFor="reason">Reason for Return *</Label>
            <textarea
              {...register('reason')}
              className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background min-h-[100px]"
              placeholder="Please provide a detailed reason for this return..."
            />
            {errors.reason && (
              <p className="text-sm text-destructive mt-1">{errors.reason.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || selectedItems.length === 0 || !!storeValidationError}
            >
              {isLoading ? 'Creating...' : 'Create Return Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

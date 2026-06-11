'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useExpenseCategories, useCreateExpense, useUpdateExpense } from '@/hooks/useExpenses'
import { useStore } from '@/contexts/StoreContext'
import { Expense } from '@/types'

interface ExpenseFormProps {
  expense?: Expense | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface FormData {
  category_id: string
  amount: string
  description: string
  receipt_reference: string
  expense_date: string
}

export function ExpenseForm({
  expense,
  open,
  onOpenChange,
  onSuccess,
}: ExpenseFormProps) {
  const { currentStore } = useStore()
  const { data: categories } = useExpenseCategories()
  const createExpense = useCreateExpense()
  const updateExpense = useUpdateExpense()

  const isEditing = !!expense

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      category_id: '',
      amount: '',
      description: '',
      receipt_reference: '',
      expense_date: new Date().toISOString().split('T')[0],
    },
  })

  const categoryId = watch('category_id')

  useEffect(() => {
    if (expense) {
      setValue('category_id', expense.category_id)
      setValue('amount', expense.amount.toString())
      setValue('description', expense.description || '')
      setValue('receipt_reference', expense.receipt_reference || '')
      setValue('expense_date', expense.expense_date)
    } else {
      reset({
        category_id: '',
        amount: '',
        description: '',
        receipt_reference: '',
        expense_date: new Date().toISOString().split('T')[0],
      })
    }
  }, [expense, setValue, reset])

  const onSubmit = async (data: FormData) => {
    if (!currentStore) {
      toast.error('No store selected')
      return
    }

    try {
      const payload = {
        category_id: data.category_id,
        amount: parseFloat(data.amount),
        description: data.description || undefined,
        receipt_reference: data.receipt_reference || undefined,
        expense_date: data.expense_date,
        store_id: currentStore.id,
      }

      if (isEditing && expense) {
        await updateExpense.mutateAsync({
          id: expense.id,
          ...payload,
        })
        toast.success('Expense updated')
      } else {
        await createExpense.mutateAsync(payload)
        toast.success('Expense created')
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save expense')
    }
  }

  const isPending = createExpense.isPending || updateExpense.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Current Store Display */}
          {currentStore && (
            <div className="p-3 bg-muted/50 rounded-md border">
              <Label className="text-xs text-muted-foreground">Store</Label>
              <p className="font-medium">{currentStore.name}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={categoryId}
              onValueChange={(value) => setValue('category_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="z-[100]">
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!categoryId && (
              <p className="text-sm text-red-500">Category is required</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              {...register('amount', { required: true, min: 0.01 })}
              placeholder="0.00"
            />
            {errors.amount && (
              <p className="text-sm text-red-500">Amount is required and must be greater than 0</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense_date">Date *</Label>
            <Input
              id="expense_date"
              type="date"
              {...register('expense_date', { required: true })}
            />
            {errors.expense_date && (
              <p className="text-sm text-red-500">Date is required</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Optional description"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="receipt_reference">Receipt Reference</Label>
            <Input
              id="receipt_reference"
              {...register('receipt_reference')}
              placeholder="Optional receipt number"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !categoryId}>
              {isPending ? 'Saving...' : isEditing ? 'Update' : 'Add Expense'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

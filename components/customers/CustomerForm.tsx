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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateCustomer, useUpdateCustomer, useUpdateCustomerCredit } from '@/hooks/useCustomers'
import { useStore } from '@/contexts/StoreContext'
import { Customer } from '@/types'

interface CustomerFormProps {
  customer?: Customer | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface FormData {
  name: string
  phone: string
  email: string
  is_credit_approved: boolean
  credit_limit: string
}

export function CustomerForm({ customer, open, onOpenChange, onSuccess }: CustomerFormProps) {
  const { currentStore } = useStore()
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()
  const updateCredit = useUpdateCustomerCredit()

  const isEditing = !!customer

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      is_credit_approved: false,
      credit_limit: '',
    },
  })

  const isCreditApproved = watch('is_credit_approved')

  useEffect(() => {
    if (customer) {
      setValue('name', customer.name)
      setValue('phone', customer.phone || '')
      setValue('email', customer.email || '')
      setValue('is_credit_approved', customer.is_credit_approved || false)
      setValue('credit_limit', customer.credit_limit?.toString() || '')
    } else {
      reset({ name: '', phone: '', email: '', is_credit_approved: false, credit_limit: '' })
    }
  }, [customer, setValue, reset])

  const onSubmit = async (data: FormData) => {
    if (!currentStore) {
      toast.error('No store selected')
      return
    }

    try {
      const creditLimit = data.is_credit_approved && data.credit_limit 
        ? parseFloat(data.credit_limit) 
        : null

      // Validate credit limit if approved
      if (data.is_credit_approved && (!creditLimit || creditLimit <= 0)) {
        toast.error('Credit limit must be greater than zero for approved customers')
        return
      }

      if (isEditing && customer) {
        // Update basic info
        await updateCustomer.mutateAsync({
          id: customer.id,
          name: data.name.trim(),
          phone: data.phone.trim() || undefined,
          email: data.email.trim() || undefined,
        })
        
        // Update credit settings
        await updateCredit.mutateAsync({
          id: customer.id,
          is_credit_approved: data.is_credit_approved,
          credit_limit: creditLimit,
        })
        
        toast.success('Customer updated')
      } else {
        const newCustomer = await createCustomer.mutateAsync({
          name: data.name.trim(),
          phone: data.phone.trim() || undefined,
          email: data.email.trim() || undefined,
          store_id: currentStore.id,
        })
        
        // Set credit settings if approved
        if (data.is_credit_approved && creditLimit) {
          await updateCredit.mutateAsync({
            id: newCustomer.id,
            is_credit_approved: true,
            credit_limit: creditLimit,
          })
        }
        
        toast.success('Customer created')
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save customer')
    }
  }

  const isPending = createCustomer.isPending || updateCustomer.isPending || updateCredit.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
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
            <Label htmlFor="name">Name *</Label>
            <Input id="name" {...register('name', { required: true })} placeholder="Customer name" />
            {errors.name && <p className="text-sm text-red-500">Name is required</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...register('phone')} placeholder="Phone number" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} placeholder="Email address" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="credit_approved">Credit Status</Label>
            <Select
              value={isCreditApproved ? 'true' : 'false'}
              onValueChange={(value) => setValue('is_credit_approved', value === 'true')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">Not Approved for Credit</SelectItem>
                <SelectItem value="true">Approved for Credit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isCreditApproved && (
            <div className="space-y-2">
              <Label htmlFor="credit_limit">Credit Limit *</Label>
              <Input
                id="credit_limit"
                type="number"
                step="0.01"
                min="0.01"
                {...register('credit_limit', { required: isCreditApproved, min: 0.01 })}
                placeholder="0.00"
              />
              {errors.credit_limit && (
                <p className="text-sm text-red-500">Credit limit is required and must be greater than 0</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

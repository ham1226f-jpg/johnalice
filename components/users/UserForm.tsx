'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useCreateUser, useUpdateUser } from '@/hooks/useUsers'
import { useAuth } from '@/contexts/AuthContext'
import { User } from '@/lib/services/users'
import { getStoresForUser } from '@/lib/services/stores'
import { Store } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(1, 'Full name is required'),
  role: z.enum(['admin', 'sales_person']),
  store_id: z.string().nullable(),
}).refine((data) => {
  // Store is required for sales_person role
  if (data.role === 'sales_person' && !data.store_id) {
    return false
  }
  return true
}, {
  message: 'Store is required for sales person role',
  path: ['store_id'],
})

const updateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  full_name: z.string().min(1, 'Full name is required'),
  role: z.enum(['admin', 'sales_person']),
  store_id: z.string().nullable(),
}).refine((data) => {
  // Store is required for sales_person role
  if (data.role === 'sales_person' && !data.store_id) {
    return false
  }
  return true
}, {
  message: 'Store is required for sales person role',
  path: ['store_id'],
})

type CreateUserFormData = z.infer<typeof createUserSchema>
type UpdateUserFormData = z.infer<typeof updateUserSchema>

interface UserFormProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserForm({ user, open, onOpenChange }: UserFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [availableStores, setAvailableStores] = useState<Store[]>([])
  const [loadingStores, setLoadingStores] = useState(false)
  const { user: currentUser, tenant } = useAuth()
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()

  const isEditing = !!user
  const isEditingSelf = isEditing && user?.id === currentUser?.id
  const isCurrentUserAdmin = currentUser?.role === 'admin'

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateUserFormData | UpdateUserFormData>({
    resolver: zodResolver(isEditing ? updateUserSchema : createUserSchema),
    defaultValues: {
      email: '',
      password: '',
      full_name: '',
      role: 'sales_person',
      store_id: null,
    },
  })

  const selectedRole = watch('role')
  const selectedStoreId = watch('store_id')

  // Load available stores when dialog opens
  useEffect(() => {
    if (open && currentUser && tenant) {
      loadStores()
    }
  }, [open, currentUser, tenant])

  async function loadStores() {
    if (!currentUser || !tenant) return

    try {
      setLoadingStores(true)
      const stores = await getStoresForUser(tenant.id, currentUser.id, currentUser.role)
      setAvailableStores(stores)
    } catch (error) {
      console.error('Error loading stores:', error)
      toast.error('Failed to load stores')
    } finally {
      setLoadingStores(false)
    }
  }

  useEffect(() => {
    if (user) {
      reset({
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        store_id: user.store_id,
      })
    } else {
      reset({
        email: '',
        password: '',
        full_name: '',
        role: 'sales_person',
        store_id: null,
      })
    }
  }, [user, reset])

  // Clear store_id when role changes to admin
  useEffect(() => {
    if (selectedRole === 'admin') {
      setValue('store_id', null)
    }
  }, [selectedRole, setValue])

  async function onSubmit(data: CreateUserFormData | UpdateUserFormData) {
    setIsLoading(true)
    try {
      if (isEditing) {
        await updateUser.mutateAsync({
          userId: user.id,
          data: data as UpdateUserFormData,
        })
        toast.success('User updated successfully')
      } else {
        await createUser.mutateAsync(data as CreateUserFormData)
        toast.success('User created successfully')
      }
      
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || `Failed to ${isEditing ? 'update' : 'create'} user`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit User' : 'Add New User'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              {...register('full_name')}
              placeholder="John Doe"
            />
            {errors.full_name && (
              <p className="text-sm text-destructive mt-1">{errors.full_name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              {...register('email')}
              type="email"
              placeholder="john@example.com"
              disabled={isEditing}
            />
            {errors.email && (
              <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
            )}
            {isEditing && (
              <p className="text-xs text-muted-foreground mt-1">
                Email cannot be changed after creation
              </p>
            )}
          </div>

          {!isEditing && (
            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                {...register('password')}
                type="password"
                placeholder="Minimum 8 characters"
              />
              {(errors as any).password && (
                <p className="text-sm text-destructive mt-1">{(errors as any).password?.message}</p>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="role">Role *</Label>
            <select
              {...register('role')}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              disabled={isEditingSelf && isCurrentUserAdmin}
            >
              <option value="sales_person">Sales Person</option>
              <option value="admin">Admin</option>
            </select>
            {errors.role && (
              <p className="text-sm text-destructive mt-1">{errors.role.message}</p>
            )}
            {isEditingSelf && isCurrentUserAdmin ? (
              <p className="text-xs text-muted-foreground mt-1">
                You cannot change your own role. Another admin must change it.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                Admins have full access. Sales persons can only access POS and view transactions.
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="store_id">
              Store {selectedRole === 'sales_person' && '*'}
            </Label>
            <Select
              value={selectedStoreId || ''}
              onValueChange={(value) => setValue('store_id', value || null)}
              disabled={selectedRole === 'admin' || loadingStores}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  selectedRole === 'admin' 
                    ? 'All Stores (Admin)' 
                    : loadingStores 
                    ? 'Loading stores...' 
                    : 'Select a store'
                } />
              </SelectTrigger>
              <SelectContent>
                {availableStores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.store_id && (
              <p className="text-sm text-destructive mt-1">{errors.store_id.message}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {selectedRole === 'admin' 
                ? 'Admins can access all stores' 
                : 'Sales persons are assigned to a specific store'}
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
                : (isEditing ? 'Update User' : 'Create User')
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

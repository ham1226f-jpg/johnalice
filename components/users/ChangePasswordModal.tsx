'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useChangeUserPassword, useChangeOwnPassword } from '@/hooks/useUsers'
import { useAuth } from '@/contexts/AuthContext'
import { User } from '@/lib/services/users'
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

const adminChangePasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

const selfChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type AdminChangePasswordFormData = z.infer<typeof adminChangePasswordSchema>
type SelfChangePasswordFormData = z.infer<typeof selfChangePasswordSchema>

interface ChangePasswordModalProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChangePasswordModal({ user, open, onOpenChange }: ChangePasswordModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { user: currentUser } = useAuth()
  const changeUserPassword = useChangeUserPassword()
  const changeOwnPassword = useChangeOwnPassword()

  const isSelf = user?.id === currentUser?.id
  const isAdmin = currentUser?.role === 'admin'

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SelfChangePasswordFormData | AdminChangePasswordFormData>({
    resolver: zodResolver(isSelf ? selfChangePasswordSchema : adminChangePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(data: SelfChangePasswordFormData | AdminChangePasswordFormData) {
    if (!user) return

    setIsLoading(true)
    try {
      if (isSelf) {
        const selfData = data as SelfChangePasswordFormData
        await changeOwnPassword.mutateAsync({
          currentPassword: selfData.currentPassword,
          newPassword: selfData.newPassword,
        })
      } else if (isAdmin) {
        const adminData = data as AdminChangePasswordFormData
        await changeUserPassword.mutateAsync({
          userId: user.id,
          newPassword: adminData.newPassword,
        })
      }
      
      toast.success('Password changed successfully')
      onOpenChange(false)
      reset()
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Change Password {isSelf ? '' : `for ${user.full_name}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {isSelf && (
            <div>
              <Label htmlFor="currentPassword">Current Password *</Label>
              <Input
                {...register('currentPassword')}
                type="password"
                placeholder="Enter current password"
              />
              {(errors as any).currentPassword && (
                <p className="text-sm text-destructive mt-1">{(errors as any).currentPassword?.message}</p>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="newPassword">New Password *</Label>
            <Input
              {...register('newPassword')}
              type="password"
              placeholder="Minimum 8 characters"
            />
            {errors.newPassword && (
              <p className="text-sm text-destructive mt-1">{errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirm New Password *</Label>
            <Input
              {...register('confirmPassword')}
              type="password"
              placeholder="Re-enter new password"
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false)
                reset()
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Changing...' : 'Change Password'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

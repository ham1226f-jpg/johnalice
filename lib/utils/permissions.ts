import { User } from '@/types'

export function canViewSensitiveData(user: User | null): boolean {
  if (!user) return false
  return user.role === 'admin'
}

export function isAdmin(user: User | null): boolean {
  return user?.role === 'admin'
}

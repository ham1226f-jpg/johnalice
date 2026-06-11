import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changeUserPassword,
  changeOwnPassword,
  CreateUserData,
  UpdateUserData,
} from '@/lib/services/users'

export function useUsers(filters?: {
  role?: string
  search?: string
  page?: number
  pageSize?: number
}) {
  const { tenant } = useAuth()

  return useQuery({
    queryKey: ['users', tenant?.id, filters],
    queryFn: () => getUsers(tenant!.id, filters),
    enabled: !!tenant,
    staleTime: 30000, // 30 seconds - users don't change that often
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
  })
}

export function useUser(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUserById(userId),
    enabled: !!userId,
    staleTime: 30000,
  })
}

export function useCreateUser() {
  const { tenant } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateUserData) => createUser(tenant!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.refetchQueries({ queryKey: ['users'], type: 'active' })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateUserData }) =>
      updateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.refetchQueries({ queryKey: ['users'], type: 'active' })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.refetchQueries({ queryKey: ['users'], type: 'active' })
    },
  })
}

export function useChangeUserPassword() {
  return useMutation({
    mutationFn: ({ userId, newPassword }: { userId: string; newPassword: string }) =>
      changeUserPassword(userId, newPassword),
  })
}

export function useChangeOwnPassword() {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      changeOwnPassword(currentPassword, newPassword),
  })
}

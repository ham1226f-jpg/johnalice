'use client'

import { useState, useEffect } from 'react'
import { useUsers, useDeleteUser } from '@/hooks/useUsers'
import { useAuth } from '@/contexts/AuthContext'
import { User } from '@/lib/services/users'
import { Store } from '@/types'
import { getStoresForUser } from '@/lib/services/stores'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { UserForm } from './UserForm'
import { ChangePasswordModal } from './ChangePasswordModal'
import { format } from 'date-fns'
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Users as UsersIcon,
  Edit,
  Trash2,
  Key,
  Shield,
  User as UserIcon,
  Store as StoreIcon,
} from 'lucide-react'
import { toast } from 'sonner'

export function UsersList() {
  const { user: currentUser, tenant } = useAuth()
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [page, setPage] = useState(1)
  const [showUserForm, setShowUserForm] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [storesMap, setStoresMap] = useState<Record<string, Store>>({})

  const { data: usersData, isLoading } = useUsers({
    search: search || undefined,
    role: role || undefined,
    page,
    pageSize: 20,
  })

  const deleteUser = useDeleteUser()

  // Load stores for display
  useEffect(() => {
    if (currentUser && tenant) {
      loadStores()
    }
  }, [currentUser, tenant])

  async function loadStores() {
    if (!currentUser || !tenant) return

    try {
      const stores = await getStoresForUser(tenant.id, currentUser.id, currentUser.role)
      const map: Record<string, Store> = {}
      stores.forEach(store => {
        map[store.id] = store
      })
      setStoresMap(map)
    } catch (error) {
      console.error('Error loading stores:', error)
    }
  }

  const getStoreName = (storeId: string | null): string => {
    if (!storeId) return 'All Stores'
    return storesMap[storeId]?.name || 'Unknown Store'
  }

  const openEditForm = (user: User) => {
    setSelectedUser(user)
    setShowUserForm(true)
  }

  const openPasswordModal = (user: User) => {
    setSelectedUser(user)
    setShowPasswordModal(true)
  }

  const handleDelete = async (user: User) => {
    // Prevent users from deleting their own account
    if (currentUser && user.id === currentUser.id) {
      toast.error('You cannot delete your own account')
      return
    }

    if (!confirm(`Are you sure you want to delete user "${user.full_name}"? This action cannot be undone.`)) {
      return
    }

    try {
      await deleteUser.mutateAsync(user.id)
      toast.success('User deleted successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-end">
        <Button onClick={() => setShowUserForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-48">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="sales_person">Sales Person</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Users List */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-4">
              <div className="space-y-3">
                <div className="h-4 bg-muted animate-pulse rounded" />
                <div className="h-6 bg-muted animate-pulse rounded" />
                <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
              </div>
            </Card>
          ))}
        </div>
      ) : usersData?.users.length ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {usersData.users.map((user: User) => (
              <Card key={user.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        {user.role === 'admin' ? (
                          <Shield className="h-6 w-6" />
                        ) : (
                          <UserIcon className="h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">{user.full_name}</h3>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role === 'admin' ? 'Admin' : 'Sales Person'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <StoreIcon className="h-4 w-4" />
                    <span>{getStoreName(user.store_id)}</span>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Created {format(new Date(user.created_at), 'MMM dd, yyyy')}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditForm(user)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openPasswordModal(user)}
                    >
                      <Key className="h-3 w-3 mr-1" />
                      Password
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(user)}
                      disabled={currentUser?.id === user.id}
                      title={currentUser?.id === user.id ? 'You cannot delete your own account' : 'Delete user'}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {usersData.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, usersData.total)} of{' '}
                {usersData.total} users
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <span className="text-sm text-muted-foreground px-2">
                  Page {page} of {usersData.totalPages}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(usersData.totalPages, p + 1))}
                  disabled={page === usersData.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <Card className="p-12 text-center">
          <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No users found</h3>
          <p className="text-muted-foreground mb-4">
            {search || role ? 'Try adjusting your filters' : 'Get started by adding your first user'}
          </p>
          <Button onClick={() => setShowUserForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </Card>
      )}

      {/* Modals */}
      <UserForm
        user={selectedUser}
        open={showUserForm}
        onOpenChange={(open) => {
          setShowUserForm(open)
          if (!open) setSelectedUser(null)
        }}
      />

      <ChangePasswordModal
        user={selectedUser}
        open={showPasswordModal}
        onOpenChange={(open) => {
          setShowPasswordModal(open)
          if (!open) setSelectedUser(null)
        }}
      />
    </div>
  )
}

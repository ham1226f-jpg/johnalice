import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { UsersList } from './UsersList'
import * as AuthContext from '@/contexts/AuthContext'
import * as useUsers from '@/hooks/useUsers'
import * as storesService from '@/lib/services/stores'
import { Store, User as UserType } from '@/types'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock dependencies
vi.mock('@/contexts/AuthContext')
vi.mock('@/hooks/useUsers')
vi.mock('@/lib/services/stores')
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockStore1: Store = {
  id: 'store-1',
  tenant_id: 'tenant-1',
  name: 'Main Store',
  settings: {},
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockStore2: Store = {
  id: 'store-2',
  tenant_id: 'tenant-1',
  name: 'Branch Store',
  settings: {},
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockAdminUser: UserType = {
  id: 'user-1',
  tenant_id: 'tenant-1',
  store_id: null,
  email: 'admin@example.com',
  full_name: 'Admin User',
  role: 'admin',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockSalesUser: UserType = {
  id: 'user-2',
  tenant_id: 'tenant-1',
  store_id: 'store-1',
  email: 'sales@example.com',
  full_name: 'Sales User',
  role: 'sales_person',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockTenant = {
  id: 'tenant-1',
  name: 'Test Tenant',
  created_at: '2024-01-01T00:00:00Z',
  settings: {
    low_stock_threshold: 10,
    currency: 'KES',
  },
}

describe('UsersList', () => {
  let queryClient: QueryClient
  let useAuthSpy: Mock
  let getStoresForUserSpy: Mock

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    useAuthSpy = vi.spyOn(AuthContext, 'useAuth') as Mock
    getStoresForUserSpy = vi.spyOn(storesService, 'getStoresForUser') as Mock

    // Mock useUsers hook
    vi.mocked(useUsers.useUsers).mockReturnValue({
      data: {
        users: [mockAdminUser, mockSalesUser],
        total: 2,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      },
      isLoading: false,
    } as any)

    // Mock useDeleteUser hook
    vi.mocked(useUsers.useDeleteUser).mockReturnValue({
      mutateAsync: vi.fn(),
    } as any)
  })

  it('should load and display stores', async () => {
    useAuthSpy.mockReturnValue({
      user: mockAdminUser,
      tenant: mockTenant,
      loading: false,
    })

    getStoresForUserSpy.mockResolvedValue([mockStore1, mockStore2])

    render(
      <QueryClientProvider client={queryClient}>
        <UsersList />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(getStoresForUserSpy).toHaveBeenCalledWith(
        'tenant-1',
        'user-1',
        'admin'
      )
    })
  })

  it('should display "All Stores" for admin users', async () => {
    useAuthSpy.mockReturnValue({
      user: mockAdminUser,
      tenant: mockTenant,
      loading: false,
    })

    getStoresForUserSpy.mockResolvedValue([mockStore1, mockStore2])

    render(
      <QueryClientProvider client={queryClient}>
        <UsersList />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('All Stores')).toBeInTheDocument()
    })
  })

  it('should display store name for sales person users', async () => {
    useAuthSpy.mockReturnValue({
      user: mockAdminUser,
      tenant: mockTenant,
      loading: false,
    })

    getStoresForUserSpy.mockResolvedValue([mockStore1, mockStore2])

    render(
      <QueryClientProvider client={queryClient}>
        <UsersList />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Main Store')).toBeInTheDocument()
    })
  })

  it('should display store icon for each user', async () => {
    useAuthSpy.mockReturnValue({
      user: mockAdminUser,
      tenant: mockTenant,
      loading: false,
    })

    getStoresForUserSpy.mockResolvedValue([mockStore1, mockStore2])

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <UsersList />
      </QueryClientProvider>
    )

    await waitFor(() => {
      // Check that store icons are rendered (lucide-react renders as svg)
      const storeIcons = container.querySelectorAll('svg')
      expect(storeIcons.length).toBeGreaterThan(0)
    })
  })
})

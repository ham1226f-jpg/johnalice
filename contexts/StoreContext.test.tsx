import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { StoreProvider, useStore } from './StoreContext'
import * as AuthContext from './AuthContext'
import * as storesService from '@/lib/services/stores'
import { Store, User, Tenant } from '@/types'

// Mock the stores service
vi.mock('@/lib/services/stores', () => ({
  getStoresForUser: vi.fn(),
}))

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null } })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  })),
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

const mockAdminUser: User = {
  id: 'user-1',
  tenant_id: 'tenant-1',
  store_id: null,
  email: 'admin@test.com',
  full_name: 'Admin User',
  role: 'admin',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockSalesPersonUser: User = {
  id: 'user-2',
  tenant_id: 'tenant-1',
  store_id: 'store-1',
  email: 'sales@test.com',
  full_name: 'Sales Person',
  role: 'sales_person',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockTenant: Tenant = {
  id: 'tenant-1',
  name: 'Test Tenant',
  created_at: '2024-01-01T00:00:00Z',
  settings: {
    low_stock_threshold: 10,
    currency: 'KES',
  },
}

// Test component that uses the store context
function TestComponent() {
  const { currentStore, availableStores, loading, canSwitchStores } = useStore()
  
  if (loading) {
    return <div>Loading...</div>
  }
  
  return (
    <div>
      <div data-testid="current-store">{currentStore?.name || 'No store'}</div>
      <div data-testid="available-stores">{availableStores.length}</div>
      <div data-testid="can-switch">{canSwitchStores ? 'yes' : 'no'}</div>
    </div>
  )
}

describe('StoreContext', () => {
  let useAuthSpy: Mock

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Spy on useAuth
    useAuthSpy = vi.spyOn(AuthContext, 'useAuth') as Mock
    
    // Mock storage APIs
    const storageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    }
    
    Object.defineProperty(global, 'sessionStorage', {
      value: storageMock,
      writable: true,
      configurable: true,
    })
    
    Object.defineProperty(global, 'localStorage', {
      value: storageMock,
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with loading state', () => {
    useAuthSpy.mockReturnValue({
      user: null,
      tenant: null,
      loading: true,
      supabaseUser: null,
      signIn: vi.fn(),
      signOut: vi.fn(),
      changePassword: vi.fn(),
    })

    render(
      <StoreProvider>
        <TestComponent />
      </StoreProvider>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should load stores for admin user', async () => {
    useAuthSpy.mockReturnValue({
      user: mockAdminUser,
      tenant: mockTenant,
      loading: false,
      supabaseUser: null,
      signIn: vi.fn(),
      signOut: vi.fn(),
      changePassword: vi.fn(),
    })

    vi.mocked(storesService.getStoresForUser).mockResolvedValue([mockStore1, mockStore2])

    render(
      <StoreProvider>
        <TestComponent />
      </StoreProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('current-store')).toHaveTextContent('Main Store')
    })

    expect(screen.getByTestId('available-stores')).toHaveTextContent('2')
    expect(screen.getByTestId('can-switch')).toHaveTextContent('yes')
  })

  it('should auto-select assigned store for sales person', async () => {
    useAuthSpy.mockReturnValue({
      user: mockSalesPersonUser,
      tenant: mockTenant,
      loading: false,
      supabaseUser: null,
      signIn: vi.fn(),
      signOut: vi.fn(),
      changePassword: vi.fn(),
    })

    vi.mocked(storesService.getStoresForUser).mockResolvedValue([mockStore1])

    render(
      <StoreProvider>
        <TestComponent />
      </StoreProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('current-store')).toHaveTextContent('Main Store')
    })

    expect(screen.getByTestId('available-stores')).toHaveTextContent('1')
    expect(screen.getByTestId('can-switch')).toHaveTextContent('no')
  })

  it('should set canSwitchStores to false for sales person', async () => {
    useAuthSpy.mockReturnValue({
      user: mockSalesPersonUser,
      tenant: mockTenant,
      loading: false,
      supabaseUser: null,
      signIn: vi.fn(),
      signOut: vi.fn(),
      changePassword: vi.fn(),
    })

    vi.mocked(storesService.getStoresForUser).mockResolvedValue([mockStore1])

    render(
      <StoreProvider>
        <TestComponent />
      </StoreProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('can-switch')).toHaveTextContent('no')
    })
  })

  it('should set canSwitchStores to true for admin with multiple stores', async () => {
    useAuthSpy.mockReturnValue({
      user: mockAdminUser,
      tenant: mockTenant,
      loading: false,
      supabaseUser: null,
      signIn: vi.fn(),
      signOut: vi.fn(),
      changePassword: vi.fn(),
    })

    vi.mocked(storesService.getStoresForUser).mockResolvedValue([mockStore1, mockStore2])

    render(
      <StoreProvider>
        <TestComponent />
      </StoreProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('can-switch')).toHaveTextContent('yes')
    })
  })

  it('should persist store selection to storage', async () => {
    useAuthSpy.mockReturnValue({
      user: mockAdminUser,
      tenant: mockTenant,
      loading: false,
      supabaseUser: null,
      signIn: vi.fn(),
      signOut: vi.fn(),
      changePassword: vi.fn(),
    })

    vi.mocked(storesService.getStoresForUser).mockResolvedValue([mockStore1, mockStore2])

    render(
      <StoreProvider>
        <TestComponent />
      </StoreProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('current-store')).toHaveTextContent('Main Store')
    })

    // Check that store ID was saved to storage
    expect(sessionStorage.setItem).toHaveBeenCalledWith('selected_store_id', 'store-1')
    expect(localStorage.setItem).toHaveBeenCalledWith('selected_store_id', 'store-1')
  })

  it('should handle no stores available', async () => {
    useAuthSpy.mockReturnValue({
      user: mockAdminUser,
      tenant: mockTenant,
      loading: false,
      supabaseUser: null,
      signIn: vi.fn(),
      signOut: vi.fn(),
      changePassword: vi.fn(),
    })

    vi.mocked(storesService.getStoresForUser).mockResolvedValue([])

    render(
      <StoreProvider>
        <TestComponent />
      </StoreProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('current-store')).toHaveTextContent('No store')
    })

    expect(screen.getByTestId('available-stores')).toHaveTextContent('0')
  })

  it('should handle errors when loading stores', async () => {
    useAuthSpy.mockReturnValue({
      user: mockAdminUser,
      tenant: mockTenant,
      loading: false,
      supabaseUser: null,
      signIn: vi.fn(),
      signOut: vi.fn(),
      changePassword: vi.fn(),
    })

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(storesService.getStoresForUser).mockRejectedValue(new Error('Failed to load stores'))

    render(
      <StoreProvider>
        <TestComponent />
      </StoreProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('current-store')).toHaveTextContent('No store')
    })

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading stores:', expect.any(Error))
    consoleErrorSpy.mockRestore()
  })
})

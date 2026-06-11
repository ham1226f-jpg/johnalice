import { render, screen, waitFor } from '@testing-library/react'
import { StoreProvider, useStore } from './StoreContext'
import { AuthProvider, useAuth } from './AuthContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock the Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      updateUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  }),
}))

// Mock the stores service
vi.mock('@/lib/services/stores', () => ({
  getStoresForUser: vi.fn().mockResolvedValue([]),
}))

describe('StoreContext Integration with AuthContext', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
    vi.clearAllMocks()
  })

  it('should wrap StoreProvider after AuthProvider', () => {
    const TestComponent = () => {
      const auth = useAuth()
      const store = useStore()
      
      return (
        <div>
          <div data-testid="auth-loading">{auth.loading ? 'loading' : 'ready'}</div>
          <div data-testid="store-loading">{store.loading ? 'loading' : 'ready'}</div>
        </div>
      )
    }

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StoreProvider>
            <TestComponent />
          </StoreProvider>
        </AuthProvider>
      </QueryClientProvider>
    )

    // Both contexts should be accessible
    expect(screen.getByTestId('auth-loading')).toBeInTheDocument()
    expect(screen.getByTestId('store-loading')).toBeInTheDocument()
  })

  it('should wait for auth to finish loading before initializing stores', async () => {
    const TestComponent = () => {
      const { loading: authLoading } = useAuth()
      const { loading: storeLoading } = useStore()
      
      return (
        <div>
          <div data-testid="auth-status">{authLoading ? 'auth-loading' : 'auth-ready'}</div>
          <div data-testid="store-status">{storeLoading ? 'store-loading' : 'store-ready'}</div>
        </div>
      )
    }

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StoreProvider>
            <TestComponent />
          </StoreProvider>
        </AuthProvider>
      </QueryClientProvider>
    )

    // Wait for both to finish loading
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('auth-ready')
    })

    await waitFor(() => {
      expect(screen.getByTestId('store-status')).toHaveTextContent('store-ready')
    })
  })

  it('should access user role and store assignment from AuthContext', async () => {
    const { getStoresForUser } = await import('@/lib/services/stores')
    const mockGetStoresForUser = vi.mocked(getStoresForUser)

    const TestComponent = () => {
      const { user } = useAuth()
      const { currentStore } = useStore()
      
      return (
        <div>
          <div data-testid="user-role">{user?.role || 'no-user'}</div>
          <div data-testid="current-store">{currentStore?.name || 'no-store'}</div>
        </div>
      )
    }

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StoreProvider>
            <TestComponent />
          </StoreProvider>
        </AuthProvider>
      </QueryClientProvider>
    )

    // Initially no user
    await waitFor(() => {
      expect(screen.getByTestId('user-role')).toHaveTextContent('no-user')
    })

    // Verify getStoresForUser is not called when no user
    expect(mockGetStoresForUser).not.toHaveBeenCalled()
  })
})

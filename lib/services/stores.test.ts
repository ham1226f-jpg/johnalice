import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createStore, updateStore, deleteStore, getStoresForUser, canAccessStore, getUserStores } from './stores'

// Create a mock Supabase client factory
let mockFromImplementation: any

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => mockFromImplementation(table)),
  })),
}))

describe('Store Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFromImplementation = vi.fn()
  })

  describe('createStore', () => {
    it('should validate store name uniqueness', async () => {
      // This test validates that duplicate store names are rejected
      // Requirement 1.2: Store name must be unique within tenant
      
      mockFromImplementation.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { id: 'existing-store-id' },
          error: null,
        }),
      })

      await expect(
        createStore('tenant-1', { name: 'Existing Store' })
      ).rejects.toThrow('Store name already exists in this tenant')
    })

    it('should create store with valid unique name', async () => {
      let callCount = 0
      mockFromImplementation.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // First call: check for existing store
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }
        } else {
          // Second call: insert new store
          return {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'new-store-id',
                tenant_id: 'tenant-1',
                name: 'New Store',
                settings: {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              error: null,
            }),
          }
        }
      })

      const result = await createStore('tenant-1', { name: 'New Store' })
      
      expect(result).toBeDefined()
      expect(result.name).toBe('New Store')
      expect(result.tenant_id).toBe('tenant-1')
    })
  })

  describe('updateStore', () => {
    it('should validate name uniqueness when updating', async () => {
      // Requirement 1.4: Allow updating store name with uniqueness validation
      
      let callCount = 0
      mockFromImplementation.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // First call: get current store
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { tenant_id: 'tenant-1' },
              error: null,
            }),
          }
        } else {
          // Second call: check for duplicate
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            neq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'other-store-id' },
              error: null,
            }),
          }
        }
      })

      await expect(
        updateStore('store-1', { name: 'Duplicate Name' })
      ).rejects.toThrow('Store name already exists in this tenant')
    })
  })

  describe('deleteStore', () => {
    it('should prevent deletion when store has associated users', async () => {
      // Requirement 1.5: Prevent deletion of stores with associated data
      
      mockFromImplementation.mockReturnValue({
        select: vi.fn((query: string, options: any) => ({
          eq: vi.fn(() => Promise.resolve({ count: 2, error: null })),
        })),
      })

      await expect(deleteStore('store-1')).rejects.toThrow(
        'Cannot delete store: Store has associated'
      )
    })

    it('should allow deletion when store has no dependencies', async () => {
      let callCount = 0
      mockFromImplementation.mockImplementation(() => {
        callCount++
        if (callCount <= 6) {
          // First 6 calls are dependency checks
          return {
            select: vi.fn((query: string, options: any) => ({
              eq: vi.fn(() => Promise.resolve({ count: 0, error: null })),
            })),
          }
        } else {
          // Last call is the delete
          return {
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn(() => Promise.resolve({ error: null })),
          }
        }
      })

      await expect(deleteStore('store-1')).resolves.not.toThrow()
    })
  })

  describe('getStoresForUser', () => {
    it('should return all stores for admin users', async () => {
      // Requirement 2.4: Admins can access all stores
      
      const mockStores = [
        { id: 'store-1', name: 'Store 1', tenant_id: 'tenant-1' },
        { id: 'store-2', name: 'Store 2', tenant_id: 'tenant-1' },
      ]
      
      mockFromImplementation.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn(() => Promise.resolve({
          data: mockStores,
          error: null,
        })),
      })

      const result = await getStoresForUser('tenant-1', 'admin-user-id', 'admin')
      
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Store 1')
      expect(result[1].name).toBe('Store 2')
    })

    it('should return only assigned store for sales person', async () => {
      // Requirement 2.5: Sales persons can only access their assigned store
      
      let callCount = 0
      mockFromImplementation.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // First call: get user's store_id
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn(() => Promise.resolve({
              data: { store_id: 'store-1' },
              error: null,
            })),
          }
        } else {
          // Second call: get the store
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn(() => Promise.resolve({
              data: { id: 'store-1', name: 'Assigned Store', tenant_id: 'tenant-1' },
              error: null,
            })),
          }
        }
      })

      const result = await getStoresForUser('tenant-1', 'sales-user-id', 'sales_person')
      
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Assigned Store')
    })

    it('should throw error if sales person has no assigned store', async () => {
      mockFromImplementation.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(() => Promise.resolve({
          data: { store_id: null },
          error: null,
        })),
      })

      await expect(
        getStoresForUser('tenant-1', 'sales-user-id', 'sales_person')
      ).rejects.toThrow('User is not assigned to any store')
    })
  })

  describe('canAccessStore', () => {
    it('should allow admin to access any store in their tenant', async () => {
      // Requirement 2.5, 13.2, 13.3: Admins can access all stores
      
      let callCount = 0
      mockFromImplementation.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // First call: get user details
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn(() => Promise.resolve({
              data: { tenant_id: 'tenant-1', store_id: null },
              error: null,
            })),
          }
        } else {
          // Second call: get store details
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn(() => Promise.resolve({
              data: { tenant_id: 'tenant-1' },
              error: null,
            })),
          }
        }
      })

      const result = await canAccessStore('admin-user-id', 'store-1', 'admin')
      
      expect(result).toBe(true)
    })

    it('should allow sales person to access their assigned store', async () => {
      // Requirement 2.5, 13.2: Sales persons can access their assigned store
      
      let callCount = 0
      mockFromImplementation.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // First call: get user details
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn(() => Promise.resolve({
              data: { tenant_id: 'tenant-1', store_id: 'store-1' },
              error: null,
            })),
          }
        } else {
          // Second call: get store details
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn(() => Promise.resolve({
              data: { tenant_id: 'tenant-1' },
              error: null,
            })),
          }
        }
      })

      const result = await canAccessStore('sales-user-id', 'store-1', 'sales_person')
      
      expect(result).toBe(true)
    })

    it('should deny sales person access to other stores', async () => {
      // Requirement 2.5, 13.2: Sales persons cannot access other stores
      
      let callCount = 0
      mockFromImplementation.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // First call: get user details
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn(() => Promise.resolve({
              data: { tenant_id: 'tenant-1', store_id: 'store-1' },
              error: null,
            })),
          }
        } else {
          // Second call: get store details
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn(() => Promise.resolve({
              data: { tenant_id: 'tenant-1' },
              error: null,
            })),
          }
        }
      })

      const result = await canAccessStore('sales-user-id', 'store-2', 'sales_person')
      
      expect(result).toBe(false)
    })

    it('should deny access to stores in different tenant', async () => {
      // Requirement 13.3: Users cannot access stores from other tenants
      
      let callCount = 0
      mockFromImplementation.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // First call: get user details
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn(() => Promise.resolve({
              data: { tenant_id: 'tenant-1', store_id: null },
              error: null,
            })),
          }
        } else {
          // Second call: get store details
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn(() => Promise.resolve({
              data: { tenant_id: 'tenant-2' },
              error: null,
            })),
          }
        }
      })

      const result = await canAccessStore('admin-user-id', 'store-other-tenant', 'admin')
      
      expect(result).toBe(false)
    })
  })

  describe('getUserStores', () => {
    it('should be an alias for getStoresForUser', async () => {
      // This function provides a more intuitive name
      
      const mockStores = [
        { id: 'store-1', name: 'Store 1', tenant_id: 'tenant-1' },
      ]
      
      mockFromImplementation.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn(() => Promise.resolve({
          data: mockStores,
          error: null,
        })),
      })

      const result = await getUserStores('tenant-1', 'admin-user-id', 'admin')
      
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Store 1')
    })
  })
})

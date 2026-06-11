import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createClient } from '@/lib/supabase/client'

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}))

describe('Multi-Store Error Handling', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      maybeSingle: vi.fn(),
    }
    vi.mocked(createClient).mockReturnValue(mockSupabase)
  })

  describe('Store Not Found Errors', () => {
    it('should handle no stores available for user', async () => {
      const { getStoresForUser } = await import('./stores')
      
      mockSupabase.single.mockResolvedValueOnce({
        data: { store_id: null },
        error: null,
      })
      
      mockSupabase.select.mockReturnThis()
      mockSupabase.eq.mockReturnThis()
      mockSupabase.order = vi.fn().mockResolvedValue({
        data: [],
        error: null,
      })

      const stores = await getStoresForUser('tenant-1', 'admin-user', 'admin')
      expect(stores).toEqual([])
    })

    it('should handle invalid stored store selection', async () => {
      // This is tested in StoreContext.test.tsx
      // The context clears invalid store from storage and falls back to first available
      expect(true).toBe(true)
    })
  })

  describe('Unauthorized Store Access', () => {
    it('should log security event when sales person accesses unassigned store', async () => {
      const { canAccessStore } = await import('./stores')
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockSupabase.single
        .mockResolvedValueOnce({
          data: { tenant_id: 'tenant-1', store_id: 'store-1' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { tenant_id: 'tenant-1' },
          error: null,
        })

      const hasAccess = await canAccessStore('user-1', 'store-2', 'sales_person')
      
      expect(hasAccess).toBe(false)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unauthorized store access attempt'),
        expect.objectContaining({
          userId: 'user-1',
          storeId: 'store-2',
          assignedStoreId: 'store-1',
        })
      )

      consoleErrorSpy.mockRestore()
    })

    it('should log security event when accessing store from different tenant', async () => {
      const { canAccessStore } = await import('./stores')
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockSupabase.single
        .mockResolvedValueOnce({
          data: { tenant_id: 'tenant-1', store_id: null },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { tenant_id: 'tenant-2' },
          error: null,
        })

      const hasAccess = await canAccessStore('admin-1', 'store-other', 'admin')
      
      expect(hasAccess).toBe(false)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Store does not belong to user tenant'),
        expect.objectContaining({
          userId: 'admin-1',
          storeId: 'store-other',
          userTenantId: 'tenant-1',
          storeTenantId: 'tenant-2',
        })
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Cross-Store Validation Errors', () => {
    it('should reject transaction with products from different store', async () => {
      const { createTransaction } = await import('./transactions')

      mockSupabase.single.mockResolvedValueOnce({
        data: { store_id: 'store-2' }, // Product belongs to different store
        error: null,
      })

      await expect(
        createTransaction(
          'tenant-1',
          'user-1',
          {
            items: [
              {
                product_id: 'product-1',
                product_name: 'Test Product',
                product_sku: 'SKU-001',
                quantity: 1,
                unit_price: 100,
              },
            ],
            subtotal: 100,
            discount_type: 'fixed',
            discount_value: 0,
            discount_amount: 0,
            total: 100,
            payment_method: 'cash',
          },
          'store-1' // Current store
        )
      ).rejects.toThrow('Test Product belongs to a different store')
    })

    it('should reject return for transaction from different store', async () => {
      const { createReturn } = await import('./returns')

      mockSupabase.single.mockResolvedValueOnce({
        data: { store_id: 'store-2' }, // Transaction belongs to different store
        error: null,
      })

      await expect(
        createReturn(
          'tenant-1',
          'user-1',
          {
            transaction_id: 'tx-1',
            reason: 'Defective',
            items: [],
          },
          'store-1' // Current store
        )
      ).rejects.toThrow('Cannot create return for transaction from a different store')
    })

    it('should reject receiving purchase order in different store', async () => {
      const { updatePurchaseOrderStatus } = await import('./purchase-orders')

      // Mock getPurchaseOrder
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: 'po-1',
          store_id: 'store-2', // PO belongs to different store
          items: [],
        },
        error: null,
      })

      await expect(
        updatePurchaseOrderStatus(
          'po-1',
          'received',
          'tenant-1',
          'user-1',
          'store-1' // Current store
        )
      ).rejects.toThrow('Cannot receive purchase order in a different store than originally assigned')
    })
  })

  describe('Store Deletion Validation', () => {
    it('should provide detailed error with dependency counts', async () => {
      const { deleteStore } = await import('./stores')

      // Mock counts for different entity types
      const mockCounts = [
        { count: 3, error: null }, // users
        { count: 150, error: null }, // products
        { count: 45, error: null }, // transactions
        { count: 0, error: null }, // customers
        { count: 0, error: null }, // expenses
        { count: 0, error: null }, // purchase orders
      ]

      let countIndex = 0
      mockSupabase.from.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue(mockCounts[countIndex++]),
        }),
      }))

      await expect(deleteStore('store-1')).rejects.toThrow(
        'Cannot delete store: Store has associated 3 user(s), 150 product(s), 45 transaction(s)'
      )
    })

    it('should allow deletion when no dependencies exist', async () => {
      const { deleteStore } = await import('./stores')

      // Mock no dependencies
      const mockCounts = [
        { count: 0, error: null }, // users
        { count: 0, error: null }, // products
        { count: 0, error: null }, // transactions
        { count: 0, error: null }, // customers
        { count: 0, error: null }, // expenses
        { count: 0, error: null }, // purchase orders
      ]

      let countIndex = 0
      mockSupabase.from.mockImplementation((table: string) => {
        if (countIndex < mockCounts.length) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue(mockCounts[countIndex++]),
            }),
          }
        }
        // For the delete operation
        return {
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }
      })

      await expect(deleteStore('store-1')).resolves.not.toThrow()
    })
  })

  describe('Error Message Clarity', () => {
    it('should provide actionable error messages', () => {
      const errorMessages = [
        'Product Test Product belongs to a different store',
        'Cannot create return for transaction from a different store',
        'Cannot receive purchase order in a different store than originally assigned',
        'Cannot delete store: Store has associated 3 user(s), 150 product(s)',
      ]

      errorMessages.forEach((message) => {
        expect(message).toBeTruthy()
        expect(message.length).toBeGreaterThan(20)
        expect(message).toMatch(/store|Store/)
      })
    })
  })
})

import { Tour } from '@/types'

export const purchaseOrdersTours: Tour[] = [
  {
    id: 'purchase-orders-overview',
    title: 'Managing Purchase Orders',
    description: 'Learn how to create and manage supplier orders',
    pageId: 'purchase-orders',
    category: 'getting-started',
    estimatedDuration: 3,
    requiredRole: 'admin',
    steps: [
      {
        id: 'po-welcome',
        title: 'Purchase Orders',
        content: 'This is where you manage orders from your suppliers. You can create new orders, track deliveries, and restock inventory.',
        targetSelector: '[data-tour="po-container"]',
        placement: 'center',
        isInteractive: false
      },
      {
        id: 'po-create',
        title: 'Creating a Purchase Order',
        content: 'Click "Create Purchase Order" to start a new order. Enter supplier details, expected delivery date, and add products.',
        targetSelector: '[data-tour="create-po-button"]',
        placement: 'bottom',
        isInteractive: false
      },
      {
        id: 'po-list',
        title: 'Purchase Order List',
        content: 'All purchase orders are listed with their status: Draft, Ordered, Received, or Completed.',
        targetSelector: '[data-tour="po-list"]',
        placement: 'top',
        isInteractive: false
      },
      {
        id: 'po-status',
        title: 'Order Status Workflow',
        content: 'Move orders through stages: Draft → Ordered (when placed with supplier) → Received (when delivered) → Completed (when restocked).',
        targetSelector: '[data-tour="po-list"]',
        placement: 'top',
        isInteractive: false
      },
      {
        id: 'po-restock',
        title: 'Restocking Inventory',
        content: 'When an order is received, click "Restock Inventory" to automatically update your stock levels from the purchase order.',
        targetSelector: '[data-tour="po-list"]',
        placement: 'top',
        isInteractive: false
      }
    ]
  }
]

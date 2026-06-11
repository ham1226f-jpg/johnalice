import { Tour } from '@/types'

export const inventoryTours: Tour[] = [
  {
    id: 'inventory-management',
    title: 'Managing Your Inventory',
    description: 'Learn how to add products and manage stock levels',
    pageId: 'inventory',
    category: 'getting-started',
    estimatedDuration: 3,
    requiredRole: 'admin',
    steps: [
      {
        id: 'inventory-welcome',
        title: 'Welcome to Inventory Management',
        content: 'This is where you manage all your products, stock levels, and pricing.',
        targetSelector: '[data-tour="inventory-container"]',
        placement: 'center',
        isInteractive: false
      },
      {
        id: 'inventory-add-product',
        title: 'Adding Products',
        content: 'Click the "Add Product" button to create a new product. You\'ll need to enter details like name, SKU, price, and initial stock.',
        targetSelector: '[data-tour="add-product-button"]',
        placement: 'bottom',
        isInteractive: false
      },
      {
        id: 'inventory-product-list',
        title: 'Product List',
        content: 'All your products are listed here with their current stock levels, prices, and status.',
        targetSelector: '[data-tour="product-list"]',
        placement: 'top',
        isInteractive: false
      },
      {
        id: 'inventory-stock-adjust',
        title: 'Adjusting Stock',
        content: 'Click the "Stock" button on any product to adjust inventory. You can restock (add) or set an exact amount.',
        targetSelector: '[data-tour="product-list"]',
        placement: 'top',
        isInteractive: false
      },
      {
        id: 'inventory-edit',
        title: 'Editing Products',
        content: 'Use the "Edit" button to update product details like price, description, or low stock threshold.',
        targetSelector: '[data-tour="product-list"]',
        placement: 'top',
        isInteractive: false
      },
      {
        id: 'inventory-history',
        title: 'Stock History',
        content: 'Click "History" to see all stock changes for a product, including who made the changes and when.',
        targetSelector: '[data-tour="product-list"]',
        placement: 'top',
        isInteractive: false
      }
    ]
  }
]

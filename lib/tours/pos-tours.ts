import { Tour } from '@/types'

export const posTours: Tour[] = [
  {
    id: 'pos-basic-sale',
    title: 'How to Make a Sale',
    description: 'Learn how to process a sale from start to finish',
    pageId: 'pos',
    category: 'getting-started',
    estimatedDuration: 3,
    steps: [
      {
        id: 'pos-welcome',
        title: 'Welcome to the POS',
        content: 'This is the Point of Sale page where you process customer transactions. Let\'s walk through making a sale!',
        targetSelector: '[data-tour-id="pos-container"]',
        placement: 'center',
        isInteractive: false
      },
      {
        id: 'pos-product-grid',
        title: 'Browse Products',
        content: 'Browse through the product grid to find items. Products show their name, price, and available stock.',
        targetSelector: '[data-tour-id="product-grid"]',
        placement: 'top',
        isInteractive: false
      },
      {
        id: 'pos-add-to-cart',
        title: 'Add Products to Cart',
        content: 'Click on any product card to add it to your cart. The cart will appear on the right side.',
        targetSelector: '[data-tour-id="product-grid"]',
        placement: 'top',
        isInteractive: false
      },
      {
        id: 'pos-cart-view',
        title: 'View Your Cart',
        content: 'Your cart shows all selected items. You can adjust quantities using the + and - buttons, or remove items with the X button.',
        targetSelector: '[data-tour-id="cart-container"]',
        placement: 'left',
        isInteractive: false
      },
      {
        id: 'pos-customer-select',
        title: 'Select Customer (Optional)',
        content: 'You can optionally select a customer for this sale to track their purchase history.',
        targetSelector: '[data-tour-id="customer-selector"]',
        placement: 'bottom',
        isInteractive: false
      },
      {
        id: 'pos-checkout',
        title: 'Checkout',
        content: 'When ready, click the Checkout button to proceed to payment.',
        targetSelector: '[data-tour-id="checkout-button"]',
        placement: 'top',
        isInteractive: false
      },
      {
        id: 'pos-complete',
        title: 'Complete the Sale',
        content: 'Select the payment method (Cash, M-Pesa, Bank, or Debt), then click "Complete Sale". The system will update inventory and generate a receipt.',
        targetSelector: '[data-tour-id="pos-container"]',
        placement: 'center',
        isInteractive: false
      }
    ]
  }
]

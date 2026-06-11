import { Tour } from '@/types'

export const transactionsTours: Tour[] = [
  {
    id: 'transactions-overview',
    title: 'Viewing Transaction History',
    description: 'Learn how to view and manage sales transactions',
    pageId: 'transactions',
    category: 'getting-started',
    estimatedDuration: 2,
    steps: [
      {
        id: 'transactions-welcome',
        title: 'Transaction History',
        content: 'This page shows all completed sales transactions. You can view details, reprint receipts, and create returns.',
        targetSelector: '[data-tour="transactions-container"]',
        placement: 'center',
        isInteractive: false
      },
      {
        id: 'transactions-list',
        title: 'Transaction List',
        content: 'All transactions are listed with transaction number, date, customer, payment method, and total amount.',
        targetSelector: '[data-tour="transactions-list"]',
        placement: 'top',
        isInteractive: false
      },
      {
        id: 'transactions-filters',
        title: 'Filtering Transactions',
        content: 'Use the filters to find specific transactions by date range, payment method, or search by customer name.',
        targetSelector: '[data-tour="transaction-filters"]',
        placement: 'bottom',
        isInteractive: false
      },
      {
        id: 'transactions-details',
        title: 'View Transaction Details',
        content: 'Click on any transaction to see full details including all items purchased, quantities, and prices.',
        targetSelector: '[data-tour="transactions-list"]',
        placement: 'top',
        isInteractive: false
      },
      {
        id: 'transactions-reprint',
        title: 'Reprint Receipts',
        content: 'You can reprint receipts for any transaction by clicking the "Reprint Receipt" button in the transaction details.',
        targetSelector: '[data-tour="transactions-list"]',
        placement: 'top',
        isInteractive: false
      }
    ]
  }
]

import { Tour } from '@/types'

export const returnsTours: Tour[] = [
  {
    id: 'returns-overview',
    title: 'Processing Returns',
    description: 'Learn how to handle customer returns',
    pageId: 'returns',
    category: 'getting-started',
    estimatedDuration: 2,
    steps: [
      {
        id: 'returns-welcome',
        title: 'Returns Management',
        content: 'This is where you create and manage product returns. Sales persons can create return requests, and admins can approve or reject them.',
        targetSelector: '[data-tour="returns-container"]',
        placement: 'center',
        isInteractive: false
      },
      {
        id: 'returns-create',
        title: 'Creating a Return',
        content: 'Click "Create Return" to start a return request. Select the original transaction, choose items to return, and provide a reason.',
        targetSelector: '[data-tour="create-return-button"]',
        placement: 'bottom',
        isInteractive: false
      },
      {
        id: 'returns-list',
        title: 'Returns List',
        content: 'All returns are listed with their status: Pending (awaiting approval), Approved, or Rejected.',
        targetSelector: '[data-tour="returns-list"]',
        placement: 'top',
        isInteractive: false
      },
      {
        id: 'returns-approve',
        title: 'Approving Returns (Admin Only)',
        content: 'Admins can review return details and either approve (which restores stock) or reject the return request.',
        targetSelector: '[data-tour="returns-list"]',
        placement: 'top',
        isInteractive: false
      }
    ]
  }
]

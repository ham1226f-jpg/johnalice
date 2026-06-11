import { Tour } from '@/types'

export const usersTours: Tour[] = [
  {
    id: 'users-management',
    title: 'Managing Users',
    description: 'Learn how to add and manage user accounts',
    pageId: 'users',
    category: 'getting-started',
    estimatedDuration: 2,
    requiredRole: 'admin',
    steps: [
      {
        id: 'users-welcome',
        title: 'User Management',
        content: 'This is where you manage user accounts and permissions. You can add new users, assign roles, and manage passwords.',
        targetSelector: '[data-tour="users-container"]',
        placement: 'center',
        isInteractive: false
      },
      {
        id: 'users-roles',
        title: 'User Roles',
        content: 'There are two roles: Admin (full access) and Sales Person (POS, transactions, and returns only).',
        targetSelector: '[data-tour="users-container"]',
        placement: 'center',
        isInteractive: false
      },
      {
        id: 'users-add',
        title: 'Adding Users',
        content: 'Click "Add User" to create a new account. Enter their name, email, password, and select their role.',
        targetSelector: '[data-tour="add-user-button"]',
        placement: 'bottom',
        isInteractive: false
      },
      {
        id: 'users-list',
        title: 'User List',
        content: 'All users are listed with their name, email, role, and account creation date.',
        targetSelector: '[data-tour="users-list"]',
        placement: 'top',
        isInteractive: false
      },
      {
        id: 'users-password',
        title: 'Managing Passwords',
        content: 'Click the "Password" button to reset a user\'s password. Users can also change their own passwords.',
        targetSelector: '[data-tour="users-list"]',
        placement: 'top',
        isInteractive: false
      }
    ]
  }
]

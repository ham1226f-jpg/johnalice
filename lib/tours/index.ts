import { Tour, UserRole } from '@/types'
import { dashboardTours } from './dashboard-tours'
import { posTours } from './pos-tours'
import { inventoryTours } from './inventory-tours'
import { transactionsTours } from './transactions-tours'
import { purchaseOrdersTours } from './purchase-orders-tours'
import { returnsTours } from './returns-tours'
import { usersTours } from './users-tours'

// All tour definitions
const allTours: Tour[] = [
  ...dashboardTours,
  ...posTours,
  ...inventoryTours,
  ...transactionsTours,
  ...purchaseOrdersTours,
  ...returnsTours,
  ...usersTours,
]

/**
 * Get all tours available to a user based on their role
 */
export function getAllTours(userRole?: UserRole): Tour[] {
  if (!userRole) {
    return allTours
  }

  return allTours.filter(tour => {
    // If tour has no role requirement, it's available to all
    if (!tour.requiredRole) return true
    
    // Otherwise, check if user's role matches
    return tour.requiredRole === userRole
  })
}

/**
 * Get tours for a specific page
 */
export function getToursForPage(pageId: string, userRole?: UserRole): Tour[] {
  const tours = getAllTours(userRole)
  return tours.filter(tour => tour.pageId === pageId)
}

/**
 * Get a specific tour by ID
 */
export function getTourById(tourId: string, userRole?: UserRole): Tour | undefined {
  const tours = getAllTours(userRole)
  return tours.find(tour => tour.id === tourId)
}

/**
 * Search tours by query string
 */
export function searchTours(query: string, userRole?: UserRole): Tour[] {
  const tours = getAllTours(userRole)
  const lowerQuery = query.toLowerCase()
  
  return tours.filter(tour => {
    // Search in title
    if (tour.title.toLowerCase().includes(lowerQuery)) return true
    
    // Search in description
    if (tour.description.toLowerCase().includes(lowerQuery)) return true
    
    // Search in step content
    return tour.steps.some(step => 
      step.title.toLowerCase().includes(lowerQuery) ||
      step.content.toLowerCase().includes(lowerQuery)
    )
  })
}

/**
 * Get tours by category
 */
export function getToursByCategory(category: string, userRole?: UserRole): Tour[] {
  const tours = getAllTours(userRole)
  return tours.filter(tour => tour.category === category)
}

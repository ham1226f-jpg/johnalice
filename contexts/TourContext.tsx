'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import {
  Tour,
  TourContextValue,
  UserTourProgress,
  UserTourStats,
  TourPageId,
  TourElementsMap
} from '@/types'
import {
  getUserTourProgress,
  getTourProgress,
  updateTourStep,
  startTour as startTourService,
  completeTour as completeTourService,
  skipTour as skipTourService,
  getUserTourStats,
  resetUserTourProgress,
  getDismissedHints,
  dismissHint as dismissHintService,
  trackTourEvent
} from '@/lib/services/tours'
import { getAllTours } from '@/lib/tours'

const TourContext = createContext<TourContextValue | undefined>(undefined)

interface TourProviderProps {
  children: ReactNode
  pageId?: TourPageId
}

export function TourProvider({ children, pageId }: TourProviderProps) {
  const { user, tenant } = useAuth()
  
  // Tour state
  const [activeTour, setActiveTour] = useState<Tour | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  
  // Progress state
  const [userProgress, setUserProgress] = useState<UserTourProgress[]>([])
  const [userStats, setUserStats] = useState<UserTourStats | null>(null)
  const [dismissedHints, setDismissedHints] = useState<string[]>([])
  
  // Help menu state
  const [isHelpVisible, setIsHelpVisible] = useState(false)
  
  // Element registration
  const [registeredElements] = useState<TourElementsMap>(new Map())

  // Load user progress and stats on mount
  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user])

  const loadUserData = async () => {
    if (!user) return

    try {
      const [progress, stats, hints] = await Promise.all([
        getUserTourProgress(user.id),
        getUserTourStats(user.id),
        getDismissedHints(user.id)
      ])
      
      setUserProgress(progress)
      setUserStats(stats)
      setDismissedHints(hints)
    } catch (error) {
      console.error('Error loading user tour data:', error)
    }
  }

  // Start a tour
  const startTour = useCallback(async (tourId: string) => {
    if (!user || !tenant) {
      console.error('User or tenant not available')
      return
    }

    try {
      // Get all tours and find the requested one
      const allTours = getAllTours(user.role)
      const tour = allTours.find(t => t.id === tourId)
      
      if (!tour) {
        console.error('Tour not found:', tourId)
        return
      }

      // Check if tour is for current page or if pageId is not set
      if (pageId && tour.pageId !== pageId) {
        console.warn('Tour is for a different page. Redirecting...')
        // In a real app, you might want to navigate to the correct page
      }

      // Start the tour in the database
      await startTourService(user.id, tenant.id, tourId, tour.steps.length)
      
      // Track analytics
      await trackTourEvent(tenant.id, tourId, 'started', user.id)
      
      // Set active tour
      setActiveTour(tour)
      setCurrentStep(0)
      setIsActive(true)
      setIsPaused(false)
      
      // Reload progress
      await loadUserData()
      
      // Execute beforeStep hook if exists
      if (tour.steps[0]?.beforeStep) {
        await tour.steps[0].beforeStep()
      }
    } catch (error) {
      console.error('Error starting tour:', error)
    }
  }, [user, tenant, pageId])

  // Go to next step
  const nextStep = useCallback(async () => {
    if (!activeTour || !user || !tenant) return

    const nextStepIndex = currentStep + 1

    if (nextStepIndex >= activeTour.steps.length) {
      // Tour completed
      await completeTour()
      return
    }

    try {
      // Execute afterStep hook for current step
      if (activeTour.steps[currentStep]?.afterStep) {
        await activeTour.steps[currentStep].afterStep()
      }

      // Track step completion
      await trackTourEvent(
        tenant.id,
        activeTour.id,
        'step_completed',
        user.id,
        activeTour.steps[currentStep].id
      )

      // Update step in database
      await updateTourStep(
        user.id,
        tenant.id,
        activeTour.id,
        nextStepIndex,
        activeTour.steps.length
      )

      // Execute beforeStep hook for next step
      if (activeTour.steps[nextStepIndex]?.beforeStep) {
        await activeTour.steps[nextStepIndex].beforeStep()
      }

      setCurrentStep(nextStepIndex)
      
      // Reload progress
      await loadUserData()
    } catch (error) {
      console.error('Error advancing to next step:', error)
    }
  }, [activeTour, currentStep, user, tenant])

  // Go to previous step
  const previousStep = useCallback(async () => {
    if (!activeTour || !user || !tenant || currentStep === 0) return

    const prevStepIndex = currentStep - 1

    try {
      // Update step in database
      await updateTourStep(
        user.id,
        tenant.id,
        activeTour.id,
        prevStepIndex,
        activeTour.steps.length
      )

      // Execute beforeStep hook for previous step
      if (activeTour.steps[prevStepIndex]?.beforeStep) {
        await activeTour.steps[prevStepIndex].beforeStep()
      }

      setCurrentStep(prevStepIndex)
      
      // Reload progress
      await loadUserData()
    } catch (error) {
      console.error('Error going to previous step:', error)
    }
  }, [activeTour, currentStep, user, tenant])

  // Skip tour
  const skipTour = useCallback(async () => {
    if (!activeTour || !user || !tenant) return

    try {
      // Mark tour as skipped in database
      await skipTourService(
        user.id,
        tenant.id,
        activeTour.id,
        currentStep,
        activeTour.steps.length
      )

      // Track analytics
      await trackTourEvent(tenant.id, activeTour.id, 'skipped', user.id)

      // Clear active tour
      setActiveTour(null)
      setCurrentStep(0)
      setIsActive(false)
      setIsPaused(false)

      // Reload progress
      await loadUserData()
    } catch (error) {
      console.error('Error skipping tour:', error)
    }
  }, [activeTour, currentStep, user, tenant])

  // Pause tour
  const pauseTour = useCallback(() => {
    setIsPaused(true)
  }, [])

  // Resume tour
  const resumeTour = useCallback(() => {
    setIsPaused(false)
  }, [])

  // Complete tour
  const completeTour = useCallback(async () => {
    if (!activeTour || !user || !tenant) return

    try {
      // Mark tour as completed in database
      await completeTourService(
        user.id,
        tenant.id,
        activeTour.id,
        activeTour.steps.length
      )

      // Track analytics
      await trackTourEvent(tenant.id, activeTour.id, 'completed', user.id)

      // Clear active tour
      setActiveTour(null)
      setCurrentStep(0)
      setIsActive(false)
      setIsPaused(false)

      // Reload progress
      await loadUserData()
    } catch (error) {
      console.error('Error completing tour:', error)
    }
  }, [activeTour, user, tenant])

  // Go to specific step
  const goToStep = useCallback(async (stepIndex: number) => {
    if (!activeTour || !user || !tenant) return
    if (stepIndex < 0 || stepIndex >= activeTour.steps.length) return

    try {
      // Update step in database
      await updateTourStep(
        user.id,
        tenant.id,
        activeTour.id,
        stepIndex,
        activeTour.steps.length
      )

      // Execute beforeStep hook
      if (activeTour.steps[stepIndex]?.beforeStep) {
        await activeTour.steps[stepIndex].beforeStep()
      }

      setCurrentStep(stepIndex)
      
      // Reload progress
      await loadUserData()
    } catch (error) {
      console.error('Error going to step:', error)
    }
  }, [activeTour, user, tenant])

  // Mark tour as complete (for manual completion)
  const markTourComplete = useCallback(async (tourId: string) => {
    if (!user || !tenant) return

    try {
      const allTours = getAllTours(user.role)
      const tour = allTours.find(t => t.id === tourId)
      
      if (!tour) return

      await completeTourService(user.id, tenant.id, tourId, tour.steps.length)
      await trackTourEvent(tenant.id, tourId, 'completed', user.id)
      await loadUserData()
    } catch (error) {
      console.error('Error marking tour complete:', error)
    }
  }, [user, tenant])

  // Reset all progress
  const resetProgress = useCallback(async () => {
    if (!user) return

    try {
      await resetUserTourProgress(user.id)
      await loadUserData()
    } catch (error) {
      console.error('Error resetting progress:', error)
    }
  }, [user])

  // Show help menu
  const showHelp = useCallback((pageId: TourPageId) => {
    setIsHelpVisible(true)
  }, [])

  // Hide help menu
  const hideHelp = useCallback(() => {
    setIsHelpVisible(false)
  }, [])

  // Dismiss hint
  const dismissHint = useCallback(async (hintId: string) => {
    if (!user || !tenant) return

    try {
      await dismissHintService(user.id, tenant.id, hintId)
      setDismissedHints(prev => [...prev, hintId])
    } catch (error) {
      console.error('Error dismissing hint:', error)
    }
  }, [user, tenant])

  // Check if hint is dismissed
  const isHintDismissed = useCallback((hintId: string) => {
    return dismissedHints.includes(hintId)
  }, [dismissedHints])

  // Register element for tour targeting
  const registerElement = useCallback((key: string, element: HTMLElement | null) => {
    if (element) {
      registeredElements.set(key, element)
    } else {
      registeredElements.delete(key)
    }
  }, [registeredElements])

  // Get registered element
  const getElement = useCallback((key: string) => {
    return registeredElements.get(key) || null
  }, [registeredElements])

  const value: TourContextValue = {
    // State
    activeTour,
    currentStep,
    isActive,
    isPaused,
    
    // Control methods
    startTour,
    nextStep,
    previousStep,
    skipTour,
    pauseTour,
    resumeTour,
    completeTour,
    goToStep,
    
    // Progress
    userProgress,
    userStats,
    markTourComplete,
    resetProgress,
    
    // Help system
    showHelp,
    hideHelp,
    isHelpVisible,
    
    // Hints
    dismissedHints,
    dismissHint,
    isHintDismissed,
    
    // Element registration
    registerElement,
    getElement
  }

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>
}

export function useTour() {
  const context = useContext(TourContext)
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider')
  }
  return context
}

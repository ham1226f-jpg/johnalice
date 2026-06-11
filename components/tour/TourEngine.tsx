'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTour } from '@/contexts/TourContext'
import { TourOverlay } from './TourOverlay'
import { TourTooltip } from './TourTooltip'
import { tourValidator } from '@/lib/tour/validator'

/**
 * Wait for an element to appear in the DOM
 */
const waitForElement = (selector: string, timeout = 5000): Promise<HTMLElement> => {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector) as HTMLElement
    if (element) return resolve(element)
    
    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector) as HTMLElement
      if (element) {
        observer.disconnect()
        resolve(element)
      }
    })
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
    
    setTimeout(() => {
      observer.disconnect()
      reject(new Error(`Element ${selector} not found within ${timeout}ms`))
    }, timeout)
  })
}

/**
 * Get element position and visibility information
 */
const getElementPosition = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect()
  const scrollX = window.scrollX || window.pageXOffset
  const scrollY = window.scrollY || window.pageYOffset
  
  const isVisible = rect.top >= 0 && 
                   rect.left >= 0 && 
                   rect.bottom <= window.innerHeight && 
                   rect.right <= window.innerWidth
  
  return {
    rect,
    isVisible,
    center: {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    },
    absolute: {
      top: rect.top + scrollY,
      left: rect.left + scrollX,
      bottom: rect.bottom + scrollY,
      right: rect.right + scrollX
    }
  }
}

export function TourEngine() {
  const { activeTour, currentStep, isActive, isPaused, nextStep, previousStep, skipTour } = useTour()
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  const currentTourStep = activeTour?.steps[currentStep]

  // Update target element when step changes
  useEffect(() => {
    if (!isActive || !currentTourStep || isPaused) {
      setTargetElement(null)
      return
    }

    const findAndSetElement = async () => {
      try {
        // Wait for element to be available
        const element = await waitForElement(currentTourStep.targetSelector, 3000)
        
        if (element) {
          setTargetElement(element)
          
          // Get position info
          const posInfo = getElementPosition(element)
          
          // Scroll element into view if not visible
          if (!posInfo.isVisible) {
            element.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center',
              inline: 'center'
            })
            
            // Wait for scroll to complete
            await new Promise(resolve => setTimeout(resolve, 500))
          }
        }
      } catch (error) {
        console.warn('Tour target element not found:', currentTourStep.targetSelector, error)
        setTargetElement(null)
      }
    }

    findAndSetElement()
  }, [currentTourStep, isActive, isPaused])

  // Calculate tooltip position with precise positioning
  useEffect(() => {
    if (!targetElement || !currentTourStep) return

    const calculatePosition = () => {
      const rect = targetElement.getBoundingClientRect()
      const tooltipWidth = 400
      const tooltipHeight = 300
      const padding = 20
      const arrowSize = 12

      let x = 0
      let y = 0

      // Calculate position based on placement
      switch (currentTourStep.placement) {
        case 'top':
          x = rect.left + rect.width / 2 - tooltipWidth / 2
          y = rect.top - tooltipHeight - padding - arrowSize
          break
        case 'bottom':
          x = rect.left + rect.width / 2 - tooltipWidth / 2
          y = rect.bottom + padding + arrowSize
          break
        case 'left':
          x = rect.left - tooltipWidth - padding - arrowSize
          y = rect.top + rect.height / 2 - tooltipHeight / 2
          break
        case 'right':
          x = rect.right + padding + arrowSize
          y = rect.top + rect.height / 2 - tooltipHeight / 2
          break
        case 'center':
          x = window.innerWidth / 2 - tooltipWidth / 2
          y = window.innerHeight / 2 - tooltipHeight / 2
          break
      }

      // Smart positioning: adjust if tooltip would go off-screen
      const viewportPadding = 16
      
      // Horizontal bounds
      if (x < viewportPadding) {
        x = viewportPadding
      } else if (x + tooltipWidth > window.innerWidth - viewportPadding) {
        x = window.innerWidth - tooltipWidth - viewportPadding
      }
      
      // Vertical bounds
      if (y < viewportPadding) {
        y = viewportPadding
      } else if (y + tooltipHeight > window.innerHeight - viewportPadding) {
        y = window.innerHeight - tooltipHeight - viewportPadding
      }

      setTooltipPosition({ x, y })
    }

    calculatePosition()

    // Recalculate on scroll and resize
    window.addEventListener('resize', calculatePosition)
    window.addEventListener('scroll', calculatePosition, true)

    return () => {
      window.removeEventListener('resize', calculatePosition)
      window.removeEventListener('scroll', calculatePosition, true)
    }
  }, [targetElement, currentTourStep])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isActive || isPaused) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        skipTour()
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault()
        nextStep()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        previousStep()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isActive, isPaused, nextStep, previousStep, skipTour])

  // Handle interactive steps
  useEffect(() => {
    if (!isActive || !currentTourStep?.isInteractive || isPaused) return

    const checkValidation = async () => {
      const isValid = await tourValidator.waitForAction(currentTourStep, 60000)
      if (isValid) {
        // Auto-advance to next step
        setTimeout(() => nextStep(), 500)
      }
    }

    checkValidation()
  }, [currentTourStep, isActive, isPaused, nextStep])

  if (!isActive || isPaused || !activeTour || !currentTourStep) {
    return null
  }

  return (
    <>
      <TourOverlay
        targetElement={targetElement}
        isActive={isActive}
        onClickOutside={skipTour}
      />
      
      <TourTooltip
        step={currentTourStep}
        currentStepNumber={currentStep + 1}
        totalSteps={activeTour.steps.length}
        onNext={nextStep}
        onPrevious={previousStep}
        onSkip={skipTour}
        position={tooltipPosition}
        placement={currentTourStep.placement}
      />
    </>
  )
}

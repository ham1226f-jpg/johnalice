/**
 * Tour Element Helper Utilities
 * Provides utilities for precise element targeting and positioning
 */

/**
 * Generate a tour data attribute selector
 */
export function tourId(id: string): string {
  return `data-tour-id="${id}"`
}

/**
 * Get tour element by data-tour-id
 */
export function getTourElement(tourId: string): HTMLElement | null {
  return document.querySelector(`[data-tour-id="${tourId}"]`)
}

/**
 * Wait for a tour element to appear in the DOM
 */
export function waitForTourElement(
  tourId: string, 
  timeout = 5000
): Promise<HTMLElement> {
  return new Promise((resolve, reject) => {
    const element = getTourElement(tourId)
    if (element) return resolve(element)
    
    const observer = new MutationObserver(() => {
      const element = getTourElement(tourId)
      if (element) {
        observer.disconnect()
        resolve(element)
      }
    })
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-tour-id']
    })
    
    setTimeout(() => {
      observer.disconnect()
      reject(new Error(`Tour element [data-tour-id="${tourId}"] not found within ${timeout}ms`))
    }, timeout)
  })
}

/**
 * Get precise element position information
 */
export interface ElementPosition {
  rect: DOMRect
  isVisible: boolean
  isFullyVisible: boolean
  center: { x: number; y: number }
  absolute: {
    top: number
    left: number
    bottom: number
    right: number
  }
}

export function getElementPosition(element: HTMLElement): ElementPosition {
  const rect = element.getBoundingClientRect()
  const scrollX = window.scrollX || window.pageXOffset
  const scrollY = window.scrollY || window.pageYOffset
  
  // Check if element is in viewport
  const isVisible = rect.top < window.innerHeight && 
                   rect.bottom > 0 &&
                   rect.left < window.innerWidth && 
                   rect.right > 0
  
  // Check if element is fully visible
  const isFullyVisible = rect.top >= 0 && 
                        rect.left >= 0 && 
                        rect.bottom <= window.innerHeight && 
                        rect.right <= window.innerWidth
  
  return {
    rect,
    isVisible,
    isFullyVisible,
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

/**
 * Scroll element into view with optimal positioning
 */
export async function scrollToElement(
  element: HTMLElement,
  options: ScrollIntoViewOptions = {}
): Promise<void> {
  const defaultOptions: ScrollIntoViewOptions = {
    behavior: 'smooth',
    block: 'center',
    inline: 'center',
    ...options
  }
  
  element.scrollIntoView(defaultOptions)
  
  // Wait for scroll animation to complete
  return new Promise(resolve => {
    let lastScrollY = window.scrollY
    let sameCount = 0
    
    const checkScroll = () => {
      if (window.scrollY === lastScrollY) {
        sameCount++
        if (sameCount >= 3) {
          resolve()
          return
        }
      } else {
        sameCount = 0
        lastScrollY = window.scrollY
      }
      requestAnimationFrame(checkScroll)
    }
    
    requestAnimationFrame(checkScroll)
  })
}

/**
 * Highlight element temporarily (for debugging)
 */
export function highlightElement(
  element: HTMLElement, 
  duration = 2000,
  color = 'rgba(59, 130, 246, 0.5)'
): void {
  const originalOutline = element.style.outline
  const originalOutlineOffset = element.style.outlineOffset
  
  element.style.outline = `3px solid ${color}`
  element.style.outlineOffset = '2px'
  
  setTimeout(() => {
    element.style.outline = originalOutline
    element.style.outlineOffset = originalOutlineOffset
  }, duration)
}

/**
 * Check if element is interactive (clickable, focusable, etc.)
 */
export function isInteractiveElement(element: HTMLElement): boolean {
  const interactiveTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']
  const hasTabIndex = element.hasAttribute('tabindex')
  const hasClickHandler = element.onclick !== null
  const hasRole = ['button', 'link', 'menuitem', 'tab'].includes(
    element.getAttribute('role') || ''
  )
  
  return (
    interactiveTags.includes(element.tagName) ||
    hasTabIndex ||
    hasClickHandler ||
    hasRole
  )
}

/**
 * Get all tour elements on the current page
 */
export function getAllTourElements(): Map<string, HTMLElement> {
  const elements = new Map<string, HTMLElement>()
  const tourElements = document.querySelectorAll('[data-tour-id]')
  
  tourElements.forEach(el => {
    const tourId = el.getAttribute('data-tour-id')
    if (tourId) {
      elements.set(tourId, el as HTMLElement)
    }
  })
  
  return elements
}

/**
 * Validate that all tour step targets exist on the page
 */
export function validateTourTargets(targetSelectors: string[]): {
  valid: string[]
  missing: string[]
} {
  const valid: string[] = []
  const missing: string[] = []
  
  targetSelectors.forEach(selector => {
    const element = document.querySelector(selector)
    if (element) {
      valid.push(selector)
    } else {
      missing.push(selector)
    }
  })
  
  return { valid, missing }
}

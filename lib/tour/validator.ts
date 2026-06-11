import { TourStep, TourStepValidator } from '@/types'

/**
 * Tour step validator implementation
 * Validates user actions during interactive tour steps
 */
export class TourValidator implements TourStepValidator {
  private hintTimeout: NodeJS.Timeout | null = null

  /**
   * Validate if a step's requirements are met
   */
  validateStep(step: TourStep): boolean {
    if (!step.isInteractive || !step.validationFn) {
      return true
    }

    try {
      return step.validationFn()
    } catch (error) {
      console.error('Error validating step:', error)
      return false
    }
  }

  /**
   * Wait for user to complete an action with timeout
   */
  async waitForAction(step: TourStep, timeout: number = 30000): Promise<boolean> {
    if (!step.isInteractive || !step.validationFn) {
      return true
    }

    return new Promise((resolve) => {
      const checkInterval = 500 // Check every 500ms
      let elapsed = 0
      let hintShown = false

      const intervalId = setInterval(() => {
        elapsed += checkInterval

        // Show hint after 30 seconds
        if (elapsed >= 30000 && !hintShown && step.hintText) {
          this.provideHint(step)
          hintShown = true
        }

        // Check if validation passes
        if (this.validateStep(step)) {
          clearInterval(intervalId)
          if (this.hintTimeout) {
            clearTimeout(this.hintTimeout)
            this.hintTimeout = null
          }
          resolve(true)
          return
        }

        // Timeout
        if (elapsed >= timeout) {
          clearInterval(intervalId)
          if (this.hintTimeout) {
            clearTimeout(this.hintTimeout)
            this.hintTimeout = null
          }
          resolve(false)
        }
      }, checkInterval)
    })
  }

  /**
   * Provide a hint to the user
   */
  provideHint(step: TourStep): void {
    if (!step.hintText) return

    // Create hint notification
    const hintElement = document.createElement('div')
    hintElement.className = 'fixed bottom-4 right-4 z-[10001] bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg max-w-sm animate-in slide-in-from-bottom-2'
    hintElement.innerHTML = `
      <div class="flex items-start gap-3">
        <svg class="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <div class="font-semibold text-sm mb-1">💡 Hint</div>
          <div class="text-sm">${step.hintText}</div>
        </div>
        <button class="ml-2 hover:opacity-80" onclick="this.parentElement.parentElement.remove()">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    `

    document.body.appendChild(hintElement)

    // Auto-remove after 10 seconds
    this.hintTimeout = setTimeout(() => {
      if (hintElement.parentElement) {
        hintElement.remove()
      }
    }, 10000)
  }

  /**
   * Monitor DOM for specific changes
   */
  monitorDOMChanges(
    selector: string,
    callback: () => void,
    timeout: number = 30000
  ): () => void {
    const targetNode = document.querySelector(selector)
    if (!targetNode) {
      console.warn('Target node not found:', selector)
      return () => {}
    }

    const observer = new MutationObserver((mutations) => {
      callback()
    })

    observer.observe(targetNode, {
      attributes: true,
      childList: true,
      subtree: true
    })

    // Auto-disconnect after timeout
    const timeoutId = setTimeout(() => {
      observer.disconnect()
    }, timeout)

    return () => {
      observer.disconnect()
      clearTimeout(timeoutId)
    }
  }

  /**
   * Wait for an element to appear in the DOM
   */
  async waitForElement(
    selector: string,
    timeout: number = 10000
  ): Promise<HTMLElement | null> {
    const startTime = Date.now()

    return new Promise((resolve) => {
      const checkElement = () => {
        const element = document.querySelector(selector) as HTMLElement
        
        if (element) {
          resolve(element)
          return
        }

        if (Date.now() - startTime >= timeout) {
          resolve(null)
          return
        }

        requestAnimationFrame(checkElement)
      }

      checkElement()
    })
  }

  /**
   * Validate form input
   */
  validateInput(selector: string, expectedValue?: string): boolean {
    const input = document.querySelector(selector) as HTMLInputElement
    if (!input) return false

    if (expectedValue !== undefined) {
      return input.value === expectedValue
    }

    return input.value.trim().length > 0
  }

  /**
   * Validate button click
   */
  validateButtonClick(selector: string): boolean {
    const button = document.querySelector(selector) as HTMLButtonElement
    if (!button) return false

    // Check if button was recently clicked (within last 2 seconds)
    const clickTime = button.getAttribute('data-tour-clicked')
    if (!clickTime) return false

    const timeSinceClick = Date.now() - parseInt(clickTime)
    return timeSinceClick < 2000
  }

  /**
   * Mark button as clicked (helper for validation)
   */
  markButtonClicked(selector: string): void {
    const button = document.querySelector(selector) as HTMLButtonElement
    if (button) {
      button.setAttribute('data-tour-clicked', Date.now().toString())
    }
  }

  /**
   * Validate select/dropdown value
   */
  validateSelect(selector: string, expectedValue?: string): boolean {
    const select = document.querySelector(selector) as HTMLSelectElement
    if (!select) return false

    if (expectedValue !== undefined) {
      return select.value === expectedValue
    }

    return select.value.trim().length > 0
  }

  /**
   * Check if element is visible
   */
  isElementVisible(selector: string): boolean {
    const element = document.querySelector(selector) as HTMLElement
    if (!element) return false

    const rect = element.getBoundingClientRect()
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    )
  }

  /**
   * Scroll element into view
   */
  scrollToElement(selector: string): void {
    const element = document.querySelector(selector) as HTMLElement
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      })
    }
  }
}

// Export singleton instance
export const tourValidator = new TourValidator()

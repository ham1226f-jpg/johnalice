'use client'

import { Button } from '@/components/ui/button'
import { TourTooltipProps } from '@/types'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

export function TourTooltip({
  step,
  currentStepNumber,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  position,
  placement
}: TourTooltipProps) {
  const isFirstStep = currentStepNumber === 1
  const isLastStep = currentStepNumber === totalSteps

  return (
    <div
      className="fixed z-[10000] bg-card border border-border rounded-lg shadow-2xl p-4 max-w-md animate-in slide-in-from-bottom-2 duration-300"
      style={{
        top: position.y,
        left: position.x,
        maxWidth: '90vw'
      }}
      role="dialog"
      aria-labelledby="tour-step-title"
      aria-describedby="tour-step-content"
      aria-modal="true"
    >
      {/* Close button */}
      <button
        onClick={onSkip}
        className="absolute right-2 top-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        aria-label="Skip tour"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Progress indicator */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">
            Step {currentStepNumber} of {totalSteps}
          </span>
          {step.keyboardShortcut && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              {step.keyboardShortcut}
            </span>
          )}
        </div>
        <div className="w-full bg-muted rounded-full h-1.5">
          <div
            className="bg-primary h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${(currentStepNumber / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        <h3 id="tour-step-title" className="text-lg font-semibold">
          {step.title}
        </h3>
        <p id="tour-step-content" className="text-sm text-muted-foreground leading-relaxed">
          {step.content}
        </p>

        {step.isInteractive && (
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
            <p className="text-xs text-blue-900 dark:text-blue-100">
              ✨ Interactive step: Try it yourself!
            </p>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between gap-2 mt-4" role="group" aria-label="Tour navigation">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={isFirstStep}
          aria-label="Previous step"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            aria-label="Skip tour"
          >
            Skip Tour
          </Button>
          
          <Button
            size="sm"
            onClick={onNext}
            aria-label={isLastStep ? "Complete tour" : "Next step"}
          >
            {isLastStep ? 'Complete' : 'Next'}
            {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
          </Button>
        </div>
      </div>

      {/* Arrow pointer */}
      {placement !== 'center' && (
        <div
          className={`absolute w-3 h-3 bg-card border-border rotate-45 ${
            placement === 'top' ? 'bottom-[-7px] left-1/2 -translate-x-1/2 border-b border-r' :
            placement === 'bottom' ? 'top-[-7px] left-1/2 -translate-x-1/2 border-t border-l' :
            placement === 'left' ? 'right-[-7px] top-1/2 -translate-y-1/2 border-t border-r' :
            'left-[-7px] top-1/2 -translate-y-1/2 border-b border-l'
          }`}
        />
      )}
    </div>
  )
}

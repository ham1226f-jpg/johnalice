'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { WelcomeModalProps } from '@/types'
import { Sparkles, BookOpen, Zap } from 'lucide-react'

export function WelcomeModal({ userRole, onStartTour, onSkip, onRemindLater }: WelcomeModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false)

  const handleStartTour = () => {
    if (dontShowAgain) {
      localStorage.setItem('tour-welcome-dismissed', 'true')
    }
    onStartTour()
  }

  const handleSkip = () => {
    if (dontShowAgain) {
      localStorage.setItem('tour-welcome-dismissed', 'true')
    }
    onSkip()
  }

  const isAdmin = userRole === 'admin'

  return (
    <Dialog open={true} onOpenChange={handleSkip}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/10 p-3 rounded-full">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-2xl">Welcome to the POS System!</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Let us show you around with an interactive tour
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Role-specific message */}
          <div className="bg-muted rounded-lg p-4">
            <h3 className="font-semibold mb-2">
              {isAdmin ? '👋 Welcome, Admin!' : '👋 Welcome, Sales Person!'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isAdmin
                ? 'As an admin, you have access to all features including inventory management, user management, and analytics. We\'ll guide you through the complete system.'
                : 'As a sales person, you have access to the POS, transactions, and returns. We\'ll show you everything you need to process sales efficiently.'}
            </p>
          </div>

          {/* Tour features */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex gap-3">
              <div className="bg-blue-100 dark:bg-blue-950 p-2 rounded-lg h-fit">
                <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Step-by-Step Guidance</h4>
                <p className="text-xs text-muted-foreground">
                  Interactive tutorials that highlight exactly what you need to do
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="bg-green-100 dark:bg-green-950 p-2 rounded-lg h-fit">
                <Zap className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h4 className="font-medium text-sm mb-1">Learn by Doing</h4>
                <p className="text-xs text-muted-foreground">
                  Practice with real features in a safe, guided environment
                </p>
              </div>
            </div>
          </div>

          {/* Available tours preview */}
          <div className="border border-border rounded-lg p-4">
            <h3 className="font-semibold mb-3 text-sm">What you'll learn:</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {isAdmin ? (
                <>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Dashboard analytics and KPIs
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Managing inventory and stock
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Processing sales at the POS
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Purchase orders and suppliers
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    User management and permissions
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Making your first sale
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Managing the cart and checkout
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Viewing transaction history
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span>
                    Processing customer returns
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Don't show again checkbox */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="dont-show-again"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded border-border"
            />
            <label htmlFor="dont-show-again" className="text-sm text-muted-foreground cursor-pointer">
              Don't show this again
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t">
          <Button variant="ghost" onClick={onRemindLater}>
            Remind Me Later
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSkip}>
              Skip Tour
            </Button>
            <Button onClick={handleStartTour}>
              Start Tour
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { HelpCircle } from 'lucide-react'
import { TourHelpButtonProps } from '@/types'
import { useTour } from '@/contexts/TourContext'
import { TourMenu } from './TourMenu'
import { getToursForPage } from '@/lib/tours'
import { useAuth } from '@/contexts/AuthContext'

export function TourHelpButton({ pageId, position = 'top-right' }: TourHelpButtonProps) {
  const { user } = useAuth()
  const { userProgress, showHelp, hideHelp, isHelpVisible } = useTour()
  const [showPulse, setShowPulse] = useState(false)
  const [incompleteTourCount, setIncompleteTourCount] = useState(0)

  useEffect(() => {
    if (!user) return

    // Get tours for this page
    const pageTours = getToursForPage(pageId, user.role)
    
    // Count incomplete tours
    const incomplete = pageTours.filter(tour => {
      const progress = userProgress.find(p => p.tour_id === tour.id)
      return !progress || progress.status !== 'completed'
    }).length

    setIncompleteTourCount(incomplete)

    // Show pulse animation if there are incomplete tours and user hasn't seen them
    const hasSeenTours = userProgress.some(p => 
      pageTours.some(t => t.id === p.tour_id)
    )
    setShowPulse(incomplete > 0 && !hasSeenTours)
  }, [pageId, user, userProgress])

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  }

  return (
    <>
      <button
        onClick={() => showHelp(pageId)}
        className={`fixed ${positionClasses[position]} z-50 bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
          showPulse ? 'animate-pulse' : ''
        }`}
        aria-label="Open tour help menu"
        title="Get help with this page"
      >
        <HelpCircle className="h-6 w-6" />
        
        {incompleteTourCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {incompleteTourCount}
          </span>
        )}
      </button>

      {isHelpVisible && (
        <TourMenu
          pageId={pageId}
          onClose={hideHelp}
        />
      )}
    </>
  )
}

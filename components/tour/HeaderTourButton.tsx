'use client'

import { useState, useEffect } from 'react'
import { HelpCircle } from 'lucide-react'
import { useTour } from '@/contexts/TourContext'
import { TourMenu } from './TourMenu'
import { getToursForPage } from '@/lib/tours'
import { useAuth } from '@/contexts/AuthContext'
import { TourPageId } from '@/types'

interface HeaderTourButtonProps {
  pageId: TourPageId
}

export function HeaderTourButton({ pageId }: HeaderTourButtonProps) {
  const { user } = useAuth()
  const { userProgress, showHelp, hideHelp, isHelpVisible } = useTour()
  const [incompleteTourCount, setIncompleteTourCount] = useState(0)

  useEffect(() => {
    if (!user) return

    const pageTours = getToursForPage(pageId, user.role)
    
    const incomplete = pageTours.filter(tour => {
      const progress = userProgress.find(p => p.tour_id === tour.id)
      return !progress || progress.status !== 'completed'
    }).length

    setIncompleteTourCount(incomplete)
  }, [pageId, user, userProgress])

  return (
    <>
      <button
        onClick={() => showHelp(pageId)}
        className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-background hover:bg-accent transition-colors text-sm font-medium"
        aria-label="Open tour help menu"
        title="Get help with this page"
      >
        <HelpCircle className="h-4 w-4" />
        <span>Tour</span>
        {incompleteTourCount > 0 && (
          <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
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

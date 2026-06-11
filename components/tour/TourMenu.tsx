'use client'

import { useState, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTour } from '@/contexts/TourContext'
import { useAuth } from '@/contexts/AuthContext'
import { getToursForPage, searchTours } from '@/lib/tours'
import { TourPageId } from '@/types'
import { CheckCircle2, Clock, Search, Play, RotateCcw } from 'lucide-react'

interface TourMenuProps {
  pageId: TourPageId
  onClose: () => void
}

export function TourMenu({ pageId, onClose }: TourMenuProps) {
  const { user } = useAuth()
  const { userProgress, startTour, resetProgress } = useTour()
  const [searchQuery, setSearchQuery] = useState('')

  const tours = useMemo(() => {
    if (!user) return []
    
    if (searchQuery.trim()) {
      return searchTours(searchQuery, user.role)
    }
    
    return getToursForPage(pageId, user.role)
  }, [pageId, user, searchQuery])

  const getTourStatus = (tourId: string) => {
    const progress = userProgress.find(p => p.tour_id === tourId)
    if (!progress) return 'not_started'
    return progress.status
  }

  const handleStartTour = async (tourId: string) => {
    await startTour(tourId)
    onClose()
  }

  const handleResetProgress = async () => {
    if (confirm('Are you sure you want to reset all tour progress? This cannot be undone.')) {
      await resetProgress()
    }
  }

  const completedCount = tours.filter(t => getTourStatus(t.id) === 'completed').length
  const totalCount = tours.length

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tour Guide</DialogTitle>
          <DialogDescription>
            Learn how to use this page with interactive tours
          </DialogDescription>
        </DialogHeader>

        {/* Progress summary */}
        <div className="bg-muted rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Your Progress</span>
            <span className="text-sm text-muted-foreground">
              {completedCount} of {totalCount} completed
            </span>
          </div>
          <div className="w-full bg-background rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tours..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tour list */}
        <div className="space-y-3">
          {tours.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'No tours found matching your search' : 'No tours available for this page'}
            </div>
          ) : (
            tours.map((tour) => {
              const status = getTourStatus(tour.id)
              const isCompleted = status === 'completed'
              const isInProgress = status === 'in_progress'

              return (
                <div
                  key={tour.id}
                  className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{tour.title}</h3>
                        {isCompleted && (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                        {isInProgress && (
                          <Clock className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {tour.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{tour.steps.length} steps</span>
                        <span>~{tour.estimatedDuration} min</span>
                        <span className="capitalize">{tour.category.replace('-', ' ')}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleStartTour(tour.id)}
                      variant={isCompleted ? 'outline' : 'default'}
                    >
                      {isCompleted ? (
                        <>
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Restart
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-1" />
                          {isInProgress ? 'Continue' : 'Start'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetProgress}
            disabled={completedCount === 0}
          >
            Reset All Progress
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

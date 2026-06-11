'use client'

import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { TourProgressDashboardProps } from '@/types'
import { CheckCircle2, Clock, Circle, Play } from 'lucide-react'

export function TourProgressDashboard({
  allTours,
  userProgress,
  userStats,
  onStartTour
}: TourProgressDashboardProps) {
  const toursByCategory = useMemo(() => {
    const grouped = allTours.reduce((acc, tour) => {
      if (!acc[tour.category]) {
        acc[tour.category] = []
      }
      acc[tour.category].push(tour)
      return acc
    }, {} as Record<string, typeof allTours>)

    return grouped
  }, [allTours])

  const getTourStatus = (tourId: string) => {
    const progress = userProgress.find(p => p.tour_id === tourId)
    if (!progress) return 'not_started'
    return progress.status
  }

  const getTourProgress = (tourId: string) => {
    const progress = userProgress.find(p => p.tour_id === tourId)
    if (!progress) return { current: 0, total: 0 }
    return { current: progress.current_step || 0, total: progress.total_steps || 0 }
  }

  const getCategoryProgress = (category: string) => {
    const categoryTours = toursByCategory[category] || []
    const completed = categoryTours.filter(t => getTourStatus(t.id) === 'completed').length
    return {
      completed,
      total: categoryTours.length,
      percentage: categoryTours.length > 0 ? (completed / categoryTours.length) * 100 : 0
    }
  }

  const categoryLabels: Record<string, string> = {
    'getting-started': 'Getting Started',
    'daily-tasks': 'Daily Tasks',
    'advanced': 'Advanced Features'
  }

  return (
    <div className="space-y-6">
      {/* Overall progress */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Your Learning Progress</h2>
        
        {userStats && (
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <div className="bg-muted rounded-lg p-4">
              <div className="text-2xl font-bold text-primary">{userStats.total_tours}</div>
              <div className="text-sm text-muted-foreground">Total Tours</div>
            </div>
            <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {userStats.completed_tours}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {userStats.in_progress_tours}
              </div>
              <div className="text-sm text-muted-foreground">In Progress</div>
            </div>
            <div className="bg-muted rounded-lg p-4">
              <div className="text-2xl font-bold">{userStats.completion_percentage}%</div>
              <div className="text-sm text-muted-foreground">Completion Rate</div>
            </div>
          </div>
        )}

        <div className="w-full bg-muted rounded-full h-3">
          <div
            className="bg-primary h-3 rounded-full transition-all duration-500"
            style={{ width: `${userStats?.completion_percentage || 0}%` }}
          />
        </div>
      </Card>

      {/* Tours by category */}
      {Object.entries(toursByCategory).map(([category, tours]) => {
        const categoryProgress = getCategoryProgress(category)

        return (
          <Card key={category} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold">{categoryLabels[category] || category}</h3>
                <p className="text-sm text-muted-foreground">
                  {categoryProgress.completed} of {categoryProgress.total} completed
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {Math.round(categoryProgress.percentage)}%
                </div>
              </div>
            </div>

            <div className="w-full bg-muted rounded-full h-2 mb-6">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${categoryProgress.percentage}%` }}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {tours.map((tour) => {
                const status = getTourStatus(tour.id)
                const progress = getTourProgress(tour.id)
                const isCompleted = status === 'completed'
                const isInProgress = status === 'in_progress'
                const isNotStarted = status === 'not_started'

                return (
                  <div
                    key={tour.id}
                    className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {isCompleted && (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        )}
                        {isInProgress && (
                          <Clock className="h-5 w-5 text-blue-600" />
                        )}
                        {isNotStarted && (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>

                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{tour.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {tour.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="text-xs text-muted-foreground">
                            {tour.steps.length} steps · ~{tour.estimatedDuration} min
                            {isInProgress && (
                              <span className="ml-2">
                                ({progress.current}/{progress.total} steps)
                              </span>
                            )}
                          </div>

                          <Button
                            size="sm"
                            variant={isCompleted ? 'outline' : 'default'}
                            onClick={() => onStartTour(tour.id)}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            {isCompleted ? 'Restart' : isInProgress ? 'Continue' : 'Start'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )
      })}

      {allTours.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">No tours available yet</p>
        </Card>
      )}
    </div>
  )
}

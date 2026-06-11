import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'
import {
  UserTourProgress,
  UserTourHintDismissed,
  TourAnalyticsEvent,
  UserTourStats,
  TourStatus,
  TourEventType
} from '@/types'

type DbUserTourProgress = Database['public']['Tables']['user_tour_progress']['Row']
type DbTourAnalytics = Database['public']['Tables']['tour_analytics']['Row']

/**
 * Map database row to UserTourProgress type
 */
function mapToUserTourProgress(row: DbUserTourProgress): UserTourProgress {
  return {
    id: row.id,
    user_id: row.user_id,
    tenant_id: row.tenant_id,
    tour_id: row.tour_id,
    status: row.status as TourStatus,
    current_step: row.current_step || 0,
    total_steps: row.total_steps || 0,
    completed_at: row.completed_at || undefined,
    started_at: row.started_at || undefined,
    time_spent_seconds: row.time_spent_seconds || 0,
    created_at: row.created_at || '',
    updated_at: row.updated_at || ''
  }
}

/**
 * Map database row to TourAnalyticsEvent type
 */
function mapToTourAnalyticsEvent(row: DbTourAnalytics): TourAnalyticsEvent {
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    tour_id: row.tour_id,
    step_id: row.step_id ?? undefined,
    event_type: row.event_type as TourEventType,
    user_id: row.user_id ?? undefined,
    metadata: (row.metadata as Record<string, any>) ?? undefined,
    created_at: row.created_at ?? ''
  }
}

/**
 * Fetch all tour progress records for a user
 */
export async function getUserTourProgress(userId: string): Promise<UserTourProgress[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('user_tour_progress')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching user tour progress:', error)
    throw new Error('Failed to fetch tour progress')
  }

  return (data || []).map(mapToUserTourProgress)
}

/**
 * Get progress for a specific tour
 */
export async function getTourProgress(
  userId: string,
  tourId: string
): Promise<UserTourProgress | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('user_tour_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('tour_id', tourId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No record found
      return null
    }
    console.error('Error fetching tour progress:', error)
    throw new Error('Failed to fetch tour progress')
  }

  return mapToUserTourProgress(data)
}

/**
 * Update or create tour progress
 */
export async function updateTourProgress(
  userId: string,
  tenantId: string,
  tourId: string,
  status: TourStatus,
  currentStep: number,
  totalSteps: number
): Promise<UserTourProgress> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .rpc('update_tour_progress', {
      p_user_id: userId,
      p_tenant_id: tenantId,
      p_tour_id: tourId,
      p_status: status,
      p_current_step: currentStep,
      p_total_steps: totalSteps
    })

  if (error) {
    console.error('Error updating tour progress:', error)
    throw new Error('Failed to update tour progress')
  }

  return mapToUserTourProgress(data)
}

/**
 * Mark a tour as started
 */
export async function startTour(
  userId: string,
  tenantId: string,
  tourId: string,
  totalSteps: number
): Promise<UserTourProgress> {
  return updateTourProgress(userId, tenantId, tourId, 'in_progress', 0, totalSteps)
}

/**
 * Mark a tour as completed
 */
export async function completeTour(
  userId: string,
  tenantId: string,
  tourId: string,
  totalSteps: number
): Promise<UserTourProgress> {
  return updateTourProgress(userId, tenantId, tourId, 'completed', totalSteps, totalSteps)
}

/**
 * Mark a tour as skipped
 */
export async function skipTour(
  userId: string,
  tenantId: string,
  tourId: string,
  currentStep: number,
  totalSteps: number
): Promise<UserTourProgress> {
  return updateTourProgress(userId, tenantId, tourId, 'skipped', currentStep, totalSteps)
}

/**
 * Update current step in a tour
 */
export async function updateTourStep(
  userId: string,
  tenantId: string,
  tourId: string,
  currentStep: number,
  totalSteps: number
): Promise<UserTourProgress> {
  return updateTourProgress(userId, tenantId, tourId, 'in_progress', currentStep, totalSteps)
}

/**
 * Get user tour statistics
 */
export async function getUserTourStats(userId: string): Promise<UserTourStats> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .rpc('get_user_tour_stats', {
      p_user_id: userId
    })
    .single()

  if (error) {
    console.error('Error fetching user tour stats:', error)
    throw new Error('Failed to fetch tour statistics')
  }

  return data
}

/**
 * Reset all tour progress for a user
 */
export async function resetUserTourProgress(userId: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('user_tour_progress')
    .delete()
    .eq('user_id', userId)

  if (error) {
    console.error('Error resetting tour progress:', error)
    throw new Error('Failed to reset tour progress')
  }
}

/**
 * Get all dismissed hints for a user
 */
export async function getDismissedHints(userId: string): Promise<string[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('user_tour_hints_dismissed')
    .select('hint_id')
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching dismissed hints:', error)
    throw new Error('Failed to fetch dismissed hints')
  }

  return data?.map(item => item.hint_id) || []
}

/**
 * Dismiss a help hint
 */
export async function dismissHint(
  userId: string,
  tenantId: string,
  hintId: string
): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('user_tour_hints_dismissed')
    .insert({
      user_id: userId,
      tenant_id: tenantId,
      hint_id: hintId
    })

  if (error) {
    // Ignore duplicate key errors
    if (error.code !== '23505') {
      console.error('Error dismissing hint:', error)
      throw new Error('Failed to dismiss hint')
    }
  }
}

/**
 * Re-enable a dismissed hint
 */
export async function enableHint(userId: string, hintId: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('user_tour_hints_dismissed')
    .delete()
    .eq('user_id', userId)
    .eq('hint_id', hintId)

  if (error) {
    console.error('Error enabling hint:', error)
    throw new Error('Failed to enable hint')
  }
}

/**
 * Track a tour analytics event
 */
export async function trackTourEvent(
  tenantId: string,
  tourId: string,
  eventType: TourEventType,
  userId?: string,
  stepId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .rpc('track_tour_event', {
      p_tenant_id: tenantId,
      p_tour_id: tourId,
      p_step_id: stepId || null,
      p_event_type: eventType,
      p_user_id: userId || null,
      p_metadata: metadata || null
    } as any)

  if (error) {
    // Log but don't throw - analytics failures shouldn't break the app
    console.error('Error tracking tour event:', error)
  }
}

/**
 * Get tour analytics for admin dashboard
 */
export async function getTourAnalytics(
  tenantId: string,
  tourId?: string
): Promise<TourAnalyticsEvent[]> {
  const supabase = createClient()
  
  let query = supabase
    .from('tour_analytics')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (tourId) {
    query = query.eq('tour_id', tourId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching tour analytics:', error)
    throw new Error('Failed to fetch tour analytics')
  }

  return (data || []).map(mapToTourAnalyticsEvent)
}

/**
 * Get aggregated tour completion rates
 */
export async function getTourCompletionRates(tenantId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('user_tour_progress')
    .select('tour_id, status')
    .eq('tenant_id', tenantId)

  if (error) {
    console.error('Error fetching completion rates:', error)
    throw new Error('Failed to fetch completion rates')
  }

  // Aggregate by tour_id
  const aggregated = data?.reduce((acc, item) => {
    if (!acc[item.tour_id]) {
      acc[item.tour_id] = {
        tour_id: item.tour_id,
        total: 0,
        completed: 0,
        in_progress: 0,
        skipped: 0
      }
    }
    
    acc[item.tour_id].total++
    
    if (item.status === 'completed') {
      acc[item.tour_id].completed++
    } else if (item.status === 'in_progress') {
      acc[item.tour_id].in_progress++
    } else if (item.status === 'skipped') {
      acc[item.tour_id].skipped++
    }
    
    return acc
  }, {} as Record<string, any>)

  return Object.values(aggregated || {}).map((item: any) => ({
    ...item,
    completion_rate: item.total > 0 ? (item.completed / item.total) * 100 : 0
  }))
}

/**
 * Check if user has completed any tour (for first-time detection)
 */
export async function hasCompletedAnyTour(userId: string): Promise<boolean> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('user_tour_progress')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .limit(1)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No record found
      return false
    }
    console.error('Error checking tour completion:', error)
    return false
  }

  return !!data
}

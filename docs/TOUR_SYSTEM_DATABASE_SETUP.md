# Tour System Database Setup

This document explains the database schema for the Interactive Tour Guide system.

## Overview

The tour system uses three main tables to track user progress, dismissed hints, and analytics:

1. **user_tour_progress** - Tracks which tours users have started, completed, or skipped
2. **user_tour_hints_dismissed** - Tracks which contextual help hints users have dismissed
3. **tour_analytics** - Stores analytics events for tour engagement metrics

## Installation

Run the migration file in your Supabase SQL Editor:

```bash
# File location
migrations/add_tour_system_tables.sql
```

## Tables

### user_tour_progress

Stores the progress of each user through available tours.

**Columns:**
- `id` (UUID) - Primary key
- `user_id` (UUID) - Reference to users table
- `tenant_id` (UUID) - Reference to tenants table
- `tour_id` (VARCHAR) - Unique identifier for the tour (e.g., 'pos-basic-sale')
- `status` (VARCHAR) - Current status: 'not_started', 'in_progress', 'completed', 'skipped'
- `current_step` (INTEGER) - Current step number (0-based)
- `total_steps` (INTEGER) - Total number of steps in the tour
- `completed_at` (TIMESTAMP) - When the tour was completed
- `started_at` (TIMESTAMP) - When the tour was first started
- `time_spent_seconds` (INTEGER) - Total time spent on the tour
- `created_at` (TIMESTAMP) - Record creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

**Indexes:**
- `idx_user_tour_progress_user_id` - Fast lookups by user
- `idx_user_tour_progress_tenant_id` - Fast lookups by tenant
- `idx_user_tour_progress_status` - Fast filtering by status

**Unique Constraint:**
- `(user_id, tour_id)` - One progress record per user per tour

### user_tour_hints_dismissed

Tracks which contextual help hints users have permanently dismissed.

**Columns:**
- `id` (UUID) - Primary key
- `user_id` (UUID) - Reference to users table
- `tenant_id` (UUID) - Reference to tenants table
- `hint_id` (VARCHAR) - Unique identifier for the hint
- `dismissed_at` (TIMESTAMP) - When the hint was dismissed

**Indexes:**
- `idx_user_tour_hints_user_id` - Fast lookups by user

**Unique Constraint:**
- `(user_id, hint_id)` - One dismissal record per user per hint

### tour_analytics

Stores analytics events for tracking tour engagement and identifying areas for improvement.

**Columns:**
- `id` (UUID) - Primary key
- `tenant_id` (UUID) - Reference to tenants table
- `tour_id` (VARCHAR) - Tour identifier
- `step_id` (VARCHAR) - Step identifier (nullable)
- `event_type` (VARCHAR) - Event type: 'started', 'completed', 'skipped', 'hint_shown', 'step_completed', 'step_skipped'
- `user_id` (UUID) - Reference to users table (nullable, SET NULL on delete)
- `metadata` (JSONB) - Additional event data
- `created_at` (TIMESTAMP) - Event timestamp

**Indexes:**
- `idx_tour_analytics_tenant_id` - Fast filtering by tenant
- `idx_tour_analytics_tour_id` - Fast filtering by tour
- `idx_tour_analytics_event_type` - Fast filtering by event type
- `idx_tour_analytics_created_at` - Fast time-based queries

## Database Functions

### update_tour_progress

Updates or creates a tour progress record for a user.

**Parameters:**
- `p_user_id` (UUID) - User ID
- `p_tenant_id` (UUID) - Tenant ID
- `p_tour_id` (VARCHAR) - Tour ID
- `p_status` (VARCHAR) - New status
- `p_current_step` (INTEGER) - Current step number
- `p_total_steps` (INTEGER) - Total steps

**Returns:** `user_tour_progress` record

**Usage:**
```sql
SELECT * FROM update_tour_progress(
  'user-uuid',
  'tenant-uuid',
  'pos-basic-sale',
  'in_progress',
  3,
  10
);
```

### get_user_tour_stats

Retrieves statistics about a user's tour progress.

**Parameters:**
- `p_user_id` (UUID) - User ID

**Returns:** Table with columns:
- `total_tours` (INTEGER) - Total tours started
- `completed_tours` (INTEGER) - Tours completed
- `in_progress_tours` (INTEGER) - Tours in progress
- `skipped_tours` (INTEGER) - Tours skipped
- `completion_percentage` (NUMERIC) - Percentage of tours completed

**Usage:**
```sql
SELECT * FROM get_user_tour_stats('user-uuid');
```

### track_tour_event

Records an analytics event for tour engagement tracking.

**Parameters:**
- `p_tenant_id` (UUID) - Tenant ID
- `p_tour_id` (VARCHAR) - Tour ID
- `p_step_id` (VARCHAR) - Step ID (nullable)
- `p_event_type` (VARCHAR) - Event type
- `p_user_id` (UUID) - User ID
- `p_metadata` (JSONB) - Additional event data (optional)

**Returns:** `tour_analytics` record

**Usage:**
```sql
SELECT * FROM track_tour_event(
  'tenant-uuid',
  'pos-basic-sale',
  'pos-checkout',
  'step_completed',
  'user-uuid',
  '{"duration_seconds": 45}'::jsonb
);
```

## Row Level Security (RLS)

All tables have RLS enabled with the following policies:

### user_tour_progress
- Users can read, insert, and update their own progress
- Admins can read all progress in their tenant

### user_tour_hints_dismissed
- Users can read, insert, and delete their own dismissed hints

### tour_analytics
- Users can insert their own analytics events
- Admins can read all analytics in their tenant

## Example Queries

### Check if user has completed first-time tour
```sql
SELECT EXISTS (
  SELECT 1 
  FROM user_tour_progress 
  WHERE user_id = 'user-uuid' 
  AND status = 'completed'
) as has_completed_any_tour;
```

### Get all incomplete tours for a user
```sql
SELECT tour_id, current_step, total_steps
FROM user_tour_progress
WHERE user_id = 'user-uuid'
AND status = 'in_progress'
ORDER BY updated_at DESC;
```

### Get tour completion rate by tour
```sql
SELECT 
  tour_id,
  COUNT(*) as total_starts,
  COUNT(*) FILTER (WHERE status = 'completed') as completions,
  ROUND(
    (COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / COUNT(*)::NUMERIC) * 100, 
    2
  ) as completion_rate
FROM user_tour_progress
WHERE tenant_id = 'tenant-uuid'
GROUP BY tour_id
ORDER BY completion_rate DESC;
```

### Get most skipped tour steps
```sql
SELECT 
  tour_id,
  step_id,
  COUNT(*) as skip_count
FROM tour_analytics
WHERE tenant_id = 'tenant-uuid'
AND event_type = 'step_skipped'
GROUP BY tour_id, step_id
ORDER BY skip_count DESC
LIMIT 10;
```

## Verification

After running the migration, verify the setup:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_tour_progress', 'user_tour_hints_dismissed', 'tour_analytics')
ORDER BY table_name;

-- Check RLS policies
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename IN ('user_tour_progress', 'user_tour_hints_dismissed', 'tour_analytics')
ORDER BY tablename, policyname;

-- Check functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('update_tour_progress', 'get_user_tour_stats', 'track_tour_event');
```

## Rollback

If you need to remove the tour system tables:

```sql
-- Drop functions
DROP FUNCTION IF EXISTS update_tour_progress;
DROP FUNCTION IF EXISTS get_user_tour_stats;
DROP FUNCTION IF EXISTS track_tour_event;

-- Drop tables (CASCADE will remove dependent objects)
DROP TABLE IF EXISTS tour_analytics CASCADE;
DROP TABLE IF EXISTS user_tour_hints_dismissed CASCADE;
DROP TABLE IF EXISTS user_tour_progress CASCADE;
```

## Next Steps

After setting up the database:

1. Create the tour data service layer (`lib/services/tours.ts`)
2. Implement the TourContext and TourProvider
3. Build the tour UI components
4. Define tour content for each page

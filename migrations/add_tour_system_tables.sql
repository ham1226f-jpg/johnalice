-- =====================================================
-- TOUR SYSTEM TABLES MIGRATION
-- Interactive Tour Guide System for Restaurant POS
-- Run this in your Supabase SQL Editor
-- =====================================================

-- =====================================================
-- USER TOUR PROGRESS TABLE
-- Tracks user progress through tours
-- =====================================================

CREATE TABLE IF NOT EXISTS user_tour_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tour_id VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')),
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 0,
  completed_at TIMESTAMP,
  started_at TIMESTAMP,
  time_spent_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, tour_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_tour_progress_user_id ON user_tour_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tour_progress_tenant_id ON user_tour_progress(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_tour_progress_status ON user_tour_progress(status);

-- Enable RLS
ALTER TABLE user_tour_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_tour_progress
-- Users can read their own progress
CREATE POLICY "Users can read own tour progress"
ON user_tour_progress
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert their own progress
CREATE POLICY "Users can insert own tour progress"
ON user_tour_progress
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own progress
CREATE POLICY "Users can update own tour progress"
ON user_tour_progress
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admins can read all progress in their tenant
CREATE POLICY "Admins can read all tour progress in tenant"
ON user_tour_progress
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- USER TOUR HINTS DISMISSED TABLE
-- Tracks which help hints users have dismissed
-- =====================================================

CREATE TABLE IF NOT EXISTS user_tour_hints_dismissed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  hint_id VARCHAR(100) NOT NULL,
  dismissed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, hint_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_tour_hints_user_id ON user_tour_hints_dismissed(user_id);

-- Enable RLS
ALTER TABLE user_tour_hints_dismissed ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_tour_hints_dismissed
-- Users can read their own dismissed hints
CREATE POLICY "Users can read own dismissed hints"
ON user_tour_hints_dismissed
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert their own dismissed hints
CREATE POLICY "Users can insert own dismissed hints"
ON user_tour_hints_dismissed
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can delete their own dismissed hints (to re-enable hints)
CREATE POLICY "Users can delete own dismissed hints"
ON user_tour_hints_dismissed
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- =====================================================
-- TOUR ANALYTICS TABLE
-- Tracks tour engagement metrics for analytics
-- =====================================================

CREATE TABLE IF NOT EXISTS tour_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tour_id VARCHAR(100) NOT NULL,
  step_id VARCHAR(100),
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('started', 'completed', 'skipped', 'hint_shown', 'step_completed', 'step_skipped')),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster analytics queries
CREATE INDEX IF NOT EXISTS idx_tour_analytics_tenant_id ON tour_analytics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tour_analytics_tour_id ON tour_analytics(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_analytics_event_type ON tour_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_tour_analytics_created_at ON tour_analytics(created_at);

-- Enable RLS
ALTER TABLE tour_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tour_analytics
-- Users can insert their own analytics events
CREATE POLICY "Users can insert own tour analytics"
ON tour_analytics
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Admins can read all analytics in their tenant
CREATE POLICY "Admins can read all tour analytics in tenant"
ON tour_analytics
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- DATABASE FUNCTIONS
-- Helper functions for tour progress management
-- =====================================================

-- Function to update tour progress
CREATE OR REPLACE FUNCTION update_tour_progress(
  p_user_id UUID,
  p_tenant_id UUID,
  p_tour_id VARCHAR,
  p_status VARCHAR,
  p_current_step INTEGER,
  p_total_steps INTEGER
)
RETURNS user_tour_progress AS $$
DECLARE
  v_progress user_tour_progress;
  v_time_spent INTEGER;
BEGIN
  -- Calculate time spent if completing
  IF p_status = 'completed' THEN
    SELECT EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER
    INTO v_time_spent
    FROM user_tour_progress
    WHERE user_id = p_user_id AND tour_id = p_tour_id;
  END IF;

  -- Insert or update progress
  INSERT INTO user_tour_progress (
    user_id,
    tenant_id,
    tour_id,
    status,
    current_step,
    total_steps,
    started_at,
    completed_at,
    time_spent_seconds,
    updated_at
  )
  VALUES (
    p_user_id,
    p_tenant_id,
    p_tour_id,
    p_status,
    p_current_step,
    p_total_steps,
    CASE WHEN p_status = 'in_progress' AND NOT EXISTS (
      SELECT 1 FROM user_tour_progress WHERE user_id = p_user_id AND tour_id = p_tour_id
    ) THEN NOW() ELSE NULL END,
    CASE WHEN p_status = 'completed' THEN NOW() ELSE NULL END,
    COALESCE(v_time_spent, 0),
    NOW()
  )
  ON CONFLICT (user_id, tour_id)
  DO UPDATE SET
    status = p_status,
    current_step = p_current_step,
    total_steps = p_total_steps,
    completed_at = CASE WHEN p_status = 'completed' THEN NOW() ELSE user_tour_progress.completed_at END,
    time_spent_seconds = COALESCE(v_time_spent, user_tour_progress.time_spent_seconds),
    updated_at = NOW()
  RETURNING * INTO v_progress;

  RETURN v_progress;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user tour statistics
CREATE OR REPLACE FUNCTION get_user_tour_stats(p_user_id UUID)
RETURNS TABLE (
  total_tours INTEGER,
  completed_tours INTEGER,
  in_progress_tours INTEGER,
  skipped_tours INTEGER,
  completion_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_tours,
    COUNT(*) FILTER (WHERE status = 'completed')::INTEGER as completed_tours,
    COUNT(*) FILTER (WHERE status = 'in_progress')::INTEGER as in_progress_tours,
    COUNT(*) FILTER (WHERE status = 'skipped')::INTEGER as skipped_tours,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
      ELSE 0
    END as completion_percentage
  FROM user_tour_progress
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track tour analytics event
CREATE OR REPLACE FUNCTION track_tour_event(
  p_tenant_id UUID,
  p_tour_id VARCHAR,
  p_step_id VARCHAR,
  p_event_type VARCHAR,
  p_user_id UUID,
  p_metadata JSONB DEFAULT NULL
)
RETURNS tour_analytics AS $$
DECLARE
  v_analytics tour_analytics;
BEGIN
  INSERT INTO tour_analytics (
    tenant_id,
    tour_id,
    step_id,
    event_type,
    user_id,
    metadata,
    created_at
  )
  VALUES (
    p_tenant_id,
    p_tour_id,
    p_step_id,
    p_event_type,
    p_user_id,
    p_metadata,
    NOW()
  )
  RETURNING * INTO v_analytics;

  RETURN v_analytics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VERIFICATION QUERIES
-- Run these to verify the tables were created successfully
-- =====================================================

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
  cmd,
  roles
FROM pg_policies 
WHERE tablename IN ('user_tour_progress', 'user_tour_hints_dismissed', 'tour_analytics')
ORDER BY tablename, policyname;

-- Check functions exist
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('update_tour_progress', 'get_user_tour_stats', 'track_tour_event')
ORDER BY routine_name;

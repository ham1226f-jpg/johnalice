-- Create a simple tour stats function to fix the console errors
CREATE OR REPLACE FUNCTION get_user_tour_stats(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Return empty tour stats for now
  RETURN json_build_object(
    'completed_tours', 0,
    'total_tours', 0,
    'completion_rate', 0
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_tour_stats(UUID) TO authenticated;
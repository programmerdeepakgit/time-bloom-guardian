-- Fix security issues from previous migration

-- 1. Drop the problematic security definer view
DROP VIEW IF EXISTS public.leaderboard;

-- 2. Remove the problematic public policy we created
DROP POLICY IF EXISTS "Public can view leaderboard" ON public.users;

-- 3. The get_leaderboard() function is the secure approach - no changes needed there
-- It already exists and is properly configured with SECURITY DEFINER

-- 4. Make sure the function has proper security by limiting results
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE (
  id uuid,
  username text,
  name text,
  class text,
  total_study_time integer,
  updated_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT 
    u.id,
    u.username::text,
    u.name::text,
    u.class::text,
    u.total_study_time,
    u.updated_at
  FROM public.users u
  WHERE u.username IS NOT NULL
    AND u.total_study_time IS NOT NULL
  ORDER BY u.total_study_time DESC
  LIMIT 100;
$$;

-- 5. Ensure proper permissions (these should already exist from previous migration)
GRANT EXECUTE ON FUNCTION public.get_leaderboard() TO anon;
GRANT EXECUTE ON FUNCTION public.get_leaderboard() TO authenticated;
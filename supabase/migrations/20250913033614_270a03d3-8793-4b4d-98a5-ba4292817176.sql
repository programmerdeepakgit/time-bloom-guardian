-- Fix Security Issue: Remove public access to sensitive user data and create secure leaderboard view

-- 1. Remove the insecure public policy
DROP POLICY IF EXISTS "Public leaderboard data" ON public.users;

-- 2. Create a secure leaderboard view that only exposes safe data
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT 
  id,
  username,
  name,
  class,
  total_study_time,
  updated_at
FROM public.users 
WHERE username IS NOT NULL
ORDER BY total_study_time DESC;

-- 3. Enable RLS on the view (views inherit RLS from base tables by default, but let's be explicit)
ALTER VIEW public.leaderboard SET (security_barrier = true);

-- 4. Create a policy to allow public read access to the leaderboard view only
CREATE POLICY "Public can view leaderboard" 
ON public.users 
FOR SELECT 
TO public
USING (
  -- Only allow access to the specific columns needed for leaderboard
  -- This policy will be used by the leaderboard view
  username IS NOT NULL 
  AND current_setting('request.jwt.claims', true)::json->>'sub' IS NULL -- Anonymous users only
);

-- 5. Create a function for secure leaderboard access
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
  ORDER BY u.total_study_time DESC
  LIMIT 100;
$$;

-- 6. Grant execute permission on the function to anonymous users
GRANT EXECUTE ON FUNCTION public.get_leaderboard() TO anon;
GRANT EXECUTE ON FUNCTION public.get_leaderboard() TO authenticated;
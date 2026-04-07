
-- Function to get all user auth_user_ids for broadcast (security definer bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_all_user_auth_ids()
RETURNS TABLE(auth_user_id uuid, username text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.auth_user_id, u.username::text
  FROM public.users u
  WHERE u.auth_user_id IS NOT NULL;
$$;

-- Function to get app-wide stats for admin dashboard
CREATE OR REPLACE FUNCTION public.get_app_stats()
RETURNS TABLE(total_users bigint, total_study_time_all bigint, active_studiers bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*)::bigint AS total_users,
    COALESCE(SUM(u.total_study_time), 0)::bigint AS total_study_time_all,
    COUNT(*) FILTER (WHERE u.is_studying = true)::bigint AS active_studiers
  FROM public.users u
  WHERE u.auth_user_id IS NOT NULL;
$$;

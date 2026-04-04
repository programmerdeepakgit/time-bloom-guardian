
CREATE OR REPLACE FUNCTION public.get_leaderboard()
 RETURNS TABLE(id uuid, username text, name text, class text, total_study_time integer, updated_at timestamp with time zone, is_studying boolean, currently_studying_subject text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    u.id,
    u.username::text,
    u.name::text,
    u.class::text,
    u.total_study_time,
    u.updated_at,
    u.is_studying,
    u.currently_studying_subject::text
  FROM public.users u
  WHERE u.username IS NOT NULL
    AND u.total_study_time IS NOT NULL
  ORDER BY u.total_study_time DESC
  LIMIT 100;
$function$;

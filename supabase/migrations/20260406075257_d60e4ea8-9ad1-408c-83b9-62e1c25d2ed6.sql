CREATE OR REPLACE FUNCTION public.is_group_member(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = _group_id
      AND gm.user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_group_members(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = _group_id
      AND gm.user_id = _user_id
      AND gm.role IN ('creator', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.get_group_member_profiles(_group_id uuid)
RETURNS TABLE (
  user_id uuid,
  role text,
  username text,
  name text,
  total_study_time integer,
  is_studying boolean,
  currently_studying_subject text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    gm.user_id,
    gm.role,
    COALESCE(u.username, 'Unknown') AS username,
    COALESCE(u.name, '') AS name,
    COALESCE(u.total_study_time, 0) AS total_study_time,
    COALESCE(u.is_studying, false) AS is_studying,
    u.currently_studying_subject
  FROM public.group_members gm
  LEFT JOIN public.users u
    ON u.auth_user_id = gm.user_id
  WHERE gm.group_id = _group_id
    AND public.is_group_member(_group_id, auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.find_user_by_username(_username text)
RETURNS TABLE (
  auth_user_id uuid,
  username text,
  name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.auth_user_id,
    u.username::text,
    u.name::text
  FROM public.users u
  WHERE u.auth_user_id IS NOT NULL
    AND lower(u.username) = lower(trim(_username))
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_group_by_code(_group_code text)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  group_code text,
  is_public boolean,
  created_by uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    g.id,
    g.name,
    g.description,
    g.group_code,
    g.is_public,
    g.created_by
  FROM public.groups g
  WHERE upper(g.group_code) = upper(trim(_group_code))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_group_member_profiles(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.find_user_by_username(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_group_by_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_group_member_profiles(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_user_by_username(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_group_by_code(text) TO authenticated;

DROP POLICY IF EXISTS "Members can view their groups" ON public.groups;
CREATE POLICY "Members can view their groups"
ON public.groups
FOR SELECT
TO authenticated
USING (public.is_group_member(id, auth.uid()));

DROP POLICY IF EXISTS "Members can view group members" ON public.group_members;
CREATE POLICY "Members can view group members"
ON public.group_members
FOR SELECT
TO authenticated
USING (public.is_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "Creators can remove members" ON public.group_members;
CREATE POLICY "Creators can remove members"
ON public.group_members
FOR DELETE
TO authenticated
USING (public.can_manage_group_members(group_id, auth.uid()));

DROP POLICY IF EXISTS "Authenticated users can join groups" ON public.group_members;
CREATE POLICY "Authenticated users can join groups"
ON public.group_members
FOR INSERT
TO authenticated
WITH CHECK (
  (
    auth.uid() = user_id
    AND (
      EXISTS (
        SELECT 1
        FROM public.groups g
        WHERE g.id = group_id
          AND (g.is_public = true OR g.created_by = auth.uid())
      )
      OR EXISTS (
        SELECT 1
        FROM public.notifications n
        WHERE n.group_id = group_id
          AND n.user_id = auth.uid()
          AND n.type = 'invite'
      )
    )
  )
  OR public.can_manage_group_members(group_id, auth.uid())
);

DROP POLICY IF EXISTS "Members can create sessions" ON public.group_study_sessions;
CREATE POLICY "Members can create sessions"
ON public.group_study_sessions
FOR INSERT
TO authenticated
WITH CHECK (public.is_group_member(group_id, auth.uid()));

DROP POLICY IF EXISTS "Members can view group sessions" ON public.group_study_sessions;
CREATE POLICY "Members can view group sessions"
ON public.group_study_sessions
FOR SELECT
TO authenticated
USING (public.is_group_member(group_id, auth.uid()));
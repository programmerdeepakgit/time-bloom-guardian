
-- Fix groups: Members can view their groups
DROP POLICY IF EXISTS "Members can view their groups" ON public.groups;
CREATE POLICY "Members can view their groups"
ON public.groups FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = groups.id AND gm.user_id = auth.uid()
  )
);

-- Fix group_members: Members can view group members
DROP POLICY IF EXISTS "Members can view group members" ON public.group_members;
CREATE POLICY "Members can view group members"
ON public.group_members FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm2
    WHERE gm2.group_id = group_members.group_id AND gm2.user_id = auth.uid()
  )
);

-- Fix group_members: Creators can remove members
DROP POLICY IF EXISTS "Creators can remove members" ON public.group_members;
CREATE POLICY "Creators can remove members"
ON public.group_members FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm2
    WHERE gm2.group_id = group_members.group_id AND gm2.user_id = auth.uid() AND gm2.role = 'creator'
  )
);

-- Fix group_study_sessions: Members can create sessions
DROP POLICY IF EXISTS "Members can create sessions" ON public.group_study_sessions;
CREATE POLICY "Members can create sessions"
ON public.group_study_sessions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_study_sessions.group_id AND gm.user_id = auth.uid()
  )
);

-- Fix group_study_sessions: Members can view group sessions
DROP POLICY IF EXISTS "Members can view group sessions" ON public.group_study_sessions;
CREATE POLICY "Members can view group sessions"
ON public.group_study_sessions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm
    WHERE gm.group_id = group_study_sessions.group_id AND gm.user_id = auth.uid()
  )
);

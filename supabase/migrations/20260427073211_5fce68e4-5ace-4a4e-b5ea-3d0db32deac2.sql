-- Group Assignments table
CREATE TABLE public.group_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL,
  created_by UUID NOT NULL,
  creator_name TEXT,
  subject TEXT NOT NULL,
  task TEXT NOT NULL,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_group_assignments_group ON public.group_assignments(group_id, created_at DESC);

ALTER TABLE public.group_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view group assignments"
  ON public.group_assignments FOR SELECT
  TO authenticated
  USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "Members can create group assignments"
  ON public.group_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by
    AND public.is_group_member(group_id, auth.uid())
  );

CREATE POLICY "Creator or group admin can delete assignments"
  ON public.group_assignments FOR DELETE
  TO authenticated
  USING (
    auth.uid() = created_by
    OR public.can_manage_group_members(group_id, auth.uid())
  );

-- Per-member completion tracking
CREATE TABLE public.group_assignment_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.group_assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(assignment_id, user_id)
);

CREATE INDEX idx_assignment_completions_assignment ON public.group_assignment_completions(assignment_id);

ALTER TABLE public.group_assignment_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view completions in their groups"
  ON public.group_assignment_completions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_assignments ga
      WHERE ga.id = assignment_id
        AND public.is_group_member(ga.group_id, auth.uid())
    )
  );

CREATE POLICY "Users can mark themselves complete"
  ON public.group_assignment_completions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.group_assignments ga
      WHERE ga.id = assignment_id
        AND public.is_group_member(ga.group_id, auth.uid())
    )
  );

CREATE POLICY "Users can undo their own completion"
  ON public.group_assignment_completions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
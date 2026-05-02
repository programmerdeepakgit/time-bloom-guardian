-- Participants of an active group study session
CREATE TABLE public.group_session_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  user_id UUID NOT NULL,
  username TEXT,
  status TEXT NOT NULL DEFAULT 'studying', -- 'studying' | 'break' | 'left'
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (session_id, user_id)
);

CREATE INDEX idx_gsp_session ON public.group_session_participants(session_id);
CREATE INDEX idx_gsp_user ON public.group_session_participants(user_id);

ALTER TABLE public.group_session_participants ENABLE ROW LEVEL SECURITY;

-- Members of the group can view participants
CREATE POLICY "Members can view session participants"
ON public.group_session_participants
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_study_sessions gss
    WHERE gss.id = group_session_participants.session_id
      AND public.is_group_member(gss.group_id, auth.uid())
  )
);

-- Users can join (insert) themselves into a session in their group
CREATE POLICY "Users can join session as themselves"
ON public.group_session_participants
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.group_study_sessions gss
    WHERE gss.id = group_session_participants.session_id
      AND public.is_group_member(gss.group_id, auth.uid())
  )
);

-- Users can update their own status
CREATE POLICY "Users can update own participation"
ON public.group_session_participants
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can leave (delete their row)
CREATE POLICY "Users can leave session"
ON public.group_session_participants
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Enable realtime
ALTER TABLE public.group_session_participants REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_session_participants;
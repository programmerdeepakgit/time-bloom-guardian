
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_studying boolean DEFAULT false;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS currently_studying_subject text DEFAULT null;

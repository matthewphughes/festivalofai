-- Rename event_replays table to sessions
ALTER TABLE public.event_replays RENAME TO sessions;

-- Add new columns for session scheduling and agenda
ALTER TABLE public.sessions 
  ADD COLUMN IF NOT EXISTS session_date DATE,
  ADD COLUMN IF NOT EXISTS session_time TIME,
  ADD COLUMN IF NOT EXISTS price_id TEXT,
  ADD COLUMN IF NOT EXISTS on_agenda BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS session_type TEXT CHECK (session_type IN ('keynote', 'workshop', 'break', 'closing', 'session')),
  ADD COLUMN IF NOT EXISTS track TEXT,
  ADD COLUMN IF NOT EXISTS agenda_display_order INTEGER;

-- Drop old policies on event_replays (which is now sessions)
DROP POLICY IF EXISTS "Admins can delete replays" ON public.sessions;
DROP POLICY IF EXISTS "Admins can insert replays" ON public.sessions;
DROP POLICY IF EXISTS "Admins can update replays" ON public.sessions;
DROP POLICY IF EXISTS "Admins can view all replays" ON public.sessions;
DROP POLICY IF EXISTS "Authenticated users can view published replays" ON public.sessions;

-- Create new policies on sessions table
CREATE POLICY "Admins can delete sessions" ON public.sessions
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert sessions" ON public.sessions
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update sessions" ON public.sessions
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all sessions" ON public.sessions
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view published sessions" ON public.sessions
  FOR SELECT USING (published = true);

-- Add comment for clarity on replay_purchases.replay_id
COMMENT ON COLUMN public.replay_purchases.replay_id IS 'References sessions.id (formerly event_replays.id)';
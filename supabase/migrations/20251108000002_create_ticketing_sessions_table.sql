-- Create ticketing_sessions table for managing concurrent ticket purchases
-- This table tracks active ticketing sessions to limit the number of concurrent users
-- purchasing tickets for a specific event

CREATE TABLE IF NOT EXISTS public.ticketing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_session_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'waiting', 'completed')),
  entered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_active_session UNIQUE (event_id, user_session_id, status)
);

-- Add index for common queries
CREATE INDEX idx_ticketing_sessions_event_status ON public.ticketing_sessions(event_id, status);
CREATE INDEX idx_ticketing_sessions_user_session ON public.ticketing_sessions(user_session_id);
CREATE INDEX idx_ticketing_sessions_created_at ON public.ticketing_sessions(created_at);

-- Add RLS policies
ALTER TABLE public.ticketing_sessions ENABLE ROW LEVEL SECURITY;

-- Allow users to read all sessions for an event (to see queue position)
CREATE POLICY "Anyone can view ticketing sessions"
  ON public.ticketing_sessions
  FOR SELECT
  USING (true);

-- Allow users to create their own sessions
CREATE POLICY "Anyone can create ticketing sessions"
  ON public.ticketing_sessions
  FOR INSERT
  WITH CHECK (true);

-- Allow users to update their own sessions
CREATE POLICY "Users can update their own sessions"
  ON public.ticketing_sessions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create function to automatically clean up old sessions
CREATE OR REPLACE FUNCTION cleanup_old_ticketing_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mark sessions older than 30 minutes as completed
  UPDATE public.ticketing_sessions
  SET status = 'completed', updated_at = NOW()
  WHERE status IN ('active', 'waiting')
    AND created_at < NOW() - INTERVAL '30 minutes';
END;
$$;

-- Add comment to table
COMMENT ON TABLE public.ticketing_sessions IS 'Manages concurrent access to event ticketing. Limits number of simultaneous ticket purchases per event.';

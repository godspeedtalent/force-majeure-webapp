-- Create event_attendees table for tracking ticket purchases and social proof
CREATE TABLE IF NOT EXISTS public.event_attendees (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    ticket_count integer NOT NULL DEFAULT 1 CHECK (ticket_count > 0),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Prevent duplicate entries for same user/event (but allow multiple tickets)
    UNIQUE(event_id, user_id)
);

-- Add indexes for performance
CREATE INDEX idx_event_attendees_event_id ON public.event_attendees(event_id);
CREATE INDEX idx_event_attendees_user_id ON public.event_attendees(user_id);
CREATE INDEX idx_event_attendees_created_at ON public.event_attendees(created_at DESC);

-- Enable RLS
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view attendee counts (for social proof)
CREATE POLICY "Event attendees are publicly viewable"
    ON public.event_attendees
    FOR SELECT
    USING (true);

-- Policy: Only authenticated users can insert (when purchasing tickets)
CREATE POLICY "Authenticated users can add attendance"
    ON public.event_attendees
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own attendance
CREATE POLICY "Users can update their own attendance"
    ON public.event_attendees
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Function to get attendee count for an event
CREATE OR REPLACE FUNCTION get_event_attendee_count(p_event_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count integer;
BEGIN
    SELECT COUNT(DISTINCT user_id)
    INTO v_count
    FROM public.event_attendees
    WHERE event_id = p_event_id
    AND user_id IS NOT NULL;

    RETURN COALESCE(v_count, 0);
END;
$$;

-- Function to get total ticket count for an event (including quantity)
CREATE OR REPLACE FUNCTION get_event_ticket_count(p_event_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count integer;
BEGIN
    SELECT COALESCE(SUM(ticket_count), 0)
    INTO v_count
    FROM public.event_attendees
    WHERE event_id = p_event_id;

    RETURN v_count;
END;
$$;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_event_attendees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_event_attendees_updated_at
    BEFORE UPDATE ON public.event_attendees
    FOR EACH ROW
    EXECUTE FUNCTION update_event_attendees_updated_at();

-- Grant necessary permissions
GRANT SELECT ON public.event_attendees TO anon, authenticated;
GRANT INSERT, UPDATE ON public.event_attendees TO authenticated;
GRANT EXECUTE ON FUNCTION get_event_attendee_count(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_event_ticket_count(uuid) TO anon, authenticated;

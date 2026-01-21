-- Add RSVP button subtitle field to events table
-- This allows event organizers to add a subtitle/footnote that displays below the RSVP button

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS rsvp_button_subtitle TEXT;

-- Add comment describing the column
COMMENT ON COLUMN public.events.rsvp_button_subtitle IS 'Optional subtitle/footnote displayed below the RSVP button on the event page';

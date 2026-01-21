-- Add toggle for RSVP email notifications
-- When enabled, users receive email confirmation after RSVPing to an event

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS send_rsvp_email BOOLEAN NOT NULL DEFAULT true;

-- Add comment describing the column
COMMENT ON COLUMN public.events.send_rsvp_email IS 'Whether to send email confirmation to users when they RSVP to this event';

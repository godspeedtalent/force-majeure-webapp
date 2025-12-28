-- Fix artist_registrations status CHECK constraint
-- The original constraint only allows: 'pending', 'approved', 'rejected'
-- But the code uses 'denied' instead of 'rejected' for consistency with user_requests table
-- This migration updates the constraint to allow 'denied' as well

-- Drop the existing constraint
ALTER TABLE public.artist_registrations
DROP CONSTRAINT IF EXISTS artist_registrations_status_check;

-- Add the new constraint with 'denied' included (keeping 'rejected' for backwards compatibility)
ALTER TABLE public.artist_registrations
ADD CONSTRAINT artist_registrations_status_check
CHECK (status IN ('pending', 'approved', 'rejected', 'denied'));

-- Update any existing 'rejected' records to 'denied' for consistency
UPDATE public.artist_registrations
SET status = 'denied'
WHERE status = 'rejected';

COMMENT ON CONSTRAINT artist_registrations_status_check ON public.artist_registrations IS
  'Status can be: pending (awaiting review), approved (accepted), denied (rejected). The value "rejected" is deprecated but allowed for backwards compatibility.';

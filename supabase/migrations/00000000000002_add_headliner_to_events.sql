-- Migration: Add headliner_id to events table
-- Created: 2025-11-11
-- Description: Adds headliner_id foreign key to events table to link to headlining artist

-- Add headliner_id column to events table with specific constraint name
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS headliner_id UUID;

-- Add foreign key constraint with explicit name for use in queries
ALTER TABLE public.events
  ADD CONSTRAINT events_headliner_id_fkey 
  FOREIGN KEY (headliner_id) 
  REFERENCES public.artists(id) 
  ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_events_headliner_id ON public.events(headliner_id);

-- Add column comment
COMMENT ON COLUMN public.events.headliner_id IS 'The headlining artist for this event';

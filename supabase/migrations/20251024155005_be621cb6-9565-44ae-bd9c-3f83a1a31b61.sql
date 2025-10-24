-- Add end_time and is_after_hours columns to events table
ALTER TABLE events 
ADD COLUMN end_time text,
ADD COLUMN is_after_hours boolean DEFAULT false NOT NULL;

-- Add a comment to clarify the end_time behavior
COMMENT ON COLUMN events.end_time IS 'End time for the event. NULL when is_after_hours is true';
COMMENT ON COLUMN events.is_after_hours IS 'When true, event has no end time (runs past closing/into morning)';
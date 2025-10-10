-- Add checkin_count column to scavenger_locations to track QR scans
alter table if exists public.scavenger_locations
  add column if not exists checkin_count integer not null default 0;

-- Ensure existing rows have a non-null value
update public.scavenger_locations
  set checkin_count = coalesce(checkin_count, 0);

-- Migration: Add Physical Ticketing Infrastructure
-- Description: Adds has_protection field to tickets and creates scan audit table
-- Date: 2025-12-02

-- Add has_protection field to tickets table
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS has_protection BOOLEAN NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN tickets.has_protection IS 'Whether this ticket has protection product coverage';

-- Create ticket_scan_events table for audit logging
CREATE TABLE IF NOT EXISTS ticket_scan_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  scanned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  scan_result TEXT NOT NULL CHECK (scan_result IN ('success', 'invalid', 'already_used', 'refunded', 'cancelled')),
  scan_location JSONB DEFAULT NULL,
  device_info JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ticket_scan_events_ticket_id ON ticket_scan_events(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_scan_events_event_id ON ticket_scan_events(event_id);
CREATE INDEX IF NOT EXISTS idx_ticket_scan_events_created_at ON ticket_scan_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_scan_events_scan_result ON ticket_scan_events(scan_result);

-- Add comments for documentation
COMMENT ON TABLE ticket_scan_events IS 'Audit log of all ticket scanning attempts';
COMMENT ON COLUMN ticket_scan_events.scan_result IS 'Result of the scan attempt: success, invalid, already_used, refunded, or cancelled';
COMMENT ON COLUMN ticket_scan_events.scan_location IS 'Optional GPS coordinates or location name where scan occurred';
COMMENT ON COLUMN ticket_scan_events.device_info IS 'Optional device information (browser, OS, etc.)';

-- Enable Row Level Security
ALTER TABLE ticket_scan_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Staff with SCAN_TICKETS permission can insert scan events
DROP POLICY IF EXISTS "Staff can log scan events" ON ticket_scan_events;
CREATE POLICY "Staff can log scan events"
  ON ticket_scan_events
  FOR INSERT
  WITH CHECK (
    has_permission(auth.uid(), 'scan_tickets')
    OR has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'developer')
  );

-- RLS Policy: Staff and event organizers can view scan events
DROP POLICY IF EXISTS "Staff and organizers can view scan events" ON ticket_scan_events;
CREATE POLICY "Staff and organizers can view scan events"
  ON ticket_scan_events
  FOR SELECT
  USING (
    -- Admins and developers can see all
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'developer')
    OR
    -- Users with scan permission can see all
    has_permission(auth.uid(), 'scan_tickets')
    OR
    -- Organization owners can see scan events for their organization's events
    EXISTS (
      SELECT 1 FROM events e
      JOIN organizations o ON o.id = e.organization_id
      WHERE e.id = ticket_scan_events.event_id
      AND o.owner_id = auth.uid()
    )
  );

-- Create view for daily scan statistics
CREATE OR REPLACE VIEW daily_scan_statistics AS
SELECT
  event_id,
  DATE(created_at) as scan_date,
  COUNT(*) as total_scans,
  COUNT(*) FILTER (WHERE scan_result = 'success') as successful_scans,
  COUNT(*) FILTER (WHERE scan_result = 'invalid') as invalid_scans,
  COUNT(*) FILTER (WHERE scan_result = 'already_used') as duplicate_scans,
  COUNT(*) FILTER (WHERE scan_result IN ('refunded', 'cancelled')) as rejected_scans,
  COUNT(DISTINCT ticket_id) as unique_tickets_scanned,
  MIN(created_at) as first_scan,
  MAX(created_at) as last_scan
FROM ticket_scan_events
GROUP BY event_id, DATE(created_at);

-- Add comment for documentation
COMMENT ON VIEW daily_scan_statistics IS 'Aggregated daily statistics for ticket scanning by event';

-- Grant access to the view
GRANT SELECT ON daily_scan_statistics TO authenticated;

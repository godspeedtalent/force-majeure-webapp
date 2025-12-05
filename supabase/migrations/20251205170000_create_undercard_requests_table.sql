-- Migration: Create undercard_requests table
-- Description: Stores requests from artists who signed up via an event's "Looking for Artists" link

-- Create the undercard_requests table
CREATE TABLE IF NOT EXISTS undercard_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  artist_registration_id UUID NOT NULL REFERENCES artist_registrations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_notes TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure an artist can only request once per event
  UNIQUE(event_id, artist_registration_id)
);

-- Add comments
COMMENT ON TABLE undercard_requests IS 'Stores undercard/opening slot requests from artists who signed up via an event Looking for Artists link';
COMMENT ON COLUMN undercard_requests.event_id IS 'The event the artist is requesting to open for';
COMMENT ON COLUMN undercard_requests.artist_registration_id IS 'The artist registration associated with this request';
COMMENT ON COLUMN undercard_requests.status IS 'Request status: pending, approved, or rejected';

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_undercard_requests_event_id ON undercard_requests(event_id);
CREATE INDEX IF NOT EXISTS idx_undercard_requests_status ON undercard_requests(status);
CREATE INDEX IF NOT EXISTS idx_undercard_requests_created_at ON undercard_requests(created_at DESC);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_undercard_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_undercard_requests_updated_at
  BEFORE UPDATE ON undercard_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_undercard_requests_updated_at();

-- Enable RLS
ALTER TABLE undercard_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow anyone to insert (artists signing up)
CREATE POLICY "Anyone can create undercard requests"
  ON undercard_requests
  FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to view requests for events they manage
CREATE POLICY "Event managers can view undercard requests"
  ON undercard_requests
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Allow admins to update requests (approve/reject)
CREATE POLICY "Admins can update undercard requests"
  ON undercard_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'org_admin')
    )
  );

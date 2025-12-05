-- Migration: Add user-artist linkage and user requests system
-- Description: Adds user_id to artists table and creates user_requests table for managing various user requests

-- ============================================
-- 1. Add user_id column to artists table
-- ============================================
ALTER TABLE artists
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_artists_user_id ON artists(user_id);

-- Add comment
COMMENT ON COLUMN artists.user_id IS 'The user account linked to this artist profile';

-- ============================================
-- 2. Create user_requests table
-- ============================================
CREATE TABLE IF NOT EXISTS user_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Request metadata
  request_type TEXT NOT NULL CHECK (request_type IN ('link_artist', 'delete_data', 'unlink_artist')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),

  -- Requester info
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Request-specific parameters (JSON for flexibility)
  parameters JSONB,

  -- Resolution info
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  denial_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate pending requests of the same type
  CONSTRAINT unique_pending_request UNIQUE (user_id, request_type, status)
    DEFERRABLE INITIALLY DEFERRED
);

-- Add comments
COMMENT ON TABLE user_requests IS 'Stores user requests that require admin approval (artist linking, data deletion, etc.)';
COMMENT ON COLUMN user_requests.request_type IS 'Type of request: link_artist, delete_data, unlink_artist';
COMMENT ON COLUMN user_requests.parameters IS 'JSON parameters specific to the request type (e.g., artist_id for link requests)';
COMMENT ON COLUMN user_requests.denial_reason IS 'Reason provided by admin when denying a request';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_requests_user_id ON user_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_requests_status ON user_requests(status);
CREATE INDEX IF NOT EXISTS idx_user_requests_type ON user_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_user_requests_created_at ON user_requests(created_at DESC);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_user_requests_updated_at ON user_requests;
CREATE TRIGGER trigger_user_requests_updated_at
  BEFORE UPDATE ON user_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_user_requests_updated_at();

-- ============================================
-- 3. RLS Policies
-- ============================================

-- Enable RLS on user_requests
ALTER TABLE user_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first for idempotency
DROP POLICY IF EXISTS "Users can view own requests" ON user_requests;
DROP POLICY IF EXISTS "Users can create own requests" ON user_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON user_requests;
DROP POLICY IF EXISTS "Admins can update requests" ON user_requests;
DROP POLICY IF EXISTS "Users can view their linked artist" ON artists;

-- Users can view their own requests
CREATE POLICY "Users can view own requests"
  ON user_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create requests for themselves
CREATE POLICY "Users can create own requests"
  ON user_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins and developers can view all requests
CREATE POLICY "Admins can view all requests"
  ON user_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'developer', 'org_admin')
    )
  );

-- Admins can update requests (approve/deny)
CREATE POLICY "Admins can update requests"
  ON user_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'developer', 'org_admin')
    )
  );

-- Update artists RLS to allow users to view their linked artist
CREATE POLICY "Users can view their linked artist"
  ON artists
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- ============================================
-- 4. Function to handle request approval callbacks
-- ============================================
CREATE OR REPLACE FUNCTION handle_user_request_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process when status changes to 'approved'
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    CASE NEW.request_type
      WHEN 'link_artist' THEN
        -- Link the artist to the user
        UPDATE artists
        SET user_id = NEW.user_id
        WHERE id = (NEW.parameters->>'artist_id')::UUID
        AND user_id IS NULL; -- Only if not already linked

      WHEN 'unlink_artist' THEN
        -- Unlink the artist from the user
        UPDATE artists
        SET user_id = NULL
        WHERE id = (NEW.parameters->>'artist_id')::UUID
        AND user_id = NEW.user_id;

      WHEN 'delete_data' THEN
        -- Data deletion is handled manually by admin after approval
        -- This just marks the request as approved
        NULL;
    END CASE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_user_request_approval ON user_requests;
CREATE TRIGGER trigger_user_request_approval
  AFTER UPDATE ON user_requests
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND OLD.status = 'pending')
  EXECUTE FUNCTION handle_user_request_approval();

-- Migration: RLS policies for user_requests table
-- Description: Enables RLS and creates policies for user_requests table

-- Enable RLS on user_requests
ALTER TABLE user_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first for idempotency
DROP POLICY IF EXISTS "Users can view own requests" ON user_requests;
DROP POLICY IF EXISTS "Users can create own requests" ON user_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON user_requests;
DROP POLICY IF EXISTS "Admins can update requests" ON user_requests;

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

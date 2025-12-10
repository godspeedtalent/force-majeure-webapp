-- Migration: Fix user_requests RLS policies
-- Description: Simplifies policies to ensure both regular users and admins can access user_requests

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own requests" ON user_requests;
DROP POLICY IF EXISTS "Users can create own requests" ON user_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON user_requests;
DROP POLICY IF EXISTS "Admins can update requests" ON user_requests;

-- Users can view their own requests OR if they are an admin/developer
CREATE POLICY "Users can view own requests"
  ON user_requests
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'developer', 'org_admin')
    )
  );

-- Users can create requests for themselves
CREATE POLICY "Users can create own requests"
  ON user_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can update requests (approve/deny)
CREATE POLICY "Admins can update requests"
  ON user_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'developer', 'org_admin')
    )
  );

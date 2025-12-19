-- Migration: Final fix for user_requests RLS policies
-- Description: Ensures RLS is enabled and policies allow authenticated users to interact with user_requests

-- First, ensure RLS is enabled
ALTER TABLE user_requests ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on user_requests to start fresh
DROP POLICY IF EXISTS "Users can view own requests" ON user_requests;
DROP POLICY IF EXISTS "Users can create own requests" ON user_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON user_requests;
DROP POLICY IF EXISTS "Admins can update requests" ON user_requests;
DROP POLICY IF EXISTS "user_requests_select_policy" ON user_requests;
DROP POLICY IF EXISTS "user_requests_insert_policy" ON user_requests;
DROP POLICY IF EXISTS "user_requests_update_policy" ON user_requests;
DROP POLICY IF EXISTS "user_requests_delete_policy" ON user_requests;

-- SELECT: Users can view their own requests, admins/developers can view all
CREATE POLICY "user_requests_select_policy"
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

-- INSERT: Authenticated users can create requests for themselves
CREATE POLICY "user_requests_insert_policy"
  ON user_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Only admins/developers can update requests (approve/deny)
CREATE POLICY "user_requests_update_policy"
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
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'developer', 'org_admin')
    )
  );

-- DELETE: Only admins can delete requests
CREATE POLICY "user_requests_delete_policy"
  ON user_requests
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'developer')
    )
  );

-- Grant table-level permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON user_requests TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

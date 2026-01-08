-- Migration: Fix artist_registrations UPDATE policy with missing WITH CHECK
-- Description: Adds WITH CHECK clause to ensure UPDATE operations are properly validated
-- Issue: The UPDATE policy only had USING clause, which could cause issues with update operations

-- ============================================
-- Fix artist_registrations UPDATE policy
-- ============================================
-- The UPDATE policy was missing WITH CHECK clause, which is required for
-- proper validation when updating rows.

DROP POLICY IF EXISTS "Admins and developers can update artist registrations" ON artist_registrations;

CREATE POLICY "Admins and developers can update artist registrations"
  ON artist_registrations
  FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'developer')
    OR has_role(auth.uid(), 'org_admin')
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'developer')
    OR has_role(auth.uid(), 'org_admin')
  );

-- Add comment documenting the fix
COMMENT ON POLICY "Admins and developers can update artist registrations" ON artist_registrations IS
  'Allows admin, developer, and org_admin roles to approve/deny artist registration requests. Fixed 2026-01-08 to add WITH CHECK clause.';

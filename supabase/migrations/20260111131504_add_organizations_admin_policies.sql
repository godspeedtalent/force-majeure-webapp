-- Migration: Add missing grants and admin policies for organizations table
-- Fixes: "permission denied for table organizations" error when admins try to update

-- ============================================================================
-- GRANT UPDATE and DELETE permissions (SELECT and INSERT already exist)
-- ============================================================================
GRANT UPDATE ON public.organizations TO authenticated;
GRANT DELETE ON public.organizations TO authenticated;

-- ============================================================================
-- Add admin bypass RLS policies for organizations
-- Admins should be able to manage all organizations (similar to venues)
-- ============================================================================

-- Drop existing policies first to recreate with admin support
DROP POLICY IF EXISTS "Users can view organizations they own or belong to" ON organizations;
DROP POLICY IF EXISTS "Organization owners can update their organizations" ON organizations;
DROP POLICY IF EXISTS "Organization owners can delete their organizations" ON organizations;

-- Admin policies for organizations (matching venues pattern)
DROP POLICY IF EXISTS "Admins can view all organizations" ON organizations;
DROP POLICY IF EXISTS "Admins can update organizations" ON organizations;
DROP POLICY IF EXISTS "Admins can delete organizations" ON organizations;

-- SELECT: Users can view orgs they own/belong to, admins can view all
CREATE POLICY "Users can view organizations they own or belong to"
  ON organizations FOR SELECT
  USING (
    auth.uid() = owner_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.organization_id = organizations.id
    )
    OR has_role(auth.uid(), 'admin')
    OR is_dev_admin(auth.uid())
  );

-- UPDATE: Owners can update their orgs, admins can update all
CREATE POLICY "Organization owners can update their organizations"
  ON organizations FOR UPDATE
  USING (
    auth.uid() = owner_id
    OR has_role(auth.uid(), 'admin')
    OR is_dev_admin(auth.uid())
  )
  WITH CHECK (
    auth.uid() = owner_id
    OR has_role(auth.uid(), 'admin')
    OR is_dev_admin(auth.uid())
  );

-- DELETE: Owners can delete their orgs, admins can delete all
CREATE POLICY "Organization owners can delete their organizations"
  ON organizations FOR DELETE
  USING (
    auth.uid() = owner_id
    OR has_role(auth.uid(), 'admin')
    OR is_dev_admin(auth.uid())
  );
-- ============================================
-- Fix undercard_requests table permissions
-- ============================================
-- The undercard_requests table has RLS policies but NO GRANTs,
-- causing 403 Forbidden errors for all operations.

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.undercard_requests TO authenticated;

-- Grant SELECT to anon for public visibility (if needed)
GRANT SELECT ON public.undercard_requests TO anon;

-- ============================================
-- Fix RLS policies for admin/developer access
-- ============================================

-- Drop existing policies that may be too restrictive
DROP POLICY IF EXISTS "Event managers can view undercard requests" ON public.undercard_requests;
DROP POLICY IF EXISTS "Admins can update undercard requests" ON public.undercard_requests;

-- Recreate with proper admin/developer access
CREATE POLICY "Admins and devs can view all undercard requests"
  ON public.undercard_requests
  FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- Allow authenticated users to view their own requests (via artist_registration)
CREATE POLICY "Users can view their own undercard requests"
  ON public.undercard_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM artist_registrations ar
      WHERE ar.id = undercard_requests.artist_registration_id
      AND ar.user_id = auth.uid()
    )
  );

-- Allow admins/devs to update requests (approve/reject)
CREATE POLICY "Admins and devs can update undercard requests"
  ON public.undercard_requests
  FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- Allow admins/devs to delete requests
CREATE POLICY "Admins and devs can delete undercard requests"
  ON public.undercard_requests
  FOR DELETE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

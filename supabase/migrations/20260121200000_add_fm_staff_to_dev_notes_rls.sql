-- Migration: Add fm_staff role to dev_notes RLS policies
-- Description: Allows FM staff members to create, view, update, and delete dev notes
-- This fixes the RLS violation when staff members try to insert notes

-- Drop existing policies
DROP POLICY IF EXISTS "Developers can view all dev notes" ON dev_notes;
DROP POLICY IF EXISTS "Developers can create dev notes" ON dev_notes;
DROP POLICY IF EXISTS "Developers can update their own dev notes" ON dev_notes;
DROP POLICY IF EXISTS "Developers can delete their own dev notes" ON dev_notes;

-- Recreate policies with fm_staff role included
CREATE POLICY "Developers can view all dev notes"
  ON dev_notes FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (
      has_role(auth.uid(), 'developer')
      OR has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'fm_staff')
    )
  );

CREATE POLICY "Developers can create dev notes"
  ON dev_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (
      has_role(auth.uid(), 'developer')
      OR has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'fm_staff')
    )
    AND author_id = auth.uid()
  );

CREATE POLICY "Developers can update their own dev notes"
  ON dev_notes FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    author_id = auth.uid()
    AND (
      has_role(auth.uid(), 'developer')
      OR has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'fm_staff')
    )
  )
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Developers can delete their own dev notes"
  ON dev_notes FOR DELETE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    author_id = auth.uid()
    AND (
      has_role(auth.uid(), 'developer')
      OR has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'fm_staff')
    )
  );

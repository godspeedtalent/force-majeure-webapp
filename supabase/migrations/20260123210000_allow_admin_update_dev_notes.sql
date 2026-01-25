-- Migration: Allow admins to update and delete any dev note
-- Description: Admins should be able to resolve/update/delete any staff note, not just their own

-- Drop existing update and delete policies
DROP POLICY IF EXISTS "Developers can update their own dev notes" ON dev_notes;
DROP POLICY IF EXISTS "Developers can delete their own dev notes" ON dev_notes;

-- Recreate UPDATE policy: authors can update their own, admins can update any
CREATE POLICY "Staff can update dev notes"
  ON dev_notes FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (
      has_role(auth.uid(), 'developer')
      OR has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'fm_staff')
    )
    AND (
      author_id = auth.uid()
      OR has_role(auth.uid(), 'admin')
    )
  )
  WITH CHECK (
    author_id = auth.uid()
    OR has_role(auth.uid(), 'admin')
  );

-- Recreate DELETE policy: authors can delete their own, admins can delete any
CREATE POLICY "Staff can delete dev notes"
  ON dev_notes FOR DELETE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (
      has_role(auth.uid(), 'developer')
      OR has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'fm_staff')
    )
    AND (
      author_id = auth.uid()
      OR has_role(auth.uid(), 'admin')
    )
  );

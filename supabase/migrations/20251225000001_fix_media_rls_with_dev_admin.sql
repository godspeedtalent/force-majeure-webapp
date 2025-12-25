-- Fix media_galleries, media_items, and artist_recordings RLS policies
-- Adding is_dev_admin fallback to match other table policies

-- ============================================
-- MEDIA_GALLERIES - Drop and recreate
-- ============================================
DROP POLICY IF EXISTS "Public can view active galleries" ON media_galleries;
DROP POLICY IF EXISTS "Admins can view all galleries" ON media_galleries;
DROP POLICY IF EXISTS "Admins can insert galleries" ON media_galleries;
DROP POLICY IF EXISTS "Admins can update galleries" ON media_galleries;
DROP POLICY IF EXISTS "Admins can delete galleries" ON media_galleries;

-- 1. Public can view active galleries
CREATE POLICY "Public can view active galleries"
  ON media_galleries FOR SELECT
  USING (is_active = true);

-- 2. Admins/developers can view ALL galleries (including inactive)
CREATE POLICY "Admins can view all galleries"
  ON media_galleries FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- 3. Admins/developers can insert galleries
CREATE POLICY "Admins can insert galleries"
  ON media_galleries FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- 4. Admins/developers can update galleries
CREATE POLICY "Admins can update galleries"
  ON media_galleries FOR UPDATE
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

-- 5. Admins/developers can delete galleries
CREATE POLICY "Admins can delete galleries"
  ON media_galleries FOR DELETE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- ============================================
-- MEDIA_ITEMS - Drop and recreate
-- ============================================
DROP POLICY IF EXISTS "Public can view active media items" ON media_items;
DROP POLICY IF EXISTS "Admins can view all media items" ON media_items;
DROP POLICY IF EXISTS "Admins can insert media items" ON media_items;
DROP POLICY IF EXISTS "Admins can update media items" ON media_items;
DROP POLICY IF EXISTS "Admins can delete media items" ON media_items;

-- 1. Public can view active media items
CREATE POLICY "Public can view active media items"
  ON media_items FOR SELECT
  USING (is_active = true);

-- 2. Admins/developers can view ALL media items (including inactive)
CREATE POLICY "Admins can view all media items"
  ON media_items FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- 3. Admins/developers can insert media items
CREATE POLICY "Admins can insert media items"
  ON media_items FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- 4. Admins/developers can update media items
CREATE POLICY "Admins can update media items"
  ON media_items FOR UPDATE
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

-- 5. Admins/developers can delete media items
CREATE POLICY "Admins can delete media items"
  ON media_items FOR DELETE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

-- ============================================
-- ARTIST_RECORDINGS - Drop and recreate
-- ============================================
DROP POLICY IF EXISTS "Public can view recordings" ON artist_recordings;
DROP POLICY IF EXISTS "Admins can insert recordings" ON artist_recordings;
DROP POLICY IF EXISTS "Admins can update recordings" ON artist_recordings;
DROP POLICY IF EXISTS "Admins can delete recordings" ON artist_recordings;

-- 1. Public can view all recordings
CREATE POLICY "Public can view recordings"
  ON artist_recordings FOR SELECT
  USING (true);

-- 2. Admins/developers/org_admins can insert recordings
CREATE POLICY "Admins can insert recordings"
  ON artist_recordings FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    has_role(auth.uid(), 'org_admin') OR
    is_dev_admin(auth.uid())
  );

-- 3. Admins/developers/org_admins can update recordings
CREATE POLICY "Admins can update recordings"
  ON artist_recordings FOR UPDATE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    has_role(auth.uid(), 'org_admin') OR
    is_dev_admin(auth.uid())
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    has_role(auth.uid(), 'org_admin') OR
    is_dev_admin(auth.uid())
  );

-- 4. Admins/developers/org_admins can delete recordings
CREATE POLICY "Admins can delete recordings"
  ON artist_recordings FOR DELETE
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    has_role(auth.uid(), 'org_admin') OR
    is_dev_admin(auth.uid())
  );

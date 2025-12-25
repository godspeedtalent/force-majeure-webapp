-- Fix media_galleries, media_items, and artist_recordings RLS policies
-- Issue: Admins/developers getting 403 errors due to policy conflicts

-- ============================================
-- MEDIA_GALLERIES
-- ============================================
DROP POLICY IF EXISTS "Anyone can view active galleries" ON media_galleries;
DROP POLICY IF EXISTS "Public can view active galleries" ON media_galleries;
DROP POLICY IF EXISTS "Admins can manage galleries" ON media_galleries;
DROP POLICY IF EXISTS "Admins can view all galleries" ON media_galleries;
DROP POLICY IF EXISTS "Admins can insert galleries" ON media_galleries;
DROP POLICY IF EXISTS "Admins can update galleries" ON media_galleries;
DROP POLICY IF EXISTS "Admins can delete galleries" ON media_galleries;

-- ============================================
-- MEDIA_ITEMS
-- ============================================
DROP POLICY IF EXISTS "Anyone can view active media items" ON media_items;
DROP POLICY IF EXISTS "Public can view active media items" ON media_items;
DROP POLICY IF EXISTS "Admins can manage media items" ON media_items;
DROP POLICY IF EXISTS "Admins can view all media items" ON media_items;
DROP POLICY IF EXISTS "Admins can insert media items" ON media_items;
DROP POLICY IF EXISTS "Admins can update media items" ON media_items;
DROP POLICY IF EXISTS "Admins can delete media items" ON media_items;

-- ============================================
-- ARTIST_RECORDINGS
-- ============================================
DROP POLICY IF EXISTS "Artist recordings are viewable by everyone" ON artist_recordings;
DROP POLICY IF EXISTS "Admins can manage recordings" ON artist_recordings;
DROP POLICY IF EXISTS "Admins can view all recordings" ON artist_recordings;
DROP POLICY IF EXISTS "Admins can insert recordings" ON artist_recordings;
DROP POLICY IF EXISTS "Admins can update recordings" ON artist_recordings;
DROP POLICY IF EXISTS "Admins can delete recordings" ON artist_recordings;

-- media_galleries policies
-- 1. Public can view active galleries
CREATE POLICY "Public can view active galleries"
  ON media_galleries FOR SELECT
  USING (is_active = true);

-- 2. Admins/developers can view ALL galleries (including inactive)
CREATE POLICY "Admins can view all galleries"
  ON media_galleries FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'developer')
    )
  );

-- 3. Admins/developers can insert galleries
CREATE POLICY "Admins can insert galleries"
  ON media_galleries FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'developer')
    )
  );

-- 4. Admins/developers can update galleries
CREATE POLICY "Admins can update galleries"
  ON media_galleries FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'developer')
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'developer')
    )
  );

-- 5. Admins/developers can delete galleries
CREATE POLICY "Admins can delete galleries"
  ON media_galleries FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'developer')
    )
  );

-- media_items policies
-- 1. Public can view active media items
CREATE POLICY "Public can view active media items"
  ON media_items FOR SELECT
  USING (is_active = true);

-- 2. Admins/developers can view ALL media items (including inactive)
CREATE POLICY "Admins can view all media items"
  ON media_items FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'developer')
    )
  );

-- 3. Admins/developers can insert media items
CREATE POLICY "Admins can insert media items"
  ON media_items FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'developer')
    )
  );

-- 4. Admins/developers can update media items
CREATE POLICY "Admins can update media items"
  ON media_items FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'developer')
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'developer')
    )
  );

-- 5. Admins/developers can delete media items
CREATE POLICY "Admins can delete media items"
  ON media_items FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'developer')
    )
  );

-- ============================================
-- ARTIST_RECORDINGS POLICIES
-- ============================================

-- 1. Public can view all recordings
CREATE POLICY "Public can view recordings"
  ON artist_recordings FOR SELECT
  USING (true);

-- 2. Admins/developers/org_admins can insert recordings
CREATE POLICY "Admins can insert recordings"
  ON artist_recordings FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'developer') OR
      has_role(auth.uid(), 'org_admin')
    )
  );

-- 3. Admins/developers/org_admins can update recordings
CREATE POLICY "Admins can update recordings"
  ON artist_recordings FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'developer') OR
      has_role(auth.uid(), 'org_admin')
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'developer') OR
      has_role(auth.uid(), 'org_admin')
    )
  );

-- 4. Admins/developers/org_admins can delete recordings
CREATE POLICY "Admins can delete recordings"
  ON artist_recordings FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'developer') OR
      has_role(auth.uid(), 'org_admin')
    )
  );

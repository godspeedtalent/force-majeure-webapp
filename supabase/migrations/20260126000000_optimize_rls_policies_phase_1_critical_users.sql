-- ============================================================================
-- RLS Policy Optimization - Phase 1: Critical User Tables
-- ============================================================================
--
-- Optimizes RLS policies by wrapping auth.uid(), has_role(), and is_dev_admin()
-- calls with (SELECT ...) to enable index usage and prevent sequential scans.
--
-- Tables in this phase:
-- - profiles (5 policies)
-- - orders (5 policies)
-- - datagrid_configs (4 policies)
-- - organizations (4 policies)
-- - exclusive_content_grants (4 policies)
--
-- Total: 22 policies
--
-- Performance Impact:
-- Sequential scan: O(n) - scans entire table
-- Index scan: O(log n) - uses B-tree indexes
-- Expected improvement: 10-100x faster on user-specific queries
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLE: profiles (5 policies) - HIGHEST PRIORITY
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

-- ----------------------------------------------------------------------------
-- TABLE: orders (5 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
CREATE POLICY "Users can insert their own orders"
  ON orders FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can update orders" ON orders;
CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can delete orders" ON orders;
CREATE POLICY "Admins can delete orders"
  ON orders FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

-- ----------------------------------------------------------------------------
-- TABLE: datagrid_configs (4 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view own datagrid configs" ON datagrid_configs;
CREATE POLICY "Users can view own datagrid configs"
  ON datagrid_configs FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own datagrid configs" ON datagrid_configs;
CREATE POLICY "Users can insert own datagrid configs"
  ON datagrid_configs FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own datagrid configs" ON datagrid_configs;
CREATE POLICY "Users can update own datagrid configs"
  ON datagrid_configs FOR UPDATE
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own datagrid configs" ON datagrid_configs;
CREATE POLICY "Users can delete own datagrid configs"
  ON datagrid_configs FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- ----------------------------------------------------------------------------
-- TABLE: organizations (4 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view organizations they own or belong to" ON organizations;
CREATE POLICY "Users can view organizations they own or belong to"
  ON organizations FOR SELECT
  USING (
    (SELECT auth.uid()) = owner_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = (SELECT auth.uid())
      AND profiles.organization_id = organizations.id
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;
CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = owner_id);

DROP POLICY IF EXISTS "Organization owners can update their organizations" ON organizations;
CREATE POLICY "Organization owners can update their organizations"
  ON organizations FOR UPDATE
  USING ((SELECT auth.uid()) = owner_id)
  WITH CHECK ((SELECT auth.uid()) = owner_id);

DROP POLICY IF EXISTS "Organization owners can delete their organizations" ON organizations;
CREATE POLICY "Organization owners can delete their organizations"
  ON organizations FOR DELETE
  USING ((SELECT auth.uid()) = owner_id);

-- ----------------------------------------------------------------------------
-- TABLE: exclusive_content_grants (4 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Users can view their own content grants" ON exclusive_content_grants;
CREATE POLICY "Users can view their own content grants"
  ON exclusive_content_grants FOR SELECT
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Admins can insert content grants" ON exclusive_content_grants;
CREATE POLICY "Admins can insert content grants"
  ON exclusive_content_grants FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can update content grants" ON exclusive_content_grants;
CREATE POLICY "Admins can update content grants"
  ON exclusive_content_grants FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

DROP POLICY IF EXISTS "Admins can delete content grants" ON exclusive_content_grants;
CREATE POLICY "Admins can delete content grants"
  ON exclusive_content_grants FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) IS NOT NULL AND
    (has_role((SELECT auth.uid()), 'admin') OR is_dev_admin((SELECT auth.uid())))
  );

-- ============================================================================
-- End of Phase 1 Migration
-- ============================================================================
--
-- Verification queries to run after migration:
--
-- Check index usage on profiles:
-- SELECT * FROM pg_stat_user_indexes WHERE tablename = 'profiles';
--
-- Verify policy changes:
-- SELECT policyname, tablename FROM pg_policies
-- WHERE tablename IN ('profiles', 'orders', 'datagrid_configs', 'organizations', 'exclusive_content_grants')
-- ORDER BY tablename, policyname;
--
-- Test query performance (replace <your_user_id>):
-- EXPLAIN ANALYZE SELECT * FROM profiles WHERE id = '<your_user_id>';
-- EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = '<your_user_id>';
-- ============================================================================

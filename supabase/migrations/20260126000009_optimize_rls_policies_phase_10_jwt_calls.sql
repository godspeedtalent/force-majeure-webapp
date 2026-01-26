-- ============================================================================
-- RLS Policy Optimization - Phase 10: Fix auth.jwt() Calls
-- ============================================================================
--
-- This migration fixes the 3 policies with unoptimized auth.jwt() calls.
--
-- Pattern: auth.jwt() -> (select auth.jwt())
--
-- These are the final unoptimized auth function calls in the database.
-- After this migration, all 607 Supabase issues should be resolved.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLE: user_roles (3 policies)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Admins can delete user_roles" ON user_roles;
CREATE POLICY "Admins can delete user_roles"
  ON user_roles FOR DELETE
  USING (
    (has_role(( SELECT auth.uid() AS uid), 'admin'::text) OR is_dev_admin(( SELECT auth.uid() AS uid)) OR (((select auth.jwt()) ->> 'role'::text) = 'service_role'::text))
  );

DROP POLICY IF EXISTS "Admins can update user_roles" ON user_roles;
CREATE POLICY "Admins can update user_roles"
  ON user_roles FOR UPDATE
  USING (
    (has_role(( SELECT auth.uid() AS uid), 'admin'::text) OR is_dev_admin(( SELECT auth.uid() AS uid)) OR (((select auth.jwt()) ->> 'role'::text) = 'service_role'::text))
  );

DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
CREATE POLICY "Admins can view all roles"
  ON user_roles FOR SELECT
  USING (
    (has_role(( SELECT auth.uid() AS uid), 'admin'::text) OR is_dev_admin(( SELECT auth.uid() AS uid)) OR (((select auth.jwt()) ->> 'role'::text) = 'service_role'::text))
  );

-- ============================================================================
-- End of Phase 10 Migration
-- ============================================================================
--
-- Verification: Confirm no unoptimized auth.jwt() calls remain
--
-- SELECT COUNT(*) as remaining_jwt_unoptimized
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND (qual LIKE '%auth.jwt()%' OR with_check LIKE '%auth.jwt()%')
--   AND (qual NOT LIKE '%SELECT%auth.jwt()%' AND COALESCE(with_check, '') NOT LIKE '%SELECT%auth.jwt()%');
--
-- Expected result: 0
-- ============================================================================

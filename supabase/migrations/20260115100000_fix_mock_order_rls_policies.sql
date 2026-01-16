-- ============================================================================
-- Migration: Fix RLS policies for mock order import
-- ============================================================================
--
-- Problem: Mock order import fails with RLS errors when:
-- 1. Creating test profiles (profiles table has no INSERT policy)
-- 2. Creating guests as authenticated user (guests INSERT policy only targets 'anon')
--
-- Solution:
-- 1. Add INSERT policy for profiles table (admins/developers only)
-- 2. Recreate guests admin policy to ensure INSERT is covered
-- ============================================================================

-- ============================================================================
-- FIX 1: Add INSERT policy for profiles table
-- ============================================================================
-- Test profiles are created directly by MockOrderService for mock data generation.
-- Normal user profiles are created via handle_new_user() trigger which uses
-- SECURITY DEFINER and bypasses RLS. This policy only allows admins/developers
-- to create profiles directly (e.g., for test data).

DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  );

COMMENT ON POLICY "Admins can insert profiles" ON profiles IS
  'Allows admins and developers to create profiles directly (used for test data generation).';

-- ============================================================================
-- FIX 2: Recreate guests admin policy to ensure INSERT works
-- ============================================================================
-- The existing "Admins can manage all guests" policy uses FOR ALL which
-- should cover INSERT, but we recreate it to ensure proper WITH CHECK clause.

DROP POLICY IF EXISTS "Admins can manage all guests" ON guests;

CREATE POLICY "Admins can manage all guests"
  ON guests FOR ALL
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

COMMENT ON POLICY "Admins can manage all guests" ON guests IS
  'Allows admins and developers to perform all operations on guests.';

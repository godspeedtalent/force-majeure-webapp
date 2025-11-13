-- Migration: Fix environments RLS policy for anonymous users
-- Created: 2025-11-11
-- Description: Simplify admin policy to handle NULL auth.uid() properly

-- Drop existing admin policy
DROP POLICY IF EXISTS "Admins can manage environments" ON public.environments;

-- Recreate with NULL-safe check
CREATE POLICY "Admins can manage environments"
  ON public.environments FOR ALL
  USING (
    auth.uid() IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Migration: Fix is_dev_admin function to work with new environments table
-- Created: 2025-11-11
-- Description: Updates is_dev_admin function to use environment_id instead of environment column

CREATE OR REPLACE FUNCTION is_dev_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT ff.is_enabled
     FROM feature_flags ff
     JOIN environments e ON ff.environment_id = e.id
     WHERE ff.flag_name = 'dev_admin_access'
       AND (e.name = 'dev' OR e.name = 'all')
     LIMIT 1),
    false
  )
$$;

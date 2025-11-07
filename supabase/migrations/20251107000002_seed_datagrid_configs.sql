-- ========================================
-- Seed Default Data Grid Configurations
-- ========================================
-- This script creates default datagrid_config records for common grids
-- Replace 'YOUR_USER_UUID_HERE' with your actual user UUID

-- Note: Get your user UUID by running:
-- SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

DO $$
DECLARE
  target_user_id UUID := 'YOUR_USER_UUID_HERE'; -- Replace with your actual user UUID
BEGIN
  
  -- Admin Users Grid Configuration
  INSERT INTO public.datagrid_configs (user_id, grid_id, config)
  VALUES (
    target_user_id,
    'admin-users',
    jsonb_build_object(
      'columns', jsonb_build_array(
        jsonb_build_object('key', 'display_name', 'visible', true, 'order', 0),
        jsonb_build_object('key', 'full_name', 'visible', true, 'order', 1),
        jsonb_build_object('key', 'email', 'visible', true, 'order', 2),
        jsonb_build_object('key', 'avatar_url', 'visible', true, 'order', 3),
        jsonb_build_object('key', 'roles', 'visible', true, 'order', 4),
        jsonb_build_object('key', 'created_at', 'visible', true, 'order', 5)
      )
    )
  )
  ON CONFLICT (user_id, grid_id) DO UPDATE
  SET config = EXCLUDED.config,
      updated_at = NOW();

  -- Developer Artists Grid Configuration
  INSERT INTO public.datagrid_configs (user_id, grid_id, config)
  VALUES (
    target_user_id,
    'dev-artists',
    jsonb_build_object(
      'columns', jsonb_build_array(
        jsonb_build_object('key', 'image_url', 'visible', true, 'order', 0),
        jsonb_build_object('key', 'name', 'visible', true, 'order', 1),
        jsonb_build_object('key', 'bio', 'visible', true, 'order', 2),
        jsonb_build_object('key', 'website', 'visible', true, 'order', 3),
        jsonb_build_object('key', 'created_at', 'visible', true, 'order', 4)
      )
    )
  )
  ON CONFLICT (user_id, grid_id) DO UPDATE
  SET config = EXCLUDED.config,
      updated_at = NOW();

  -- Developer Venues Grid Configuration
  INSERT INTO public.datagrid_configs (user_id, grid_id, config)
  VALUES (
    target_user_id,
    'dev-venues',
    jsonb_build_object(
      'columns', jsonb_build_array(
        jsonb_build_object('key', 'image_url', 'visible', true, 'order', 0),
        jsonb_build_object('key', 'name', 'visible', true, 'order', 1),
        jsonb_build_object('key', 'address', 'visible', true, 'order', 2),
        jsonb_build_object('key', 'city', 'visible', true, 'order', 3),
        jsonb_build_object('key', 'state', 'visible', true, 'order', 4),
        jsonb_build_object('key', 'capacity', 'visible', true, 'order', 5),
        jsonb_build_object('key', 'created_at', 'visible', true, 'order', 6)
      )
    )
  )
  ON CONFLICT (user_id, grid_id) DO UPDATE
  SET config = EXCLUDED.config,
      updated_at = NOW();

  RAISE NOTICE 'Successfully created/updated datagrid configs for user: %', target_user_id;
  
END $$;

-- Query to verify the created records:
-- SELECT grid_id, config FROM public.datagrid_configs WHERE user_id = 'YOUR_USER_UUID_HERE';

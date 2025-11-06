-- ========================================
-- Add All Required Roles to app_role enum
-- ========================================
-- This script adds: developer, org_staff, org_admin
-- (admin and user should already exist)

DO $$ 
BEGIN
  -- Add developer role
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'developer' AND enumtypid = 'app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'developer';
    RAISE NOTICE 'Added developer role';
  ELSE
    RAISE NOTICE 'developer role already exists';
  END IF;
  
  -- Add org_staff role
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'org_staff' AND enumtypid = 'app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'org_staff';
    RAISE NOTICE 'Added org_staff role';
  ELSE
    RAISE NOTICE 'org_staff role already exists';
  END IF;
  
  -- Add org_admin role
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'org_admin' AND enumtypid = 'app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'org_admin';
    RAISE NOTICE 'Added org_admin role';
  ELSE
    RAISE NOTICE 'org_admin role already exists';
  END IF;
END $$;

-- Show all available roles
SELECT enumlabel as role_name
FROM pg_enum
WHERE enumtypid = 'app_role'::regtype
ORDER BY enumlabel;

-- Example: Assign yourself all roles for testing
-- REPLACE 'YOUR_USER_ID' with your actual user ID: e5f719c1-d1b5-4081-9d46-2cbe0f95509f

-- Uncomment and run these to assign roles:
/*
INSERT INTO public.user_roles (user_id, role) VALUES 
  ('e5f719c1-d1b5-4081-9d46-2cbe0f95509f', 'admin'),
  ('e5f719c1-d1b5-4081-9d46-2cbe0f95509f', 'developer')
ON CONFLICT (user_id, role) DO NOTHING;
*/

-- Verify roles were added
SELECT * FROM public.user_roles ORDER BY created_at DESC;

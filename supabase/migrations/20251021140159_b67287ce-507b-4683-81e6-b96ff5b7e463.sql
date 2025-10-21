-- Add 'developer' role to app_role enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'developer' AND enumtypid = 'app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'developer';
  END IF;
END $$;

-- Insert demo_pages feature flag (without ON CONFLICT since there's no unique constraint)
INSERT INTO public.feature_flags (flag_name, is_enabled, environment, description)
VALUES (
  'demo_pages',
  true,
  'dev',
  'Enable access to demo/testing pages for developers'
);
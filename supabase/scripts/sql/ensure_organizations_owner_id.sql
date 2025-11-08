-- ========================================
-- Ensure organizations table has owner_id column
-- ========================================
-- Run this in Supabase SQL Editor

-- Add owner_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'organizations'
    AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE public.organizations
    ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

    -- Make it NOT NULL after adding (for new rows)
    -- Existing rows would need to be updated first
    -- ALTER TABLE public.organizations ALTER COLUMN owner_id SET NOT NULL;

    RAISE NOTICE 'Added owner_id column to organizations table';
  ELSE
    RAISE NOTICE 'owner_id column already exists in organizations table';
  END IF;
END $$;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS organizations_owner_id_idx ON public.organizations(owner_id);

-- Verify the column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'organizations'
ORDER BY ordinal_position;

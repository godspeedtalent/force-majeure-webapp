-- ========================================
-- Ensure organizations table exists with correct schema
-- ========================================
-- Run this in Supabase SQL Editor

-- Create organizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    profile_picture TEXT,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

    -- Constraints
    CONSTRAINT organizations_name_not_empty CHECK (char_length(trim(name)) > 0)
);

-- Add missing columns if table exists but columns are missing
DO $$
BEGIN
  -- Add name column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'organizations'
    AND column_name = 'name'
  ) THEN
    ALTER TABLE public.organizations ADD COLUMN name TEXT NOT NULL DEFAULT 'Unnamed Organization';
    ALTER TABLE public.organizations ALTER COLUMN name DROP DEFAULT;
    RAISE NOTICE 'Added name column to organizations table';
  END IF;

  -- Add profile_picture column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'organizations'
    AND column_name = 'profile_picture'
  ) THEN
    ALTER TABLE public.organizations ADD COLUMN profile_picture TEXT;
    RAISE NOTICE 'Added profile_picture column to organizations table';
  END IF;

  -- Add owner_id column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'organizations'
    AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE public.organizations ADD COLUMN owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added owner_id column to organizations table';
  END IF;

  -- Add created_at column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'organizations'
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.organizations ADD COLUMN created_at TIMESTAMPTZ DEFAULT now() NOT NULL;
    RAISE NOTICE 'Added created_at column to organizations table';
  END IF;

  -- Add updated_at column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'organizations'
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.organizations ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now() NOT NULL;
    RAISE NOTICE 'Added updated_at column to organizations table';
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS organizations_owner_id_idx ON public.organizations(owner_id);
CREATE INDEX IF NOT EXISTS organizations_name_idx ON public.organizations(name);

-- Add organization_id to profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS profiles_organization_id_idx ON public.profiles(organization_id);
    RAISE NOTICE 'Added organization_id column to profiles table';
  END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view organizations they own" ON public.organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Organization owners can update their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Organization owners can delete their organizations" ON public.organizations;

-- RLS Policies for organizations
-- View: Users can view their own organizations
CREATE POLICY "Users can view organizations they own"
    ON public.organizations
    FOR SELECT
    USING (
        auth.uid() = owner_id
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.organization_id = organizations.id
        )
    );

-- Insert: Authenticated users can create organizations
CREATE POLICY "Authenticated users can create organizations"
    ON public.organizations
    FOR INSERT
    WITH CHECK (
        auth.uid() = owner_id
    );

-- Update: Only organization owner can update
CREATE POLICY "Organization owners can update their organizations"
    ON public.organizations
    FOR UPDATE
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- Delete: Only organization owner can delete
CREATE POLICY "Organization owners can delete their organizations"
    ON public.organizations
    FOR DELETE
    USING (auth.uid() = owner_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_organizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS organizations_updated_at ON public.organizations;

-- Create trigger for updated_at
CREATE TRIGGER organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_organizations_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT SELECT ON public.organizations TO anon;

-- Verify the table structure
SELECT
    'Organizations table schema:' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'organizations'
ORDER BY ordinal_position;

-- Show existing organizations
SELECT 'Existing organizations:' as info;
SELECT * FROM public.organizations LIMIT 5;

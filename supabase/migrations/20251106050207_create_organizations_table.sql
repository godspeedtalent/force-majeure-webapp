-- Create organizations table
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

-- Create indexes
CREATE INDEX organizations_owner_id_idx ON public.organizations(owner_id);
CREATE INDEX organizations_name_idx ON public.organizations(name);

-- Add organization_id to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS profiles_organization_id_idx ON public.profiles(organization_id);

-- Add organization_id to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS events_organization_id_idx ON public.events(organization_id);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations

-- View: Users can view their own organizations and public organizations
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

-- Create trigger for updated_at
CREATE TRIGGER organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_organizations_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT SELECT ON public.organizations TO anon;

-- Add comments for documentation
COMMENT ON TABLE public.organizations IS 'Organizations that users can belong to';
COMMENT ON COLUMN public.organizations.id IS 'Unique identifier for the organization';
COMMENT ON COLUMN public.organizations.name IS 'Name of the organization';
COMMENT ON COLUMN public.organizations.profile_picture IS 'URL to the organization profile picture';
COMMENT ON COLUMN public.organizations.owner_id IS 'User ID of the organization owner';
COMMENT ON COLUMN public.organizations.created_at IS 'Timestamp when the organization was created';
COMMENT ON COLUMN public.organizations.updated_at IS 'Timestamp when the organization was last updated';

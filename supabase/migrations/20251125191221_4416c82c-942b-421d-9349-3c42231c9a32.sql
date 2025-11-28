-- Fix current user's profile to link to their organization
UPDATE profiles 
SET organization_id = '38e383b6-ddc1-4c7b-8a6c-a402c611ed13'
WHERE user_id = '52fc64d8-0c2d-4a83-a9df-c6d16634d38c';

-- Create trigger function to automatically link organization owners to their org
CREATE OR REPLACE FUNCTION public.update_owner_organization_id()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles 
  SET organization_id = NEW.id 
  WHERE user_id = NEW.owner_id 
  AND organization_id IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if it exists (idempotent)
DROP TRIGGER IF EXISTS on_organization_created ON organizations;

-- Create trigger to fire after organization creation
CREATE TRIGGER on_organization_created
  AFTER INSERT ON organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_owner_organization_id();
-- Add event image storage support
-- This migration creates a Supabase Storage bucket for event images
-- and sets up RLS policies for secure upload/access

-- Create storage bucket for event images if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-images',
  'event-images',
  true, -- Public bucket so images can be accessed without auth
  5242880, -- 5MB limit per file
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the storage.objects table for this bucket
-- Note: storage.objects already has RLS enabled by default

-- Policy: Anyone can view event images (public bucket)
CREATE POLICY "Anyone can view event images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'event-images');

-- Policy: Authenticated users with admin or developer roles can upload event images
CREATE POLICY "Admins and developers can upload event images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-images' AND
  (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'developer')
    ) OR
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  )
);

-- Policy: Admins and developers can update event images
CREATE POLICY "Admins and developers can update event images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-images' AND
  (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'developer')
    ) OR
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  )
);

-- Policy: Admins and developers can delete event images
CREATE POLICY "Admins and developers can delete event images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-images' AND
  (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'developer')
    ) OR
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  )
);

-- Add helper function to generate public URL for event images
CREATE OR REPLACE FUNCTION public.get_event_image_url(file_path text)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_base_url text;
BEGIN
  -- Get Supabase project URL (you may need to adjust this based on your setup)
  -- This returns the full public URL for the file
  SELECT 
    current_setting('app.settings.supabase_url', true) || '/storage/v1/object/public/event-images/' || file_path
  INTO v_base_url;
  
  RETURN v_base_url;
END;
$$;

-- Create an event_images table to track uploaded images and their metadata
CREATE TABLE IF NOT EXISTS public.event_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL UNIQUE, -- Path in storage bucket
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL, -- Size in bytes
  mime_type TEXT NOT NULL,
  width INTEGER, -- Image dimensions (optional)
  height INTEGER,
  is_primary BOOLEAN DEFAULT false, -- Primary/hero image for the event
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_images_event_id ON public.event_images(event_id);
CREATE INDEX IF NOT EXISTS idx_event_images_is_primary ON public.event_images(event_id, is_primary);

-- Add RLS policies for event_images table
ALTER TABLE public.event_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view event images metadata"
ON public.event_images
FOR SELECT
USING (true);

CREATE POLICY "Admins and developers can insert event images"
ON public.event_images
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'developer')
  ) OR
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

CREATE POLICY "Admins and developers can update event images"
ON public.event_images
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'developer')
  ) OR
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

CREATE POLICY "Admins and developers can delete event images"
ON public.event_images
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'developer')
  ) OR
  EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Create updated_at trigger for event_images
CREATE TRIGGER update_event_images_updated_at
BEFORE UPDATE ON public.event_images
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.event_images IS 'Tracks uploaded event images stored in Supabase Storage';
COMMENT ON COLUMN public.event_images.storage_path IS 'Path to file in storage bucket (e.g., "events/123/hero.jpg")';
COMMENT ON COLUMN public.event_images.is_primary IS 'Whether this is the primary/hero image for the event';

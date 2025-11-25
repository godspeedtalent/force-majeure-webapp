-- Create feature flag for guest list functionality
-- Insert the flag for dev, staging, and production environments (disabled by default)

INSERT INTO feature_flags (environment_id, flag_name, is_enabled, description)
SELECT 
  e.id,
  'guest_list',
  false,
  'Enable guest list functionality on event pages'
FROM environments e
WHERE e.name IN ('dev', 'staging', 'production')
ON CONFLICT (environment_id, flag_name) DO NOTHING;

-- Create table for per-event guest list settings
CREATE TABLE IF NOT EXISTS public.guest_list_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  min_interested_guests INTEGER NOT NULL DEFAULT 0,
  min_private_guests INTEGER NOT NULL DEFAULT 0,
  min_public_guests INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id)
);

-- Enable RLS
ALTER TABLE public.guest_list_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for guest_list_settings

-- Public can view guest list settings for published events
CREATE POLICY "Guest list settings are publicly viewable for published events"
ON public.guest_list_settings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = guest_list_settings.event_id
    AND events.status = 'published'
  )
);

-- Admins and developers can manage all guest list settings
CREATE POLICY "Admins and developers can manage guest list settings"
ON public.guest_list_settings
FOR ALL
USING (
  (auth.uid() IS NOT NULL) AND (
    has_role(auth.uid(), 'admin'::text) OR 
    has_role(auth.uid(), 'developer'::text) OR 
    is_dev_admin(auth.uid())
  )
);

-- Org members with manage_events can manage their org's guest list settings
CREATE POLICY "Org members can manage their org's guest list settings"
ON public.guest_list_settings
FOR ALL
USING (
  (auth.uid() IS NOT NULL) AND 
  has_permission(auth.uid(), 'manage_events'::text) AND
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.profiles p ON p.organization_id = e.organization_id
    WHERE e.id = guest_list_settings.event_id
    AND p.user_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_guest_list_settings_updated_at
BEFORE UPDATE ON public.guest_list_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
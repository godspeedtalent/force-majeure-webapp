-- Create tracking_links table (idempotent)
CREATE TABLE IF NOT EXISTS public.tracking_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  utm_source TEXT NOT NULL,
  utm_medium TEXT NOT NULL,
  utm_campaign TEXT NOT NULL,
  utm_content TEXT,
  utm_term TEXT,
  custom_destination_url TEXT,
  expires_at TIMESTAMPTZ,
  max_clicks INTEGER,
  click_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create link_clicks table (idempotent)
CREATE TABLE IF NOT EXISTS public.link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID NOT NULL REFERENCES public.tracking_links(id) ON DELETE CASCADE,
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  device_info JSONB,
  country TEXT,
  city TEXT,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance (idempotent)
CREATE INDEX IF NOT EXISTS idx_tracking_links_event_id ON public.tracking_links(event_id);
CREATE INDEX IF NOT EXISTS idx_tracking_links_code ON public.tracking_links(code);
CREATE INDEX IF NOT EXISTS idx_link_clicks_link_id ON public.link_clicks(link_id);
CREATE INDEX IF NOT EXISTS idx_link_clicks_clicked_at ON public.link_clicks(clicked_at);

-- Enable RLS
ALTER TABLE public.tracking_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_clicks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Admins and devs can manage tracking links" ON public.tracking_links;
DROP POLICY IF EXISTS "Org members with manage_events can manage tracking links" ON public.tracking_links;
DROP POLICY IF EXISTS "Tracking links are publicly viewable" ON public.tracking_links;
DROP POLICY IF EXISTS "Anyone can insert link clicks" ON public.link_clicks;
DROP POLICY IF EXISTS "Admins and devs can view link clicks" ON public.link_clicks;
DROP POLICY IF EXISTS "Org members with manage_events can view link clicks" ON public.link_clicks;

-- RLS Policies for tracking_links
CREATE POLICY "Admins and devs can manage tracking links"
ON public.tracking_links
FOR ALL
USING (
  auth.uid() IS NOT NULL AND (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  )
);

CREATE POLICY "Org members with manage_events can manage tracking links"
ON public.tracking_links
FOR ALL
USING (
  auth.uid() IS NOT NULL AND
  has_permission(auth.uid(), 'manage_events') AND
  EXISTS (
    SELECT 1 FROM events e
    JOIN profiles p ON p.organization_id = e.organization_id
    WHERE e.id = tracking_links.event_id
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Tracking links are publicly viewable"
ON public.tracking_links
FOR SELECT
USING (true);

-- RLS Policies for link_clicks
CREATE POLICY "Anyone can insert link clicks"
ON public.link_clicks
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins and devs can view link clicks"
ON public.link_clicks
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'developer') OR
    is_dev_admin(auth.uid())
  )
);

CREATE POLICY "Org members with manage_events can view link clicks"
ON public.link_clicks
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  has_permission(auth.uid(), 'manage_events') AND
  EXISTS (
    SELECT 1 FROM tracking_links tl
    JOIN events e ON e.id = tl.event_id
    JOIN profiles p ON p.organization_id = e.organization_id
    WHERE tl.id = link_clicks.link_id
    AND p.user_id = auth.uid()
  )
);

-- Create trigger to update updated_at (idempotent)
DROP TRIGGER IF EXISTS update_tracking_links_updated_at ON public.tracking_links;
CREATE TRIGGER update_tracking_links_updated_at
BEFORE UPDATE ON public.tracking_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

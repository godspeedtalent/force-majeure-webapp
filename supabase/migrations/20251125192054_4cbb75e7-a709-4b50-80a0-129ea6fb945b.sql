-- Create ticket_groups table (idempotent)
CREATE TABLE IF NOT EXISTS public.ticket_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text NOT NULL DEFAULT 'border-gray-500',
  group_order integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  fee_flat_cents integer NOT NULL DEFAULT 0,
  fee_pct_bps integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add group_id to ticket_tiers (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'ticket_tiers'
    AND column_name = 'group_id'
  ) THEN
    ALTER TABLE public.ticket_tiers
    ADD COLUMN group_id uuid REFERENCES public.ticket_groups(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS on ticket_groups
ALTER TABLE public.ticket_groups ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Ticket groups are publicly viewable" ON public.ticket_groups;
DROP POLICY IF EXISTS "Admins and devs can insert ticket groups" ON public.ticket_groups;
DROP POLICY IF EXISTS "Admins and devs can update ticket groups" ON public.ticket_groups;
DROP POLICY IF EXISTS "Admins and devs can delete ticket groups" ON public.ticket_groups;
DROP POLICY IF EXISTS "Org members with manage_events can insert ticket groups" ON public.ticket_groups;
DROP POLICY IF EXISTS "Org members with manage_events can update ticket groups" ON public.ticket_groups;
DROP POLICY IF EXISTS "Org members with manage_events can delete ticket groups" ON public.ticket_groups;

-- RLS policies for ticket_groups
CREATE POLICY "Ticket groups are publicly viewable"
  ON public.ticket_groups FOR SELECT
  USING (true);

CREATE POLICY "Admins and devs can insert ticket groups"
  ON public.ticket_groups FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'developer') OR
      is_dev_admin(auth.uid())
    )
  );

CREATE POLICY "Admins and devs can update ticket groups"
  ON public.ticket_groups FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'developer') OR
      is_dev_admin(auth.uid())
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'developer') OR
      is_dev_admin(auth.uid())
    )
  );

CREATE POLICY "Admins and devs can delete ticket groups"
  ON public.ticket_groups FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND (
      has_role(auth.uid(), 'admin') OR
      has_role(auth.uid(), 'developer') OR
      is_dev_admin(auth.uid())
    )
  );

CREATE POLICY "Org members with manage_events can insert ticket groups"
  ON public.ticket_groups FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    has_permission(auth.uid(), 'manage_events') AND
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.profiles p ON p.organization_id = e.organization_id
      WHERE e.id = ticket_groups.event_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Org members with manage_events can update ticket groups"
  ON public.ticket_groups FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    has_permission(auth.uid(), 'manage_events') AND
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.profiles p ON p.organization_id = e.organization_id
      WHERE e.id = ticket_groups.event_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    has_permission(auth.uid(), 'manage_events') AND
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.profiles p ON p.organization_id = e.organization_id
      WHERE e.id = ticket_groups.event_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Org members with manage_events can delete ticket groups"
  ON public.ticket_groups FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND
    has_permission(auth.uid(), 'manage_events') AND
    EXISTS (
      SELECT 1 FROM public.events e
      JOIN public.profiles p ON p.organization_id = e.organization_id
      WHERE e.id = ticket_groups.event_id AND p.user_id = auth.uid()
    )
  );

-- Add trigger for updated_at on ticket_groups (idempotent)
DROP TRIGGER IF EXISTS update_ticket_groups_updated_at ON public.ticket_groups;
CREATE TRIGGER update_ticket_groups_updated_at
  BEFORE UPDATE ON public.ticket_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
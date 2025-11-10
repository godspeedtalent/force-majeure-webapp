-- Create table for tracking event page views
CREATE TABLE IF NOT EXISTS public.event_views (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    viewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    viewed_at timestamp with time zone DEFAULT now() NOT NULL,
    session_id text,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_event_views_event_id ON public.event_views(event_id);
CREATE INDEX IF NOT EXISTS idx_event_views_viewed_at ON public.event_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_views_viewer_id ON public.event_views(viewer_id);

-- Create function to get event view count
CREATE OR REPLACE FUNCTION public.get_event_view_count(p_event_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
AS $$
    SELECT COUNT(*)
    FROM public.event_views
    WHERE event_id = p_event_id;
$$;

-- Create function to record event view
CREATE OR REPLACE FUNCTION public.record_event_view(
    p_event_id uuid,
    p_session_id text DEFAULT NULL,
    p_ip_address inet DEFAULT NULL,
    p_user_agent text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_view_id uuid;
    v_user_id uuid;
BEGIN
    -- Get current user ID if authenticated
    v_user_id := auth.uid();
    
    -- Insert view record
    INSERT INTO public.event_views (
        event_id,
        viewer_id,
        session_id,
        ip_address,
        user_agent
    )
    VALUES (
        p_event_id,
        v_user_id,
        p_session_id,
        p_ip_address,
        p_user_agent
    )
    RETURNING id INTO v_view_id;
    
    RETURN v_view_id;
END;
$$;

-- Enable RLS
ALTER TABLE public.event_views ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can record a view
CREATE POLICY "Anyone can record event views"
    ON public.event_views
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Policy: Anyone can read view counts (needed for public display)
CREATE POLICY "Anyone can read event views"
    ON public.event_views
    FOR SELECT
    TO public
    USING (true);

-- Policy: Only admins can delete views
CREATE POLICY "Only admins can delete event views"
    ON public.event_views
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Grant necessary permissions
GRANT SELECT ON public.event_views TO anon, authenticated;
GRANT INSERT ON public.event_views TO anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_event_view_count(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_event_view(uuid, text, inet, text) TO anon, authenticated;

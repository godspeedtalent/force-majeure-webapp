-- Create artist_registrations table
CREATE TABLE IF NOT EXISTS public.artist_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_name TEXT NOT NULL,
  genre TEXT NOT NULL,
  bio TEXT NOT NULL,
  soundcloud_url TEXT,
  spotify_url TEXT,
  instagram_handle TEXT,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  previous_venues TEXT,
  set_length TEXT,
  equipment TEXT,
  availability TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_artist_registrations_user_id ON public.artist_registrations(user_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_artist_registrations_status ON public.artist_registrations(status);

-- Create index on submitted_at for sorting
CREATE INDEX IF NOT EXISTS idx_artist_registrations_submitted_at ON public.artist_registrations(submitted_at DESC);

-- Enable RLS
ALTER TABLE public.artist_registrations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own registrations
CREATE POLICY "Users can view their own artist registrations"
  ON public.artist_registrations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can create their own registrations
CREATE POLICY "Users can create artist registrations"
  ON public.artist_registrations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all registrations
CREATE POLICY "Admins can view all artist registrations"
  ON public.artist_registrations
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Policy: Admins can update registrations (for review/approval)
CREATE POLICY "Admins can update artist registrations"
  ON public.artist_registrations
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_artist_registrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_artist_registrations_updated_at
  BEFORE UPDATE ON public.artist_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_artist_registrations_updated_at();

-- Grant permissions
GRANT SELECT, INSERT ON public.artist_registrations TO authenticated;
GRANT ALL ON public.artist_registrations TO service_role;

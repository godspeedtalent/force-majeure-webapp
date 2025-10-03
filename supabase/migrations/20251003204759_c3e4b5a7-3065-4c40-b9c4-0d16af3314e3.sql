-- Create enum for reward types
CREATE TYPE public.reward_type AS ENUM ('free_ticket', 'promo_code_20');

-- Create scavenger_locations table
CREATE TABLE public.scavenger_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_name TEXT NOT NULL,
  location_description TEXT,
  reward_type public.reward_type NOT NULL,
  promo_code TEXT,
  total_tokens INTEGER NOT NULL DEFAULT 5,
  tokens_remaining INTEGER NOT NULL DEFAULT 5,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scavenger_tokens table
CREATE TABLE public.scavenger_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID NOT NULL REFERENCES public.scavenger_locations(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  token_salt TEXT NOT NULL,
  is_claimed BOOLEAN NOT NULL DEFAULT false,
  claimed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scavenger_claims table
CREATE TABLE public.scavenger_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.scavenger_locations(id) ON DELETE CASCADE,
  token_id UUID NOT NULL REFERENCES public.scavenger_tokens(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL,
  promo_code TEXT,
  claim_position INTEGER NOT NULL,
  show_on_leaderboard BOOLEAN NOT NULL DEFAULT false,
  claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, location_id)
);

-- Create feature_flags table
CREATE TABLE public.feature_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flag_name TEXT NOT NULL UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scavenger_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scavenger_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scavenger_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scavenger_locations (public read)
CREATE POLICY "Locations are publicly viewable"
  ON public.scavenger_locations
  FOR SELECT
  USING (is_active = true);

-- RLS Policies for scavenger_tokens (no direct access)
CREATE POLICY "No direct token access"
  ON public.scavenger_tokens
  FOR SELECT
  USING (false);

-- RLS Policies for scavenger_claims (users can view their own + leaderboard entries)
CREATE POLICY "Users can view their own claims"
  ON public.scavenger_claims
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view leaderboard entries"
  ON public.scavenger_claims
  FOR SELECT
  USING (show_on_leaderboard = true);

-- RLS Policies for feature_flags (public read)
CREATE POLICY "Feature flags are publicly viewable"
  ON public.feature_flags
  FOR SELECT
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_scavenger_locations_updated_at
  BEFORE UPDATE ON public.scavenger_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_scavenger_tokens_updated_at
  BEFORE UPDATE ON public.scavenger_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default feature flags
INSERT INTO public.feature_flags (flag_name, is_enabled, description) VALUES
  ('scavenger_hunt_active', false, 'Enable/disable the LF System scavenger hunt'),
  ('coming_soon_mode', true, 'Show coming soon page to unauthenticated users'),
  ('show_leaderboard', true, 'Show/hide leaderboard to users');

-- Create index for performance
CREATE INDEX idx_scavenger_tokens_token_hash ON public.scavenger_tokens(token_hash);
CREATE INDEX idx_scavenger_claims_user_location ON public.scavenger_claims(user_id, location_id);
CREATE INDEX idx_scavenger_claims_leaderboard ON public.scavenger_claims(show_on_leaderboard, claimed_at) WHERE show_on_leaderboard = true;
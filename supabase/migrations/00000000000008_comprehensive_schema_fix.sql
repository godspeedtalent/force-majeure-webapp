-- ==========================================
-- COMPREHENSIVE SCHEMA FIX
-- Addresses RLS policies, missing data, and table structure
-- ==========================================

-- ==========================================
-- PART 1: Ensure environments table has data
-- ==========================================

-- Check if environments table is empty and populate with defaults
INSERT INTO public.environments (name, display_name, description)
SELECT 'dev', 'Development', 'Development environment'
WHERE NOT EXISTS (SELECT 1 FROM public.environments WHERE name = 'dev');

INSERT INTO public.environments (name, display_name, description)
SELECT 'qa', 'QA/Staging', 'QA and staging environment'
WHERE NOT EXISTS (SELECT 1 FROM public.environments WHERE name = 'qa');

INSERT INTO public.environments (name, display_name, description)
SELECT 'prod', 'Production', 'Production environment'
WHERE NOT EXISTS (SELECT 1 FROM public.environments WHERE name = 'prod');

INSERT INTO public.environments (name, display_name, description)
SELECT 'all', 'All Environments', 'Applies to all environments'
WHERE NOT EXISTS (SELECT 1 FROM public.environments WHERE name = 'all');

-- ==========================================
-- PART 2: Fix feature_flags to ensure they have environment_id
-- ==========================================

-- Update any feature_flags that might not have environment_id set
UPDATE public.feature_flags
SET environment_id = (SELECT id FROM public.environments WHERE name = 'all' LIMIT 1)
WHERE environment_id IS NULL;

-- ==========================================
-- PART 3: Verify and fix foreign key constraints
-- ==========================================

-- Ensure events.headliner_id foreign key exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'events_headliner_id_fkey' 
    AND table_name = 'events'
  ) THEN
    ALTER TABLE public.events
    ADD CONSTRAINT events_headliner_id_fkey
    FOREIGN KEY (headliner_id)
    REFERENCES public.artists(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- ==========================================
-- PART 4: Fix all RLS policies to handle anonymous users
-- ==========================================

-- PROFILES TABLE
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- EVENTS TABLE
DROP POLICY IF EXISTS "Events are publicly viewable" ON public.events;
DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;

CREATE POLICY "Events are publicly viewable"
  ON public.events FOR SELECT
  USING (true);

-- ARTISTS TABLE
DROP POLICY IF EXISTS "Artists are publicly viewable" ON public.artists;
DROP POLICY IF EXISTS "Artists are viewable by everyone" ON public.artists;

CREATE POLICY "Artists are publicly viewable"
  ON public.artists FOR SELECT
  USING (true);

-- VENUES TABLE
DROP POLICY IF EXISTS "Venues are publicly viewable" ON public.venues;
DROP POLICY IF EXISTS "Venues are viewable by everyone" ON public.venues;

CREATE POLICY "Venues are publicly viewable"
  ON public.venues FOR SELECT
  USING (true);

-- TICKET_TIERS TABLE
DROP POLICY IF EXISTS "Ticket tiers are publicly viewable" ON public.ticket_tiers;
DROP POLICY IF EXISTS "Ticket tiers are viewable by everyone" ON public.ticket_tiers;

CREATE POLICY "Ticket tiers are publicly viewable"
  ON public.ticket_tiers FOR SELECT
  USING (true);

-- FEATURE_FLAGS TABLE
DROP POLICY IF EXISTS "Anyone can view feature flags" ON public.feature_flags;
DROP POLICY IF EXISTS "Feature flags are viewable by everyone" ON public.feature_flags;

CREATE POLICY "Anyone can view feature flags"
  ON public.feature_flags FOR SELECT
  USING (true);

-- ENVIRONMENTS TABLE
DROP POLICY IF EXISTS "Anyone can view environments" ON public.environments;
DROP POLICY IF EXISTS "Environments are viewable by everyone" ON public.environments;

CREATE POLICY "Anyone can view environments"
  ON public.environments FOR SELECT
  USING (true);

-- GENRES TABLE
DROP POLICY IF EXISTS "Anyone can view genres" ON public.genres;
DROP POLICY IF EXISTS "Genres are viewable by everyone" ON public.genres;

CREATE POLICY "Anyone can view genres"
  ON public.genres FOR SELECT
  USING (true);

-- ARTIST_GENRES TABLE
DROP POLICY IF EXISTS "Anyone can view artist genres" ON public.artist_genres;
DROP POLICY IF EXISTS "Artist genres are viewable by everyone" ON public.artist_genres;

CREATE POLICY "Anyone can view artist genres"
  ON public.artist_genres FOR SELECT
  USING (true);

-- EVENT_ARTISTS TABLE
DROP POLICY IF EXISTS "Anyone can view event artists" ON public.event_artists;
DROP POLICY IF EXISTS "Event artists are viewable by everyone" ON public.event_artists;

CREATE POLICY "Anyone can view event artists"
  ON public.event_artists FOR SELECT
  USING (true);

-- CITIES TABLE
DROP POLICY IF EXISTS "Cities are publicly viewable" ON public.cities;
DROP POLICY IF EXISTS "Cities are viewable by everyone" ON public.cities;

CREATE POLICY "Cities are publicly viewable"
  ON public.cities FOR SELECT
  USING (true);

-- ROLES TABLE
DROP POLICY IF EXISTS "Anyone can view roles" ON public.roles;
DROP POLICY IF EXISTS "Roles are viewable by everyone" ON public.roles;

CREATE POLICY "Anyone can view roles"
  ON public.roles FOR SELECT
  USING (true);

-- USER_ROLES TABLE - Users can view their own roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- ORDERS TABLE
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;

CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- ORDER_ITEMS TABLE
DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;

CREATE POLICY "Users can view their own order items"
  ON public.order_items FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- TICKETS TABLE
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.tickets;

CREATE POLICY "Users can view their own tickets"
  ON public.tickets FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = tickets.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- TICKETING_FEES TABLE
DROP POLICY IF EXISTS "Ticketing fees are publicly viewable" ON public.ticketing_fees;
DROP POLICY IF EXISTS "Ticketing fees are viewable by everyone" ON public.ticketing_fees;

CREATE POLICY "Ticketing fees are publicly viewable"
  ON public.ticketing_fees FOR SELECT
  USING (true);

-- PROMO_CODES TABLE
DROP POLICY IF EXISTS "Promo codes are publicly viewable" ON public.promo_codes;
DROP POLICY IF EXISTS "Promo codes are viewable by everyone" ON public.promo_codes;

CREATE POLICY "Promo codes are publicly viewable"
  ON public.promo_codes FOR SELECT
  USING (true);

-- ==========================================
-- PART 5: Verify RLS is enabled on all tables
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticketing_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- PART 6: Add helpful indexes
-- ==========================================

-- Index for faster role lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Index for faster event queries
CREATE INDEX IF NOT EXISTS idx_events_start_time ON public.events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_headliner_id ON public.events(headliner_id);

-- Index for faster order lookups
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- Index for feature flags
CREATE INDEX IF NOT EXISTS idx_feature_flags_environment_id ON public.feature_flags(environment_id);
CREATE INDEX IF NOT EXISTS idx_feature_flags_flag_name ON public.feature_flags(flag_name);

-- ==========================================
-- VERIFICATION QUERIES (for testing)
-- ==========================================

-- Verify environments exist
DO $$
DECLARE
  env_count INT;
BEGIN
  SELECT COUNT(*) INTO env_count FROM public.environments;
  RAISE NOTICE 'Environments count: %', env_count;
END $$;

-- Verify RLS is enabled
DO $$
BEGIN
  RAISE NOTICE 'RLS enabled on events: %', (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'events');
  RAISE NOTICE 'RLS enabled on artists: %', (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'artists');
  RAISE NOTICE 'RLS enabled on feature_flags: %', (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'feature_flags');
END $$;

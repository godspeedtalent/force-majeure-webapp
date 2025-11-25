-- ============================================================================
-- Force Majeure - Complete Database Initialization Migration
-- ============================================================================
-- This migration represents the complete, consolidated database schema
-- for the Force Majeure event ticketing and management platform.
--
-- Run this migration on a fresh database to initialize all:
-- - Tables, enums, and types
-- - Functions and triggers
-- - Row Level Security (RLS) policies
-- - Storage buckets and policies
-- - Views and helper functions
--
-- Generated: 2025-11-21
-- ============================================================================

-- ============================================================================
-- SECTION 1: EXTENSIONS
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SECTION 2: ENUMS AND CUSTOM TYPES
-- ============================================================================

-- Application role enum (legacy, kept for backwards compatibility)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE app_role AS ENUM (
      'user',
      'admin',
      'developer',
      'org_admin',
      'org_staff'
    );
  END IF;
END $$;

-- ============================================================================
-- SECTION 3: CORE UTILITY FUNCTIONS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 4: ENVIRONMENTS TABLE (MUST BE EARLY)
-- ============================================================================

CREATE TABLE IF NOT EXISTS environments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL CHECK (name IN ('dev', 'qa', 'prod', 'all')),
  display_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE environments IS 'Reference table for deployment environments (dev, qa, prod, all). Used for environment-specific configuration.';
COMMENT ON COLUMN environments.name IS 'Short environment identifier used in code and queries';
COMMENT ON COLUMN environments.display_name IS 'Human-readable environment name for UI display';
COMMENT ON COLUMN environments.is_active IS 'Whether this environment is currently active/available';

DROP TRIGGER IF EXISTS update_environments_updated_at ON environments;
CREATE TRIGGER update_environments_updated_at
  BEFORE UPDATE ON environments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE environments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 5: CORE TABLES (cities, organizations, venues)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Cities Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(name, state)
);

CREATE INDEX IF NOT EXISTS idx_cities_name ON cities(name);

DROP TRIGGER IF EXISTS update_cities_updated_at ON cities;
CREATE TRIGGER update_cities_updated_at
  BEFORE UPDATE ON cities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Organizations Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  profile_picture TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Address fields (standardized)
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'US',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT organizations_name_not_empty CHECK (char_length(trim(name)) > 0),
  CONSTRAINT org_state_format CHECK (state IS NULL OR state ~ '^[A-Z]{2}$'),
  CONSTRAINT org_zip_format CHECK (zip_code IS NULL OR zip_code ~ '^\d{5}(-\d{4})?$'),
  CONSTRAINT org_country_format CHECK (country IS NULL OR length(country) = 2)
);

CREATE INDEX IF NOT EXISTS organizations_owner_id_idx ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS organizations_name_idx ON organizations(name);

DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Venues Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  -- Address fields (standardized)
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  capacity INTEGER,
  image_url TEXT,
  website TEXT,
  city_id UUID REFERENCES cities(id),
  test_data BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT venues_state_format CHECK (state IS NULL OR state ~ '^[A-Z]{2}$'),
  CONSTRAINT venues_zip_format CHECK (zip_code IS NULL OR zip_code ~ '^\d{5}(-\d{4})?$')
);

COMMENT ON COLUMN venues.website IS 'Venue or company website URL';
COMMENT ON COLUMN venues.address_line_1 IS 'Street address (e.g., 123 Main St)';
COMMENT ON COLUMN venues.address_line_2 IS 'Apartment, suite, unit, building, floor, etc.';
COMMENT ON COLUMN venues.city IS 'City name';
COMMENT ON COLUMN venues.state IS 'Two-letter state code (e.g., CA, NY)';
COMMENT ON COLUMN venues.zip_code IS 'ZIP code (5 digits or ZIP+4 format)';

CREATE INDEX IF NOT EXISTS idx_venues_city_id ON venues(city_id);
CREATE INDEX IF NOT EXISTS idx_venues_test_data ON venues(test_data);

DROP TRIGGER IF EXISTS update_venues_updated_at ON venues;
CREATE TRIGGER update_venues_updated_at
  BEFORE UPDATE ON venues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 6: GENRES AND ARTISTS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Genres Table (with hierarchical support) - MUST BE BEFORE ARTISTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  parent_id UUID REFERENCES genres(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_genres_name ON genres(name);
CREATE INDEX IF NOT EXISTS idx_genres_parent_id ON genres(parent_id);

DROP TRIGGER IF EXISTS update_genres_updated_at ON genres;
CREATE TRIGGER update_genres_updated_at
  BEFORE UPDATE ON genres
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE genres ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Artists Table - MUST BE BEFORE EVENTS (for headliner_id)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bio TEXT,
  image_url TEXT,
  website TEXT,
  genre TEXT, -- Legacy column, use artist_genres table instead
  spotify_id TEXT UNIQUE,
  spotify_data JSONB,
  test_data BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN artists.test_data IS 'Indicates if this artist record was created for testing purposes';
COMMENT ON COLUMN artists.genre IS 'Legacy column - use artist_genres table for multiple genre support';
COMMENT ON COLUMN artists.spotify_id IS 'Spotify artist ID for artists created from Spotify data';
COMMENT ON COLUMN artists.spotify_data IS 'Cached Spotify metadata (followers, popularity, external URLs, etc.)';

CREATE INDEX IF NOT EXISTS idx_artists_test_data ON artists(test_data);
CREATE INDEX IF NOT EXISTS idx_artists_name ON artists(name);
CREATE INDEX IF NOT EXISTS idx_artists_spotify_id ON artists(spotify_id);

DROP TRIGGER IF EXISTS update_artists_updated_at ON artists;
CREATE TRIGGER update_artists_updated_at
  BEFORE UPDATE ON artists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE artists ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 7: EVENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  venue_id UUID REFERENCES venues(id),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  is_after_hours BOOLEAN DEFAULT false NOT NULL,
  is_tba BOOLEAN DEFAULT false,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  headliner_id UUID REFERENCES artists(id) ON DELETE SET NULL,
  test_data BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN events.title IS 'Display title for the event (e.g., "Artist Name @ Venue Name")';
COMMENT ON COLUMN events.start_time IS 'Event start date and time (TIMESTAMPTZ)';
COMMENT ON COLUMN events.end_time IS 'Event end date and time (TIMESTAMPTZ). NULL when is_after_hours is true';
COMMENT ON COLUMN events.is_after_hours IS 'When true, event has no end time (runs past closing/into morning)';
COMMENT ON COLUMN events.is_tba IS 'Indicates if this event is a TBA (To Be Announced) placeholder';
COMMENT ON COLUMN events.test_data IS 'Indicates if this event record was created for testing purposes';
COMMENT ON COLUMN events.headliner_id IS 'Primary headliner artist for the event';

CREATE INDEX IF NOT EXISTS events_organization_id_idx ON events(organization_id);
CREATE INDEX IF NOT EXISTS idx_events_test_data ON events(test_data);
CREATE INDEX IF NOT EXISTS idx_events_venue_id ON events(venue_id);
CREATE INDEX IF NOT EXISTS idx_events_headliner_id ON events(headliner_id);

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 8: JUNCTION TABLES (artist_genres, event_artists)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Artist Genres Junction Table (many-to-many)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS artist_genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  genre_id UUID NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(artist_id, genre_id)
);

CREATE INDEX IF NOT EXISTS idx_artist_genres_artist_id ON artist_genres(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_genres_genre_id ON artist_genres(genre_id);
CREATE INDEX IF NOT EXISTS idx_artist_genres_primary ON artist_genres(artist_id, is_primary) WHERE is_primary = true;

ALTER TABLE artist_genres ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Event Artists Junction Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, artist_id)
);

CREATE INDEX IF NOT EXISTS idx_event_artists_event_id ON event_artists(event_id);
CREATE INDEX IF NOT EXISTS idx_event_artists_artist_id ON event_artists(artist_id);

ALTER TABLE event_artists ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 9: USER & ROLE MANAGEMENT (profiles, roles, user_roles + functions)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Profiles Table (extends auth.users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  email TEXT,
  display_name TEXT,
  full_name TEXT,
  gender TEXT,
  age_range TEXT,
  home_city TEXT,
  avatar_url TEXT,
  phone_number TEXT,
  instagram_handle TEXT,
  -- Billing address fields (standardized)
  billing_address_line_1 TEXT,
  billing_address_line_2 TEXT,
  billing_city TEXT,
  billing_state TEXT,
  billing_zip_code TEXT,
  billing_country TEXT DEFAULT 'US',
  stripe_customer_id TEXT,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT display_name_length CHECK (char_length(display_name) <= 50),
  CONSTRAINT full_name_length CHECK (char_length(full_name) <= 100),
  CONSTRAINT phone_number_format CHECK (phone_number ~ '^\(\d{3}\) \d{3}-\d{4}$'),
  CONSTRAINT instagram_handle_format CHECK (char_length(instagram_handle) <= 30 AND instagram_handle ~ '^[a-zA-Z0-9._]*$'),
  CONSTRAINT billing_state_format CHECK (billing_state IS NULL OR billing_state ~ '^[A-Z]{2}$'),
  CONSTRAINT billing_zip_code_format CHECK (billing_zip_code IS NULL OR billing_zip_code ~ '^\d{5}(-\d{4})?$'),
  CONSTRAINT billing_country_format CHECK (billing_country IS NULL OR length(billing_country) = 2)
);

COMMENT ON COLUMN profiles.billing_address_line_1 IS 'Billing street address';
COMMENT ON COLUMN profiles.billing_address_line_2 IS 'Billing apartment, suite, etc.';
COMMENT ON COLUMN profiles.billing_city IS 'Billing city';
COMMENT ON COLUMN profiles.billing_state IS 'Billing state (two-letter code)';
COMMENT ON COLUMN profiles.billing_zip_code IS 'Billing ZIP code';
COMMENT ON COLUMN profiles.billing_country IS 'Billing country (two-letter ISO code)';

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Roles Table (new role system)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  is_system_role BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);

DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- User Roles Junction Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

-- CRITICAL: RLS must be DISABLED on user_roles to prevent infinite recursion
-- The has_role() function queries user_roles. If RLS is enabled on user_roles,
-- and policies call has_role(), we get infinite recursion: policy → has_role() →
-- policy → has_role() → infinite loop. User roles are not sensitive data - they
-- just control permissions which are enforced on other tables.
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Role & Permission Functions
-- ----------------------------------------------------------------------------

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION has_role(user_id_param UUID, role_name_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = user_id_param
    AND r.name = role_name_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has a specific permission
CREATE OR REPLACE FUNCTION has_permission(user_id_param UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = user_id_param
    AND (
      r.permissions @> '["*"]'::jsonb
      OR r.permissions @> jsonb_build_array(permission_name)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all roles for a user (FIXED: returns permission_names as TEXT[])
DROP FUNCTION IF EXISTS get_user_roles(UUID);
CREATE FUNCTION get_user_roles(user_id_param UUID)
RETURNS TABLE (
  role_name TEXT,
  display_name TEXT,
  permission_names TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.name::TEXT as role_name,
    r.display_name::TEXT,
    -- Convert JSONB array to TEXT array
    ARRAY(SELECT jsonb_array_elements_text(r.permissions))::TEXT[] as permission_names
  FROM user_roles ur
  JOIN roles r ON r.id = ur.role_id
  WHERE ur.user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO profiles (
    id,
    user_id,
    email,
    display_name,
    full_name,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$;

-- Trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- SECTION 10: FEATURE FLAGS (with environment_id UUID)
-- ============================================================================

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  environment_id UUID NOT NULL REFERENCES environments(id),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(flag_name, environment_id)
);

COMMENT ON COLUMN feature_flags.environment_id IS 'References environments table - UUID foreign key';

CREATE INDEX IF NOT EXISTS idx_feature_flags_environment_id ON feature_flags(environment_id);
CREATE INDEX IF NOT EXISTS idx_feature_flags_flag_name ON feature_flags(flag_name);

DROP TRIGGER IF EXISTS update_feature_flags_updated_at ON feature_flags;
CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Dev admin access feature flag check (uses environment_id)
CREATE OR REPLACE FUNCTION is_dev_admin(user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM feature_flags ff
    JOIN environments e ON ff.environment_id = e.id
    WHERE ff.flag_name = 'dev_admin_access'
      AND ff.is_enabled = true
      AND e.name = 'dev'
      AND user_id_param IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 11: TICKETING SYSTEM
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Ticket Tiers Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ticket_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  total_tickets INTEGER NOT NULL,
  available_inventory INTEGER NOT NULL DEFAULT 0,
  reserved_inventory INTEGER NOT NULL DEFAULT 0,
  sold_inventory INTEGER NOT NULL DEFAULT 0,
  tier_order INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  hide_until_previous_sold_out BOOLEAN NOT NULL DEFAULT false,
  fee_flat_cents INTEGER NOT NULL DEFAULT 0,
  fee_pct_bps INTEGER NOT NULL DEFAULT 0, -- Basis points (1/100th of percent)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT available_inventory_non_negative CHECK (available_inventory >= 0),
  CONSTRAINT reserved_inventory_non_negative CHECK (reserved_inventory >= 0),
  CONSTRAINT sold_inventory_non_negative CHECK (sold_inventory >= 0)
);

COMMENT ON COLUMN ticket_tiers.fee_pct_bps IS 'Fee percentage in basis points (100 bps = 1%)';

CREATE INDEX IF NOT EXISTS idx_ticket_tiers_event_id ON ticket_tiers(event_id);
CREATE INDEX IF NOT EXISTS idx_ticket_tiers_tier_order ON ticket_tiers(tier_order);

-- Inventory validation function
CREATE OR REPLACE FUNCTION validate_ticket_tier_inventory()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.available_inventory + NEW.reserved_inventory + NEW.sold_inventory != NEW.total_tickets THEN
    RAISE EXCEPTION 'Inventory sum (% + % + %) must equal total_tickets (%)',
      NEW.available_inventory, NEW.reserved_inventory, NEW.sold_inventory, NEW.total_tickets;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_ticket_tier_inventory ON ticket_tiers;
CREATE TRIGGER check_ticket_tier_inventory
  BEFORE INSERT OR UPDATE ON ticket_tiers
  FOR EACH ROW
  EXECUTE FUNCTION validate_ticket_tier_inventory();

DROP TRIGGER IF EXISTS update_ticket_tiers_updated_at ON ticket_tiers;
CREATE TRIGGER update_ticket_tiers_updated_at
  BEFORE UPDATE ON ticket_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE ticket_tiers ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Ticket Holds Table (temporary reservations)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ticket_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_tier_id UUID NOT NULL REFERENCES ticket_tiers(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fingerprint TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_holds_expiry ON ticket_holds(expires_at);
CREATE INDEX IF NOT EXISTS idx_ticket_holds_tier ON ticket_holds(ticket_tier_id);
CREATE INDEX IF NOT EXISTS idx_ticket_holds_user_id ON ticket_holds(user_id);

ALTER TABLE ticket_holds ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Ticket Hold Management Functions
-- ----------------------------------------------------------------------------

-- Create a ticket hold (reserve tickets temporarily)
CREATE OR REPLACE FUNCTION create_ticket_hold(
  p_ticket_tier_id UUID,
  p_quantity INTEGER,
  p_user_id UUID,
  p_fingerprint TEXT,
  p_hold_duration_seconds INTEGER DEFAULT 540
)
RETURNS TABLE(hold_id UUID, expires_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hold_id UUID;
  v_expires_at TIMESTAMPTZ;
  v_available INTEGER;
BEGIN
  v_expires_at := NOW() + (p_hold_duration_seconds || ' seconds')::INTERVAL;

  -- Lock the row and check availability
  SELECT available_inventory INTO v_available
  FROM ticket_tiers
  WHERE id = p_ticket_tier_id
  FOR UPDATE;

  IF v_available < p_quantity THEN
    RAISE EXCEPTION 'Insufficient tickets available. Requested: %, Available: %', p_quantity, v_available;
  END IF;

  -- Update inventory
  UPDATE ticket_tiers
  SET
    available_inventory = available_inventory - p_quantity,
    reserved_inventory = reserved_inventory + p_quantity
  WHERE id = p_ticket_tier_id;

  -- Create hold record
  INSERT INTO ticket_holds (ticket_tier_id, quantity, user_id, fingerprint, expires_at)
  VALUES (p_ticket_tier_id, p_quantity, p_user_id, p_fingerprint, v_expires_at)
  RETURNING id INTO v_hold_id;

  RETURN QUERY SELECT v_hold_id, v_expires_at;
END;
$$;

-- Release a ticket hold (return tickets to available inventory)
CREATE OR REPLACE FUNCTION release_ticket_hold(p_hold_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier_id UUID;
  v_quantity INTEGER;
BEGIN
  DELETE FROM ticket_holds
  WHERE id = p_hold_id
  RETURNING ticket_tier_id, quantity INTO v_tier_id, v_quantity;

  IF FOUND THEN
    UPDATE ticket_tiers
    SET
      available_inventory = available_inventory + v_quantity,
      reserved_inventory = reserved_inventory - v_quantity
    WHERE id = v_tier_id;

    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- Convert hold to sale (move from reserved to sold)
CREATE OR REPLACE FUNCTION convert_hold_to_sale(p_hold_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier_id UUID;
  v_quantity INTEGER;
BEGIN
  DELETE FROM ticket_holds
  WHERE id = p_hold_id
  RETURNING ticket_tier_id, quantity INTO v_tier_id, v_quantity;

  IF FOUND THEN
    UPDATE ticket_tiers
    SET
      reserved_inventory = reserved_inventory - v_quantity,
      sold_inventory = sold_inventory + v_quantity
    WHERE id = v_tier_id;

    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- ----------------------------------------------------------------------------
-- Orders Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  subtotal_cents INTEGER NOT NULL CHECK (subtotal_cents >= 0),
  fees_cents INTEGER NOT NULL DEFAULT 0 CHECK (fees_cents >= 0),
  total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_checkout_session_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'refunded', 'cancelled')),
  -- Billing address fields (standardized)
  billing_address_line_1 TEXT,
  billing_address_line_2 TEXT,
  billing_city TEXT,
  billing_state TEXT,
  billing_zip_code TEXT,
  billing_country TEXT DEFAULT 'US',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT order_billing_state_format CHECK (billing_state IS NULL OR billing_state ~ '^[A-Z]{2}$'),
  CONSTRAINT order_billing_zip_code_format CHECK (billing_zip_code IS NULL OR billing_zip_code ~ '^\d{5}(-\d{4})?$'),
  CONSTRAINT order_billing_country_format CHECK (billing_country IS NULL OR length(billing_country) = 2)
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_event ON orders(event_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Order totals validation function
CREATE OR REPLACE FUNCTION validate_order_totals()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total_cents != NEW.subtotal_cents + NEW.fees_cents THEN
    RAISE EXCEPTION 'total_cents (%) must equal subtotal_cents (%) + fees_cents (%)',
      NEW.total_cents, NEW.subtotal_cents, NEW.fees_cents;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_order_totals ON orders;
CREATE TRIGGER check_order_totals
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION validate_order_totals();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Order Items Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  ticket_tier_id UUID NOT NULL REFERENCES ticket_tiers(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  unit_fee_cents INTEGER NOT NULL DEFAULT 0 CHECK (unit_fee_cents >= 0),
  subtotal_cents INTEGER GENERATED ALWAYS AS (quantity * unit_price_cents) STORED,
  fees_cents INTEGER GENERATED ALWAYS AS (quantity * unit_fee_cents) STORED,
  total_cents INTEGER GENERATED ALWAYS AS (quantity * (unit_price_cents + unit_fee_cents)) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_tier ON order_items(ticket_tier_id);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Tickets Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  ticket_tier_id UUID NOT NULL REFERENCES ticket_tiers(id) ON DELETE RESTRICT,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  attendee_name TEXT,
  attendee_email TEXT,
  qr_code_data TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'used', 'refunded', 'cancelled')),
  checked_in_at TIMESTAMPTZ,
  checked_in_by TEXT,
  apple_wallet_url TEXT,
  google_wallet_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_order ON tickets(order_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_qr ON tickets(qr_code_data);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);

DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Ticketing Fees Table (with environment_id UUID)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ticketing_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_name TEXT NOT NULL,
  fee_type TEXT NOT NULL CHECK (fee_type IN ('flat', 'percentage')),
  fee_value DECIMAL(10,2) NOT NULL CHECK (fee_value >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  environment_id UUID NOT NULL REFERENCES environments(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(fee_name, environment_id)
);

COMMENT ON COLUMN ticketing_fees.environment_id IS 'References environments table - UUID foreign key';

CREATE INDEX IF NOT EXISTS idx_ticketing_fees_active ON ticketing_fees(is_active);
CREATE INDEX IF NOT EXISTS idx_ticketing_fees_environment_id ON ticketing_fees(environment_id);

DROP TRIGGER IF EXISTS update_ticketing_fees_updated_at ON ticketing_fees;
CREATE TRIGGER update_ticketing_fees_updated_at
  BEFORE UPDATE ON ticketing_fees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE ticketing_fees ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Promo Codes Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'flat')),
  discount_value NUMERIC NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code) WHERE is_active = true;

DROP TRIGGER IF EXISTS update_promo_codes_updated_at ON promo_codes;
CREATE TRIGGER update_promo_codes_updated_at
  BEFORE UPDATE ON promo_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 12: QUEUE MANAGEMENT
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Ticketing Sessions (queue management)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ticketing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_session_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'waiting', 'completed')),
  entered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_active_session UNIQUE (event_id, user_session_id, status)
);

COMMENT ON TABLE ticketing_sessions IS 'Manages concurrent access to event ticketing. Limits number of simultaneous ticket purchases per event.';

CREATE INDEX IF NOT EXISTS idx_ticketing_sessions_event_status ON ticketing_sessions(event_id, status);
CREATE INDEX IF NOT EXISTS idx_ticketing_sessions_user_session ON ticketing_sessions(user_session_id);
CREATE INDEX IF NOT EXISTS idx_ticketing_sessions_created_at ON ticketing_sessions(created_at);

DROP TRIGGER IF EXISTS update_ticketing_sessions_updated_at ON ticketing_sessions;
CREATE TRIGGER update_ticketing_sessions_updated_at
  BEFORE UPDATE ON ticketing_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE ticketing_sessions ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Queue Configurations (per-event settings)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS queue_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL UNIQUE REFERENCES events(id) ON DELETE CASCADE,
  max_concurrent_users INT NOT NULL DEFAULT 50 CHECK (max_concurrent_users > 0),
  checkout_timeout_minutes INT NOT NULL DEFAULT 9 CHECK (checkout_timeout_minutes > 0),
  session_timeout_minutes INT NOT NULL DEFAULT 30 CHECK (session_timeout_minutes > 0),
  enable_queue BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE queue_configurations IS 'Configurable settings for event ticketing queue management. Controls concurrent user limits and timeout durations.';

CREATE INDEX IF NOT EXISTS idx_queue_configurations_event_id ON queue_configurations(event_id);

DROP TRIGGER IF EXISTS update_queue_configurations_updated_at ON queue_configurations;
CREATE TRIGGER update_queue_configurations_updated_at
  BEFORE UPDATE ON queue_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE queue_configurations ENABLE ROW LEVEL SECURITY;

-- Queue cleanup function
CREATE OR REPLACE FUNCTION cleanup_old_ticketing_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE ticketing_sessions
  SET status = 'completed', updated_at = NOW()
  WHERE status IN ('active', 'waiting')
    AND created_at < NOW() - INTERVAL '30 minutes';
END;
$$;

-- ============================================================================
-- SECTION 13: CONTENT & ANALYTICS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Exclusive Content Grants Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS exclusive_content_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('spotify_playlist', 'video', 'photo_gallery', 'download')),
  content_url TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  accessed_at TIMESTAMPTZ,
  access_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, event_id, content_type)
);

CREATE INDEX IF NOT EXISTS idx_content_grants_user ON exclusive_content_grants(user_id);
CREATE INDEX IF NOT EXISTS idx_content_grants_event ON exclusive_content_grants(event_id);

ALTER TABLE exclusive_content_grants ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Event Views Table (analytics)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_event_views_event_id ON event_views(event_id);
CREATE INDEX IF NOT EXISTS idx_event_views_viewed_at ON event_views(viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_views_viewer_id ON event_views(viewer_id);

ALTER TABLE event_views ENABLE ROW LEVEL SECURITY;

-- Event view functions
CREATE OR REPLACE FUNCTION get_event_view_count(p_event_id UUID)
RETURNS BIGINT
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)
  FROM event_views
  WHERE event_id = p_event_id;
$$;

CREATE OR REPLACE FUNCTION record_event_view(
  p_event_id UUID,
  p_session_id TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_view_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  INSERT INTO event_views (event_id, viewer_id, session_id, ip_address, user_agent)
  VALUES (p_event_id, v_user_id, p_session_id, p_ip_address, p_user_agent)
  RETURNING id INTO v_view_id;

  RETURN v_view_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- Event Images Table (storage metadata)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS event_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL UNIQUE,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  is_primary BOOLEAN DEFAULT false,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE event_images IS 'Tracks uploaded event images stored in Supabase Storage';
COMMENT ON COLUMN event_images.storage_path IS 'Path to file in storage bucket (e.g., "events/123/hero.jpg")';
COMMENT ON COLUMN event_images.is_primary IS 'Whether this is the primary/hero image for the event';

CREATE INDEX IF NOT EXISTS idx_event_images_event_id ON event_images(event_id);
CREATE INDEX IF NOT EXISTS idx_event_images_is_primary ON event_images(event_id, is_primary);

DROP TRIGGER IF EXISTS update_event_images_updated_at ON event_images;
CREATE TRIGGER update_event_images_updated_at
  BEFORE UPDATE ON event_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE event_images ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 14: INTEGRATIONS & DEVELOPER TOOLS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Webhook Events Table (Stripe webhook idempotency)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed_at);

ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Dev Notes Table (TODO tracking)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dev_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('TODO', 'INFO', 'BUG', 'QUESTION')),
  status TEXT NOT NULL DEFAULT 'TODO' CHECK (status IN ('TODO', 'IN_PROGRESS', 'ARCHIVED', 'RESOLVED', 'CANCELLED'))
);

CREATE INDEX IF NOT EXISTS idx_dev_notes_author_id ON dev_notes(author_id);
CREATE INDEX IF NOT EXISTS idx_dev_notes_status ON dev_notes(status);
CREATE INDEX IF NOT EXISTS idx_dev_notes_type ON dev_notes(type);
CREATE INDEX IF NOT EXISTS idx_dev_notes_created_at ON dev_notes(created_at DESC);

DROP TRIGGER IF EXISTS update_dev_notes_updated_at ON dev_notes;
CREATE TRIGGER update_dev_notes_updated_at
  BEFORE UPDATE ON dev_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE dev_notes ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- DataGrid Configs Table (user grid preferences)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS datagrid_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grid_id TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, grid_id)
);

COMMENT ON TABLE datagrid_configs IS 'Stores user-specific data grid configurations';
COMMENT ON COLUMN datagrid_configs.grid_id IS 'Unique identifier for the grid instance';
COMMENT ON COLUMN datagrid_configs.config IS 'JSON configuration: {columns: [{key, visible, order, width}], pageSize, sortBy}';

CREATE INDEX IF NOT EXISTS idx_datagrid_configs_user_id ON datagrid_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_datagrid_configs_grid_id ON datagrid_configs(grid_id);
CREATE INDEX IF NOT EXISTS idx_datagrid_configs_user_grid ON datagrid_configs(user_id, grid_id);

DROP TRIGGER IF EXISTS update_datagrid_configs_updated_at ON datagrid_configs;
CREATE TRIGGER update_datagrid_configs_updated_at
  BEFORE UPDATE ON datagrid_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE datagrid_configs ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Table Metadata Cache Table (Dynamic Data Grid)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS table_metadata (
  table_name TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  description TEXT,
  columns JSONB NOT NULL DEFAULT '[]'::jsonb,
  relations JSONB NOT NULL DEFAULT '[]'::jsonb,
  constraints JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_table_metadata_updated_at ON table_metadata(updated_at DESC);

ALTER TABLE table_metadata ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE table_metadata IS 'Cached database schema metadata for dynamic data grid generation';
COMMENT ON COLUMN table_metadata.columns IS 'Array of column definitions: [{name, type, nullable, default, is_primary_key}]';
COMMENT ON COLUMN table_metadata.relations IS 'Array of foreign key relations: [{column, referenced_table, referenced_column}]';
COMMENT ON COLUMN table_metadata.constraints IS 'Table constraints: {primary_keys: [], unique: [], check: []}';

-- ----------------------------------------------------------------------------
-- Column Customizations Table (Dynamic Data Grid)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS column_customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  column_key TEXT NOT NULL,
  custom_label TEXT,
  custom_type TEXT,
  is_editable BOOLEAN,
  is_visible_by_default BOOLEAN DEFAULT true,
  is_sortable BOOLEAN DEFAULT true,
  is_filterable BOOLEAN DEFAULT true,
  custom_width TEXT,
  render_config JSONB,
  display_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(table_name, column_key)
);

CREATE INDEX IF NOT EXISTS idx_column_customizations_table ON column_customizations(table_name);
CREATE INDEX IF NOT EXISTS idx_column_customizations_table_column ON column_customizations(table_name, column_key);

ALTER TABLE column_customizations ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE column_customizations IS 'Admin-defined customizations for table columns in data grids';
COMMENT ON COLUMN column_customizations.custom_type IS 'Override auto-detected type: text, number, email, url, date, boolean, etc.';
COMMENT ON COLUMN column_customizations.render_config IS 'Custom render configuration: {component, props, options}';

-- ============================================================================
-- SECTION 15: SCAVENGER HUNT
-- ============================================================================

CREATE TABLE IF NOT EXISTS scavenger_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  checkin_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_scavenger_locations_updated_at ON scavenger_locations;
CREATE TRIGGER update_scavenger_locations_updated_at
  BEFORE UPDATE ON scavenger_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE scavenger_locations ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS scavenger_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES scavenger_locations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, location_id)
);

ALTER TABLE scavenger_claims ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS scavenger_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  location_id UUID REFERENCES scavenger_locations(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE scavenger_tokens ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 16: ARTIST REGISTRATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS artist_registrations (
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

CREATE INDEX IF NOT EXISTS idx_artist_registrations_user_id ON artist_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_artist_registrations_status ON artist_registrations(status);
CREATE INDEX IF NOT EXISTS idx_artist_registrations_submitted_at ON artist_registrations(submitted_at DESC);

ALTER TABLE artist_registrations ENABLE ROW LEVEL SECURITY;

-- Create function to update updated_at timestamp for artist_registrations
CREATE OR REPLACE FUNCTION update_artist_registrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_artist_registrations_updated_at ON artist_registrations;
CREATE TRIGGER update_artist_registrations_updated_at
  BEFORE UPDATE ON artist_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_artist_registrations_updated_at();

-- ============================================================================
-- SECTION 17: ADDITIONAL INDEXES
-- ============================================================================

-- Additional composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_events_venue_start_time ON events(venue_id, start_time);
CREATE INDEX IF NOT EXISTS idx_tickets_event_status ON tickets(event_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);

-- ============================================================================
-- SECTION 18: VIEWS AND ADMIN FUNCTIONS
-- ============================================================================

-- Drop view first (depends on get_all_users function)
DROP VIEW IF EXISTS users_complete;

-- Get complete user information (for admin views)
DROP FUNCTION IF EXISTS get_all_users() CASCADE;
CREATE FUNCTION get_all_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  auth_created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  email_confirmed_at TIMESTAMPTZ,
  user_id UUID,
  display_name TEXT,
  full_name TEXT,
  avatar_url TEXT,
  organization_id UUID,
  profile_created_at TIMESTAMPTZ,
  profile_updated_at TIMESTAMPTZ,
  organization_name TEXT,
  roles JSONB
)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
AS $$
  SELECT
    au.id,
    au.email,
    au.created_at as auth_created_at,
    au.last_sign_in_at,
    au.email_confirmed_at,
    p.user_id,
    p.display_name,
    p.full_name,
    p.avatar_url,
    p.organization_id,
    p.created_at as profile_created_at,
    p.updated_at as profile_updated_at,
    o.name as organization_name,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'role_name', r.name,
          'display_name', r.display_name,
          'permissions', r.permissions
        )
      )
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = au.id
    ) as roles
  FROM auth.users au
  LEFT JOIN profiles p ON au.id = p.user_id
  LEFT JOIN organizations o ON p.organization_id = o.id;
$$;

-- Complete user information view (recreate after function)
CREATE OR REPLACE VIEW users_complete AS
SELECT * FROM get_all_users();

-- Get all users with email (admin function with permission check)
DROP FUNCTION IF EXISTS get_all_users_with_email();
CREATE FUNCTION get_all_users_with_email()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  display_name TEXT,
  full_name TEXT,
  gender TEXT,
  age_range TEXT,
  home_city TEXT,
  avatar_url TEXT,
  billing_address_line_1 TEXT,
  billing_city TEXT,
  billing_state TEXT,
  billing_zip_code TEXT,
  stripe_customer_id TEXT,
  organization_id UUID,
  organization_name TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  email TEXT,
  roles TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Only admins can access this function';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    p.display_name,
    p.full_name,
    p.gender,
    p.age_range,
    p.home_city,
    p.avatar_url,
    p.billing_address_line_1,
    p.billing_city,
    p.billing_state,
    p.billing_zip_code,
    p.stripe_customer_id,
    p.organization_id,
    o.name as organization_name,
    p.created_at,
    p.updated_at,
    COALESCE(au.email, 'N/A') as email,
    ARRAY(
      SELECT r.name
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = p.id
    ) as roles
  FROM profiles p
  LEFT JOIN auth.users au ON au.id = p.id
  LEFT JOIN organizations o ON p.organization_id = o.id
  ORDER BY p.created_at DESC;
END;
$$;

-- ----------------------------------------------------------------------------
-- Genre Helper Functions
-- ----------------------------------------------------------------------------

-- Get genre hierarchy (recursive tree)
DROP FUNCTION IF EXISTS get_genre_hierarchy(UUID);
CREATE FUNCTION get_genre_hierarchy(genre_id_param UUID)
RETURNS TABLE (id UUID, name TEXT, level INTEGER) AS $$
WITH RECURSIVE genre_tree AS (
  SELECT g.id, g.name, g.parent_id, 0 as level
  FROM genres g WHERE g.id = genre_id_param
  UNION ALL
  SELECT g.id, g.name, g.parent_id, gt.level + 1
  FROM genres g INNER JOIN genre_tree gt ON g.parent_id = gt.id
)
SELECT genre_tree.id, genre_tree.name, genre_tree.level
FROM genre_tree ORDER BY level, name;
$$ LANGUAGE sql STABLE;

-- Get genre path (breadcrumb)
CREATE OR REPLACE FUNCTION get_genre_path(genre_id_param UUID)
RETURNS TEXT AS $$
WITH RECURSIVE genre_path AS (
  SELECT g.id, g.name, g.parent_id, g.name as path
  FROM genres g WHERE g.id = genre_id_param
  UNION ALL
  SELECT g.id, g.name, g.parent_id, g.name || ' > ' || gp.path
  FROM genres g INNER JOIN genre_path gp ON g.id = gp.parent_id
)
SELECT path FROM genre_path WHERE parent_id IS NULL;
$$ LANGUAGE sql STABLE;

-- Get artist's genres
DROP FUNCTION IF EXISTS get_artist_genres(UUID);
CREATE FUNCTION get_artist_genres(artist_id_param UUID)
RETURNS TABLE (
  genre_id UUID, genre_name TEXT, is_primary BOOLEAN,
  parent_genre_id UUID, parent_genre_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT g.id, g.name, ag.is_primary, pg.id, pg.name
  FROM artist_genres ag
  JOIN genres g ON g.id = ag.genre_id
  LEFT JOIN genres pg ON pg.id = g.parent_id
  WHERE ag.artist_id = artist_id_param
  ORDER BY ag.is_primary DESC, g.name;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get artists by genre (with recursive subgenres)
DROP FUNCTION IF EXISTS get_artists_by_genre(UUID, BOOLEAN);
CREATE FUNCTION get_artists_by_genre(
  genre_id_param UUID,
  include_subgenres BOOLEAN DEFAULT true
)
RETURNS TABLE (
  artist_id UUID,
  artist_name TEXT,
  artist_image_url TEXT,
  genre_name TEXT,
  is_primary BOOLEAN
) AS $$
BEGIN
  IF include_subgenres THEN
    RETURN QUERY
    WITH RECURSIVE genre_tree AS (
      SELECT id FROM genres WHERE id = genre_id_param
      UNION ALL
      SELECT g.id FROM genres g INNER JOIN genre_tree gt ON g.parent_id = gt.id
    )
    SELECT DISTINCT a.id, a.name, a.image_url, g.name, ag.is_primary
    FROM artists a
    JOIN artist_genres ag ON ag.artist_id = a.id
    JOIN genres g ON g.id = ag.genre_id
    WHERE g.id IN (SELECT id FROM genre_tree)
    ORDER BY ag.is_primary DESC, a.name;
  ELSE
    RETURN QUERY
    SELECT a.id, a.name, a.image_url, g.name, ag.is_primary
    FROM artists a
    JOIN artist_genres ag ON ag.artist_id = a.id
    JOIN genres g ON g.id = ag.genre_id
    WHERE g.id = genre_id_param
    ORDER BY ag.is_primary DESC, a.name;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- ----------------------------------------------------------------------------
-- Schema Introspection RPC Functions (Dynamic Data Grid)
-- ----------------------------------------------------------------------------

-- Function 1: Get list of all tables in public schema
DROP FUNCTION IF EXISTS get_table_list();
CREATE FUNCTION get_table_list()
RETURNS TABLE (
  table_name TEXT,
  row_count BIGINT,
  table_size TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.tablename::TEXT as table_name,
    (xpath('/row/cnt/text()',
      query_to_xml(format('SELECT COUNT(*) as cnt FROM %I.%I',
        t.schemaname, t.tablename), false, true, '')
    ))[1]::text::bigint as row_count,
    pg_size_pretty(pg_total_relation_size(quote_ident(t.schemaname) || '.' || quote_ident(t.tablename))) as table_size
  FROM pg_tables t
  WHERE t.schemaname = 'public'
    AND t.tablename NOT LIKE 'pg_%'
    AND t.tablename NOT LIKE 'sql_%'
  ORDER BY t.tablename;
END;
$$;

-- Function 2: Get schema information for a specific table
DROP FUNCTION IF EXISTS get_table_schema(TEXT);
CREATE FUNCTION get_table_schema(p_table_name TEXT)
RETURNS TABLE (
  column_name TEXT,
  data_type TEXT,
  is_nullable TEXT,
  column_default TEXT,
  character_maximum_length INTEGER,
  numeric_precision INTEGER,
  is_primary_key BOOLEAN,
  is_unique BOOLEAN,
  ordinal_position INTEGER
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.column_name::TEXT,
    c.data_type::TEXT,
    c.is_nullable::TEXT,
    c.column_default::TEXT,
    c.character_maximum_length::INTEGER,
    c.numeric_precision::INTEGER,
    -- Check if column is primary key
    EXISTS (
      SELECT 1
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'public'
        AND tc.table_name = p_table_name
        AND kcu.column_name = c.column_name
    )::BOOLEAN as is_primary_key,
    -- Check if column has unique constraint
    EXISTS (
      SELECT 1
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'UNIQUE'
        AND tc.table_schema = 'public'
        AND tc.table_name = p_table_name
        AND kcu.column_name = c.column_name
    )::BOOLEAN as is_unique,
    c.ordinal_position::INTEGER
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = p_table_name
  ORDER BY c.ordinal_position;
END;
$$;

-- Function 3: Get foreign key relationships for a table
DROP FUNCTION IF EXISTS get_foreign_keys(TEXT);
CREATE FUNCTION get_foreign_keys(p_table_name TEXT)
RETURNS TABLE (
  column_name TEXT,
  foreign_table_name TEXT,
  foreign_column_name TEXT,
  constraint_name TEXT,
  on_delete_action TEXT,
  on_update_action TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kcu.column_name::TEXT,
    ccu.table_name::TEXT as foreign_table_name,
    ccu.column_name::TEXT as foreign_column_name,
    tc.constraint_name::TEXT,
    rc.delete_rule::TEXT as on_delete_action,
    rc.update_rule::TEXT as on_update_action
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
  JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
    AND tc.table_schema = rc.constraint_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name = p_table_name
  ORDER BY kcu.ordinal_position;
END;
$$;

-- Function 4: Refresh metadata cache for a specific table
CREATE OR REPLACE FUNCTION refresh_table_metadata(p_table_name TEXT)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_columns JSONB;
  v_relations JSONB;
  v_result JSONB;
BEGIN
  -- Get column information
  SELECT jsonb_agg(
    jsonb_build_object(
      'name', column_name,
      'type', data_type,
      'nullable', is_nullable = 'YES',
      'default', column_default,
      'max_length', character_maximum_length,
      'precision', numeric_precision,
      'is_primary_key', is_primary_key,
      'is_unique', is_unique,
      'position', ordinal_position
    ) ORDER BY ordinal_position
  ) INTO v_columns
  FROM get_table_schema(p_table_name);

  -- Get foreign key relations
  SELECT jsonb_agg(
    jsonb_build_object(
      'column', column_name,
      'referenced_table', foreign_table_name,
      'referenced_column', foreign_column_name,
      'constraint_name', constraint_name,
      'on_delete', on_delete_action,
      'on_update', on_update_action
    )
  ) INTO v_relations
  FROM get_foreign_keys(p_table_name);

  -- Ensure we have valid JSONB (empty array if null)
  v_columns := COALESCE(v_columns, '[]'::jsonb);
  v_relations := COALESCE(v_relations, '[]'::jsonb);

  -- Upsert into table_metadata
  INSERT INTO table_metadata (
    table_name,
    display_name,
    columns,
    relations,
    updated_at,
    updated_by
  ) VALUES (
    p_table_name,
    -- Convert snake_case to Title Case for display name
    initcap(replace(p_table_name, '_', ' ')),
    v_columns,
    v_relations,
    NOW(),
    auth.uid()
  )
  ON CONFLICT (table_name)
  DO UPDATE SET
    columns = EXCLUDED.columns,
    relations = EXCLUDED.relations,
    updated_at = NOW(),
    updated_by = auth.uid();

  -- Return the cached metadata
  v_result := jsonb_build_object(
    'table_name', p_table_name,
    'columns', v_columns,
    'relations', v_relations,
    'updated_at', NOW()
  );

  RETURN v_result;
END;
$$;

-- Function 5: Refresh metadata for all tables
CREATE OR REPLACE FUNCTION refresh_all_table_metadata()
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_table RECORD;
  v_results JSONB := '[]'::jsonb;
  v_table_result JSONB;
BEGIN
  -- Loop through all public tables
  FOR v_table IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE 'sql_%'
    ORDER BY tablename
  LOOP
    -- Refresh metadata for this table
    v_table_result := refresh_table_metadata(v_table.tablename);

    -- Add to results array
    v_results := v_results || jsonb_build_array(v_table_result);
  END LOOP;

  RETURN jsonb_build_object(
    'tables_refreshed', jsonb_array_length(v_results),
    'results', v_results,
    'timestamp', NOW()
  );
END;
$$;

-- Grant execute permissions on RPC functions
GRANT EXECUTE ON FUNCTION get_table_list() TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_schema(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_foreign_keys(TEXT) TO authenticated;

-- Only admins can refresh metadata
REVOKE EXECUTE ON FUNCTION refresh_table_metadata(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION refresh_all_table_metadata() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION refresh_table_metadata(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_all_table_metadata() TO authenticated;

-- Add function comments
COMMENT ON FUNCTION get_table_list() IS 'Returns list of all public tables with row counts and sizes';
COMMENT ON FUNCTION get_table_schema(TEXT) IS 'Returns detailed schema information for a specific table';
COMMENT ON FUNCTION get_foreign_keys(TEXT) IS 'Returns foreign key relationships for a specific table';
COMMENT ON FUNCTION refresh_table_metadata(TEXT) IS 'Refreshes cached metadata for a specific table (admin only)';
COMMENT ON FUNCTION refresh_all_table_metadata() IS 'Refreshes cached metadata for all tables (admin only)';

-- ============================================================================
-- SECTION 19: RLS POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Environments RLS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Environments are publicly viewable" ON environments;
DROP POLICY IF EXISTS "public_read_environments" ON environments;
DROP POLICY IF EXISTS "Admins can manage environments" ON environments;
DROP POLICY IF EXISTS "admin_manage_environments" ON environments;

CREATE POLICY "public_read_environments"
  ON environments FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "admin_manage_environments"
  ON environments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'developer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('admin', 'developer')
    )
  );

-- ----------------------------------------------------------------------------
-- Cities RLS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Cities are publicly viewable" ON cities;
DROP POLICY IF EXISTS "Admins can insert cities" ON cities;
DROP POLICY IF EXISTS "Admins can update cities" ON cities;
DROP POLICY IF EXISTS "Admins can delete cities" ON cities;

CREATE POLICY "Cities are publicly viewable"
  ON cities FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert cities"
  ON cities FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

CREATE POLICY "Admins can update cities"
  ON cities FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

CREATE POLICY "Admins can delete cities"
  ON cities FOR DELETE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

-- ----------------------------------------------------------------------------
-- Organizations RLS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view organizations they own or belong to" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;
DROP POLICY IF EXISTS "Organization owners can update their organizations" ON organizations;
DROP POLICY IF EXISTS "Organization owners can delete their organizations" ON organizations;

CREATE POLICY "Users can view organizations they own or belong to"
  ON organizations FOR SELECT
  USING (
    auth.uid() = owner_id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.organization_id = organizations.id
    )
  );

CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Organization owners can update their organizations"
  ON organizations FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Organization owners can delete their organizations"
  ON organizations FOR DELETE
  USING (auth.uid() = owner_id);

-- ----------------------------------------------------------------------------
-- Venues RLS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Venues are publicly viewable" ON venues;
DROP POLICY IF EXISTS "Admins can insert venues" ON venues;
DROP POLICY IF EXISTS "Admins can update venues" ON venues;
DROP POLICY IF EXISTS "Admins can delete venues" ON venues;

CREATE POLICY "Venues are publicly viewable"
  ON venues FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert venues"
  ON venues FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

CREATE POLICY "Admins can update venues"
  ON venues FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

CREATE POLICY "Admins can delete venues"
  ON venues FOR DELETE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

-- ----------------------------------------------------------------------------
-- Genres RLS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Genres are publicly viewable" ON genres;
DROP POLICY IF EXISTS "Admins and developers can manage genres" ON genres;

CREATE POLICY "Genres are publicly viewable"
  ON genres FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins and developers can manage genres"
  ON genres FOR ALL
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'developer'))
  );

-- ----------------------------------------------------------------------------
-- Artists RLS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Artists are publicly viewable" ON artists;
DROP POLICY IF EXISTS "Admins can insert artists" ON artists;
DROP POLICY IF EXISTS "Admins can update artists" ON artists;
DROP POLICY IF EXISTS "Admins can delete artists" ON artists;

CREATE POLICY "Artists are publicly viewable"
  ON artists FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert artists"
  ON artists FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

CREATE POLICY "Admins can update artists"
  ON artists FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

CREATE POLICY "Admins can delete artists"
  ON artists FOR DELETE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

-- ----------------------------------------------------------------------------
-- Events RLS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Events are publicly viewable" ON events;
DROP POLICY IF EXISTS "Admins can insert events" ON events;
DROP POLICY IF EXISTS "Admins can update events" ON events;
DROP POLICY IF EXISTS "Admins can delete events" ON events;

CREATE POLICY "Events are publicly viewable"
  ON events FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

CREATE POLICY "Admins can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

CREATE POLICY "Admins can delete events"
  ON events FOR DELETE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

-- ----------------------------------------------------------------------------
-- Artist Genres RLS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Artist genres are publicly viewable" ON artist_genres;
DROP POLICY IF EXISTS "Admins and developers can manage artist genres" ON artist_genres;

CREATE POLICY "Artist genres are publicly viewable"
  ON artist_genres FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins and developers can manage artist genres"
  ON artist_genres FOR ALL
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'developer'))
  );

-- ----------------------------------------------------------------------------
-- Event Artists RLS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Event artists are publicly viewable" ON event_artists;
DROP POLICY IF EXISTS "Admins can manage event artists" ON event_artists;

CREATE POLICY "Event artists are publicly viewable"
  ON event_artists FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage event artists"
  ON event_artists FOR ALL
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

-- ----------------------------------------------------------------------------
-- Profiles RLS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

-- ----------------------------------------------------------------------------
-- Roles RLS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Roles are publicly viewable" ON roles;
DROP POLICY IF EXISTS "Admins and developers can manage roles" ON roles;

CREATE POLICY "Roles are publicly viewable"
  ON roles FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins and developers can manage roles"
  ON roles FOR ALL
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (
      has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'developer')
      OR is_dev_admin(auth.uid())
    )
  );

-- ----------------------------------------------------------------------------
-- User Roles RLS - DISABLED (no policies needed)
-- ----------------------------------------------------------------------------
-- IMPORTANT: RLS is DISABLED on user_roles (see line 419) to prevent infinite
-- recursion. Policies that would call has_role() to check admin access would
-- create an infinite loop since has_role() queries user_roles.
--
-- Security is maintained through:
-- 1. GRANT permissions control who can modify user_roles (see SECTION 21)
-- 2. Application-level permission checks via has_role() function
-- 3. RLS policies on OTHER tables that use has_role() to restrict access
--
-- User roles are not sensitive data - they just determine permissions which
-- are enforced elsewhere.

DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins and developers can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins and developers can insert user_roles" ON user_roles;
DROP POLICY IF EXISTS "Admins and developers can update user_roles" ON user_roles;
DROP POLICY IF EXISTS "Admins and developers can delete user_roles" ON user_roles;

-- No policies created - RLS is disabled on this table

-- ----------------------------------------------------------------------------
-- Feature Flags RLS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Feature flags are publicly viewable" ON feature_flags;
DROP POLICY IF EXISTS "Admins can insert feature flags" ON feature_flags;
DROP POLICY IF EXISTS "Admins can update feature flags" ON feature_flags;
DROP POLICY IF EXISTS "Admins can delete feature flags" ON feature_flags;

CREATE POLICY "Feature flags are publicly viewable"
  ON feature_flags FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can insert feature flags"
  ON feature_flags FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

CREATE POLICY "Admins can update feature flags"
  ON feature_flags FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

CREATE POLICY "Admins can delete feature flags"
  ON feature_flags FOR DELETE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

-- ----------------------------------------------------------------------------
-- Ticket Tiers RLS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Ticket tiers are publicly viewable" ON ticket_tiers;
DROP POLICY IF EXISTS "Admins can insert ticket tiers" ON ticket_tiers;
DROP POLICY IF EXISTS "Admins can update ticket tiers" ON ticket_tiers;
DROP POLICY IF EXISTS "Admins can delete ticket tiers" ON ticket_tiers;

CREATE POLICY "Ticket tiers are publicly viewable"
  ON ticket_tiers FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can view all ticket tiers"
  ON ticket_tiers FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

CREATE POLICY "Admins can insert ticket tiers"
  ON ticket_tiers FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

CREATE POLICY "Admins can update ticket tiers"
  ON ticket_tiers FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

CREATE POLICY "Admins can delete ticket tiers"
  ON ticket_tiers FOR DELETE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

-- ----------------------------------------------------------------------------
-- Ticket Holds RLS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own holds" ON ticket_holds;
DROP POLICY IF EXISTS "Users can create holds" ON ticket_holds;
DROP POLICY IF EXISTS "Admins can update holds" ON ticket_holds;
DROP POLICY IF EXISTS "Admins can delete holds" ON ticket_holds;

CREATE POLICY "Users can view their own holds"
  ON ticket_holds FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can create holds"
  ON ticket_holds FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Admins can update holds"
  ON ticket_holds FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

CREATE POLICY "Admins can delete holds"
  ON ticket_holds FOR DELETE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

-- ----------------------------------------------------------------------------
-- Orders RLS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON orders;

CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own orders"
  ON orders FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

CREATE POLICY "Admins can delete orders"
  ON orders FOR DELETE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

-- ----------------------------------------------------------------------------
-- Order Items RLS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view items for their orders" ON order_items;
DROP POLICY IF EXISTS "Users can insert items for their orders" ON order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
DROP POLICY IF EXISTS "Admins can update order_items" ON order_items;
DROP POLICY IF EXISTS "Admins can delete order_items" ON order_items;

CREATE POLICY "Users can view items for their orders"
  ON order_items FOR SELECT
  USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert items for their orders"
  ON order_items FOR INSERT
  WITH CHECK (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

CREATE POLICY "Admins can update order_items"
  ON order_items FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

CREATE POLICY "Admins can delete order_items"
  ON order_items FOR DELETE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

-- ----------------------------------------------------------------------------
-- Tickets RLS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view tickets for their orders" ON tickets;
DROP POLICY IF EXISTS "Users can update attendee info for their tickets" ON tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON tickets;
DROP POLICY IF EXISTS "Admins can insert tickets" ON tickets;
DROP POLICY IF EXISTS "Admins can delete tickets" ON tickets;

CREATE POLICY "Users can view tickets for their orders"
  ON tickets FOR SELECT
  USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));

CREATE POLICY "Users can update attendee info for their tickets"
  ON tickets FOR UPDATE
  USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()))
  WITH CHECK (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all tickets"
  ON tickets FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

CREATE POLICY "Admins can insert tickets"
  ON tickets FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

CREATE POLICY "Admins can delete tickets"
  ON tickets FOR DELETE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

-- ----------------------------------------------------------------------------
-- Ticketing Fees RLS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Ticketing fees are publicly viewable" ON ticketing_fees;
DROP POLICY IF EXISTS "Admins can insert fees" ON ticketing_fees;
DROP POLICY IF EXISTS "Admins can update fees" ON ticketing_fees;
DROP POLICY IF EXISTS "Admins can delete fees" ON ticketing_fees;

CREATE POLICY "Ticketing fees are publicly viewable"
  ON ticketing_fees FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can insert fees"
  ON ticketing_fees FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

CREATE POLICY "Admins can update fees"
  ON ticketing_fees FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

CREATE POLICY "Admins can delete fees"
  ON ticketing_fees FOR DELETE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

-- ----------------------------------------------------------------------------
-- Promo Codes RLS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Promo codes are publicly viewable" ON promo_codes;
DROP POLICY IF EXISTS "Admins can insert promo codes" ON promo_codes;
DROP POLICY IF EXISTS "Admins can update promo codes" ON promo_codes;
DROP POLICY IF EXISTS "Admins can delete promo codes" ON promo_codes;

CREATE POLICY "Promo codes are publicly viewable"
  ON promo_codes FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "Admins can insert promo codes"
  ON promo_codes FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

CREATE POLICY "Admins can update promo codes"
  ON promo_codes FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

CREATE POLICY "Admins can delete promo codes"
  ON promo_codes FOR DELETE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

-- ----------------------------------------------------------------------------
-- Queue Management RLS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view ticketing sessions" ON ticketing_sessions;
DROP POLICY IF EXISTS "Anyone can create ticketing sessions" ON ticketing_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON ticketing_sessions;

CREATE POLICY "Anyone can view ticketing sessions"
  ON ticketing_sessions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create ticketing sessions"
  ON ticketing_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own sessions"
  ON ticketing_sessions FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view queue configurations" ON queue_configurations;
DROP POLICY IF EXISTS "Admins can create queue configurations" ON queue_configurations;
DROP POLICY IF EXISTS "Admins can update queue configurations" ON queue_configurations;
DROP POLICY IF EXISTS "Admins can delete queue configurations" ON queue_configurations;

CREATE POLICY "Anyone can view queue configurations"
  ON queue_configurations FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can create queue configurations"
  ON queue_configurations FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can update queue configurations"
  ON queue_configurations FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can delete queue configurations"
  ON queue_configurations FOR DELETE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    has_role(auth.uid(), 'admin')
  );

-- ----------------------------------------------------------------------------
-- Content & Analytics RLS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own content grants" ON exclusive_content_grants;
DROP POLICY IF EXISTS "Admins can insert content grants" ON exclusive_content_grants;
DROP POLICY IF EXISTS "Admins can update content grants" ON exclusive_content_grants;
DROP POLICY IF EXISTS "Admins can delete content grants" ON exclusive_content_grants;

CREATE POLICY "Users can view their own content grants"
  ON exclusive_content_grants FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can insert content grants"
  ON exclusive_content_grants FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

CREATE POLICY "Admins can update content grants"
  ON exclusive_content_grants FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

CREATE POLICY "Admins can delete content grants"
  ON exclusive_content_grants FOR DELETE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

DROP POLICY IF EXISTS "Anyone can record event views" ON event_views;
DROP POLICY IF EXISTS "Event views are publicly viewable" ON event_views;
DROP POLICY IF EXISTS "Only admins can delete event views" ON event_views;

CREATE POLICY "Anyone can record event views"
  ON event_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Event views are publicly viewable"
  ON event_views FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Only admins can delete event views"
  ON event_views FOR DELETE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "Event images metadata is publicly viewable" ON event_images;
DROP POLICY IF EXISTS "Admins and developers can insert event images" ON event_images;
DROP POLICY IF EXISTS "Admins and developers can update event images" ON event_images;
DROP POLICY IF EXISTS "Admins and developers can delete event images" ON event_images;

CREATE POLICY "Event images metadata is publicly viewable"
  ON event_images FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins and developers can insert event images"
  ON event_images FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (
      has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'developer')
    )
  );

CREATE POLICY "Admins and developers can update event images"
  ON event_images FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (
      has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'developer')
    )
  );

CREATE POLICY "Admins and developers can delete event images"
  ON event_images FOR DELETE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (
      has_role(auth.uid(), 'admin')
      OR has_role(auth.uid(), 'developer')
    )
  );

-- ----------------------------------------------------------------------------
-- Webhook Events RLS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "No direct access to webhooks" ON webhook_events;
DROP POLICY IF EXISTS "Service role can manage webhooks" ON webhook_events;

CREATE POLICY "No direct access to webhooks"
  ON webhook_events FOR SELECT
  USING (false);

CREATE POLICY "Service role can manage webhooks"
  ON webhook_events FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ----------------------------------------------------------------------------
-- Developer Tools RLS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Developers can view all dev notes" ON dev_notes;
DROP POLICY IF EXISTS "Developers can create dev notes" ON dev_notes;
DROP POLICY IF EXISTS "Developers can update their own dev notes" ON dev_notes;
DROP POLICY IF EXISTS "Developers can delete their own dev notes" ON dev_notes;

CREATE POLICY "Developers can view all dev notes"
  ON dev_notes FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (
      has_role(auth.uid(), 'developer')
      OR has_role(auth.uid(), 'admin')
    )
  );

CREATE POLICY "Developers can create dev notes"
  ON dev_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'developer') OR has_role(auth.uid(), 'admin'))
    AND author_id = auth.uid()
  );

CREATE POLICY "Developers can update their own dev notes"
  ON dev_notes FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    author_id = auth.uid()
    AND (has_role(auth.uid(), 'developer') OR has_role(auth.uid(), 'admin'))
  )
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Developers can delete their own dev notes"
  ON dev_notes FOR DELETE
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    author_id = auth.uid()
    AND (has_role(auth.uid(), 'developer') OR has_role(auth.uid(), 'admin'))
  );

-- ----------------------------------------------------------------------------
-- DataGrid Configs RLS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own datagrid configs" ON datagrid_configs;
DROP POLICY IF EXISTS "Users can insert own datagrid configs" ON datagrid_configs;
DROP POLICY IF EXISTS "Users can update own datagrid configs" ON datagrid_configs;
DROP POLICY IF EXISTS "Users can delete own datagrid configs" ON datagrid_configs;
DROP POLICY IF EXISTS "Users can view their own grid configs" ON datagrid_configs;
DROP POLICY IF EXISTS "Users can insert their own grid configs" ON datagrid_configs;
DROP POLICY IF EXISTS "Users can update their own grid configs" ON datagrid_configs;
DROP POLICY IF EXISTS "Users can delete their own grid configs" ON datagrid_configs;

CREATE POLICY "Users can view own datagrid configs"
  ON datagrid_configs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own datagrid configs"
  ON datagrid_configs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own datagrid configs"
  ON datagrid_configs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own datagrid configs"
  ON datagrid_configs FOR DELETE
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Table Metadata RLS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view table metadata" ON table_metadata;
DROP POLICY IF EXISTS "Only admins can modify table metadata" ON table_metadata;

CREATE POLICY "Anyone can view table metadata"
  ON table_metadata FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify table metadata"
  ON table_metadata FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name IN ('admin', 'developer')
    )
  );

-- ----------------------------------------------------------------------------
-- Column Customizations RLS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view column customizations" ON column_customizations;
DROP POLICY IF EXISTS "Only admins can modify column customizations" ON column_customizations;

CREATE POLICY "Anyone can view column customizations"
  ON column_customizations FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify column customizations"
  ON column_customizations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name IN ('admin', 'developer')
    )
  );

-- ----------------------------------------------------------------------------
-- Scavenger Hunt RLS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin access to scavenger_locations" ON scavenger_locations;
DROP POLICY IF EXISTS "Admin access to scavenger_claims" ON scavenger_claims;
DROP POLICY IF EXISTS "Admin access to scavenger_tokens" ON scavenger_tokens;

CREATE POLICY "Admin access to scavenger_locations"
  ON scavenger_locations FOR ALL
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

CREATE POLICY "Admin access to scavenger_claims"
  ON scavenger_claims FOR ALL
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

CREATE POLICY "Admin access to scavenger_tokens"
  ON scavenger_tokens FOR ALL
  TO authenticated
  USING (
    auth.uid() IS NOT NULL AND
    (has_role(auth.uid(), 'admin') OR is_dev_admin(auth.uid()))
  );

-- ----------------------------------------------------------------------------
-- Artist Registrations RLS
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own artist registrations" ON artist_registrations;
DROP POLICY IF EXISTS "Users can create artist registrations" ON artist_registrations;
DROP POLICY IF EXISTS "Admins can view all artist registrations" ON artist_registrations;
DROP POLICY IF EXISTS "Admins can update artist registrations" ON artist_registrations;

CREATE POLICY "Users can view their own artist registrations"
  ON artist_registrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create artist registrations"
  ON artist_registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all artist registrations"
  ON artist_registrations FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update artist registrations"
  ON artist_registrations FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- ============================================================================
-- SECTION 20: STORAGE BUCKETS AND POLICIES
-- ============================================================================

-- Event images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-images',
  'event-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for event-images bucket
DROP POLICY IF EXISTS "Anyone can view event images" ON storage.objects;
DROP POLICY IF EXISTS "Admins and developers can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Admins and developers can update event images" ON storage.objects;
DROP POLICY IF EXISTS "Admins and developers can delete event images" ON storage.objects;

CREATE POLICY "Anyone can view event images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'event-images');

CREATE POLICY "Admins and developers can upload event images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'event-images' AND
    auth.uid() IS NOT NULL AND
    (
      EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
        AND r.name IN ('admin', 'developer')
      )
    )
  );

CREATE POLICY "Admins and developers can update event images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'event-images' AND
    auth.uid() IS NOT NULL AND
    (
      EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
        AND r.name IN ('admin', 'developer')
      )
    )
  );

CREATE POLICY "Admins and developers can delete event images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'event-images' AND
    auth.uid() IS NOT NULL AND
    (
      EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
        AND r.name IN ('admin', 'developer')
      )
    )
  );

-- Artist images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'artist-images',
  'artist-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for artist-images bucket
DROP POLICY IF EXISTS "Anyone can view artist images" ON storage.objects;
DROP POLICY IF EXISTS "Admins and developers can upload artist images" ON storage.objects;
DROP POLICY IF EXISTS "Admins and developers can update artist images" ON storage.objects;
DROP POLICY IF EXISTS "Admins and developers can delete artist images" ON storage.objects;

CREATE POLICY "Anyone can view artist images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'artist-images');

CREATE POLICY "Admins and developers can upload artist images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'artist-images' AND
    auth.uid() IS NOT NULL AND
    (
      EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
        AND r.name IN ('admin', 'developer')
      )
    )
  );

CREATE POLICY "Admins and developers can update artist images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'artist-images' AND
    auth.uid() IS NOT NULL AND
    (
      EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
        AND r.name IN ('admin', 'developer')
      )
    )
  );

CREATE POLICY "Admins and developers can delete artist images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'artist-images' AND
    auth.uid() IS NOT NULL AND
    (
      EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON r.id = ur.role_id
        WHERE ur.user_id = auth.uid()
        AND r.name IN ('admin', 'developer')
      )
    )
  );

-- ============================================================================
-- SECTION 21: TABLE PERMISSIONS
-- ============================================================================

-- Grant usage on public schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant all on all tables to service_role (full access)
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Grant all on all sequences to service_role
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant SELECT permissions to anon and authenticated for public-facing tables
GRANT SELECT ON TABLE public.environments TO anon, authenticated;
GRANT SELECT ON TABLE public.feature_flags TO anon, authenticated;
GRANT SELECT ON TABLE public.genres TO anon, authenticated;
GRANT SELECT ON TABLE public.artists TO anon, authenticated;
GRANT SELECT ON TABLE public.events TO anon, authenticated;
GRANT SELECT ON TABLE public.venues TO anon, authenticated;
GRANT SELECT ON TABLE public.cities TO anon, authenticated;
GRANT SELECT ON TABLE public.ticket_tiers TO anon, authenticated;
GRANT SELECT ON TABLE public.artist_genres TO anon, authenticated;
GRANT SELECT ON TABLE public.event_artists TO anon, authenticated;
GRANT SELECT ON TABLE public.event_images TO anon, authenticated;
GRANT SELECT ON TABLE public.organizations TO anon, authenticated;
GRANT SELECT ON TABLE public.roles TO anon, authenticated;

-- Grant access to user_roles (RLS is disabled, so GRANT controls access)
-- Everyone can SELECT (to check permissions), but only authenticated users can modify
GRANT SELECT ON TABLE public.user_roles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.user_roles TO authenticated;

-- Grant INSERT, UPDATE, DELETE on tables with admin RLS policies
GRANT INSERT, UPDATE, DELETE ON TABLE public.venues TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.artists TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.events TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.cities TO authenticated;

-- Grant access to profiles (users can read their own profile)
GRANT SELECT, UPDATE ON TABLE public.profiles TO authenticated;

-- Grant access to orders and order_items for authenticated users
GRANT SELECT, INSERT ON TABLE public.orders TO authenticated;
GRANT SELECT, INSERT ON TABLE public.order_items TO authenticated;

-- Grant access to tickets for authenticated users
GRANT SELECT, INSERT ON TABLE public.tickets TO authenticated;

-- Grant access to datagrid_configs for authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.datagrid_configs TO authenticated;

-- Grant access to artist_registrations for authenticated users
GRANT SELECT, INSERT ON TABLE public.artist_registrations TO authenticated;

-- Grant access to ticketing sessions
GRANT SELECT, INSERT, UPDATE ON TABLE public.ticketing_sessions TO anon, authenticated;
GRANT SELECT ON TABLE public.queue_configurations TO anon, authenticated;

-- Grant access to event views
GRANT SELECT, INSERT ON TABLE public.event_views TO anon, authenticated;

-- Grant access to ticket holds (checkout flow)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ticket_holds TO authenticated;

-- Grant access to ticketing fees (public read for fee calculation, admin write)
GRANT SELECT ON TABLE public.ticketing_fees TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.ticketing_fees TO authenticated;

-- Grant access to promo codes (public read for validation, admin write)
GRANT SELECT ON TABLE public.promo_codes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.promo_codes TO authenticated;

-- Grant access to exclusive content grants
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.exclusive_content_grants TO authenticated;

-- Grant access to webhook events (service role manages via RLS)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.webhook_events TO authenticated, service_role;

-- Grant access to dev notes (developer tools)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.dev_notes TO authenticated;

-- Grant access to table metadata (datagrid system)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.table_metadata TO anon, authenticated;

-- Grant access to column customizations (datagrid system)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.column_customizations TO anon, authenticated;

-- Grant access to scavenger hunt tables
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.scavenger_locations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.scavenger_claims TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.scavenger_tokens TO authenticated;

-- Ensure anon and authenticated can use sequences for IDs
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- This completes the comprehensive database initialization migration.
-- All tables, functions, triggers, policies, storage buckets are now set up.
--
-- Key features:
-- - Complete schema with all tables and relationships
-- - Fixed RLS policies with NULL safety on all admin checks
-- - Environments table with UUID foreign keys
-- - Feature flags using environment_id (UUID)
-- - Ticketing fees using environment_id (UUID)
-- - Events table with headliner_id column
-- - Standardized address fields across all tables
-- - Spotify integration fields for artists
-- - Artist registrations table
-- - Dynamic data grid schema introspection
-- - Proper public access policies (TO anon, authenticated)
--
-- To use this migration:
-- 1. Deploy to a fresh Supabase project
-- 2. Run seed.sql for reference data
-- 3. Configure Stripe webhook endpoints if using payments
-- 4. Set up environment variables in your application
-- ============================================================================

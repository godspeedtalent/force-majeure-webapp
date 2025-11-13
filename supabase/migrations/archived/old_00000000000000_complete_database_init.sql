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
-- Generated: 2025-11-10
-- ============================================================================

-- ============================================================================
-- SECTION 1: EXTENSIONS
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SECTION 2: ENUMS AND CUSTOM TYPES
-- ============================================================================

-- Application role enum
CREATE TYPE app_role AS ENUM (
  'user',
  'admin',
  'developer',
  'org_admin',
  'org_staff'
);

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
-- SECTION 4: CORE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Cities Table
-- ----------------------------------------------------------------------------
CREATE TABLE cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  state TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(name, state)
);

-- Default cities
INSERT INTO cities (name, state) VALUES
  ('Austin', 'TX'),
  ('San Marcos', 'TX');

-- Trigger for updated_at
CREATE TRIGGER update_cities_updated_at
  BEFORE UPDATE ON cities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cities are publicly viewable"
  ON cities FOR SELECT
  TO authenticated, anon
  USING (true);

-- Admin-only write access (will be enabled after roles table is created)

-- ----------------------------------------------------------------------------
-- Organizations Table
-- ----------------------------------------------------------------------------
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  profile_picture TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT organizations_name_not_empty CHECK (char_length(trim(name)) > 0)
);

CREATE INDEX organizations_owner_id_idx ON organizations(owner_id);
CREATE INDEX organizations_name_idx ON organizations(name);

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- RLS policies will be added after profiles table

-- ----------------------------------------------------------------------------
-- Venues Table
-- ----------------------------------------------------------------------------
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  capacity INTEGER,
  image_url TEXT,
  city_id UUID REFERENCES cities(id),
  test_data BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_venues_city_id ON venues(city_id);
CREATE INDEX idx_venues_test_data ON venues(test_data);

CREATE TRIGGER update_venues_updated_at
  BEFORE UPDATE ON venues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

-- RLS policies will be added after role functions

-- ----------------------------------------------------------------------------
-- Events Table
-- ----------------------------------------------------------------------------
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  venue_id UUID REFERENCES venues(id),
  start_time TEXT,
  end_time TEXT,
  is_after_hours BOOLEAN DEFAULT false NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  test_data BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN events.end_time IS 'End time for the event. NULL when is_after_hours is true';
COMMENT ON COLUMN events.is_after_hours IS 'When true, event has no end time (runs past closing/into morning)';
COMMENT ON COLUMN events.test_data IS 'Indicates if this event record was created for testing purposes';

CREATE INDEX events_organization_id_idx ON events(organization_id);
CREATE INDEX idx_events_test_data ON events(test_data);
CREATE INDEX idx_events_venue_id ON events(venue_id);

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- RLS policies will be added after role functions

-- ----------------------------------------------------------------------------
-- Genres Table (with hierarchical support)
-- ----------------------------------------------------------------------------
CREATE TABLE genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  parent_id UUID REFERENCES genres(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_genres_name ON genres(name);
CREATE INDEX idx_genres_parent_id ON genres(parent_id);

CREATE TRIGGER update_genres_updated_at
  BEFORE UPDATE ON genres
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE genres ENABLE ROW LEVEL SECURITY;

-- RLS policies will be added after role functions

-- ----------------------------------------------------------------------------
-- Artists Table
-- ----------------------------------------------------------------------------
CREATE TABLE artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bio TEXT,
  image_url TEXT,
  website TEXT,
  genre TEXT, -- Legacy column, use artist_genres table instead
  test_data BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN artists.test_data IS 'Indicates if this artist record was created for testing purposes';
COMMENT ON COLUMN artists.genre IS 'Legacy column - use artist_genres table for multiple genre support';

CREATE INDEX idx_artists_test_data ON artists(test_data);
CREATE INDEX idx_artists_name ON artists(name);

CREATE TRIGGER update_artists_updated_at
  BEFORE UPDATE ON artists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE artists ENABLE ROW LEVEL SECURITY;

-- RLS policies will be added after role functions

-- ----------------------------------------------------------------------------
-- Artist Genres Junction Table (many-to-many)
-- ----------------------------------------------------------------------------
CREATE TABLE artist_genres (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  genre_id UUID NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(artist_id, genre_id)
);

CREATE INDEX idx_artist_genres_artist_id ON artist_genres(artist_id);
CREATE INDEX idx_artist_genres_genre_id ON artist_genres(genre_id);
CREATE INDEX idx_artist_genres_primary ON artist_genres(artist_id, is_primary) WHERE is_primary = true;

ALTER TABLE artist_genres ENABLE ROW LEVEL SECURITY;

-- RLS policies will be added after role functions

-- ----------------------------------------------------------------------------
-- Event Artists Junction Table
-- ----------------------------------------------------------------------------
CREATE TABLE event_artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, artist_id)
);

CREATE INDEX idx_event_artists_event_id ON event_artists(event_id);
CREATE INDEX idx_event_artists_artist_id ON event_artists(artist_id);

ALTER TABLE event_artists ENABLE ROW LEVEL SECURITY;

-- RLS policies will be added after role functions

-- ============================================================================
-- SECTION 5: USER & ROLE MANAGEMENT
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Profiles Table (extends auth.users)
-- ----------------------------------------------------------------------------
CREATE TABLE profiles (
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
  billing_address TEXT,
  billing_city TEXT,
  billing_state TEXT,
  billing_zip TEXT,
  stripe_customer_id TEXT,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT display_name_length CHECK (char_length(display_name) <= 50),
  CONSTRAINT full_name_length CHECK (char_length(full_name) <= 100),
  CONSTRAINT phone_number_format CHECK (phone_number ~ '^\(\d{3}\) \d{3}-\d{4}$'),
  CONSTRAINT instagram_handle_format CHECK (char_length(instagram_handle) <= 30 AND instagram_handle ~ '^[a-zA-Z0-9._]*$')
);

CREATE INDEX idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
CREATE INDEX idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies will be added after role functions

-- ----------------------------------------------------------------------------
-- Roles Table (new role system)
-- ----------------------------------------------------------------------------
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  is_system_role BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_roles_name ON roles(name);

CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default system roles
INSERT INTO roles (name, display_name, description, is_system_role, permissions) VALUES
  ('user', 'User', 'Standard user with basic access', true, '["view_events", "purchase_tickets", "manage_own_profile"]'::jsonb),
  ('admin', 'Administrator', 'Full system administrator with all permissions', true, '["*"]'::jsonb),
  ('developer', 'Developer', 'Developer access for testing and debugging', true, '["*", "debug_mode", "feature_flags"]'::jsonb),
  ('org_admin', 'Organization Admin', 'Administrator of an organization with venue management access', false, '["manage_organization", "manage_events", "view_analytics", "manage_staff"]'::jsonb),
  ('org_staff', 'Organization Staff', 'Organization staff member with limited permissions', false, '["view_organization", "check_in_guests", "scan_tickets"]'::jsonb);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- User Roles Junction Table
-- ----------------------------------------------------------------------------
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL, -- Legacy column for backwards compatibility
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 6: ROLE & PERMISSION FUNCTIONS
-- ============================================================================

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

-- Get all roles for a user
CREATE OR REPLACE FUNCTION get_user_roles(user_id_param UUID)
RETURNS TABLE (
  role_name TEXT,
  display_name TEXT,
  permissions JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT r.name, r.display_name, r.permissions
  FROM user_roles ur
  JOIN roles r ON r.id = ur.role_id
  WHERE ur.user_id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 7: FEATURE FLAGS
-- ============================================================================

CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  environment TEXT NOT NULL DEFAULT 'all' CHECK (environment IN ('dev', 'prod', 'all')),
  description TEXT,
  disabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(flag_name, environment)
);

CREATE INDEX idx_feature_flags_environment ON feature_flags(environment);
CREATE INDEX idx_feature_flags_flag_name ON feature_flags(flag_name);

CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Dev admin access feature flag check
CREATE OR REPLACE FUNCTION is_dev_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT is_enabled
     FROM feature_flags
     WHERE flag_name = 'dev_admin_access'
       AND (environment = 'dev' OR environment = 'all')
     LIMIT 1),
    false
  )
$$;

-- Insert default feature flags
INSERT INTO feature_flags (flag_name, is_enabled, environment, description) VALUES
  ('dev_admin_access', false, 'dev', 'Grants admin access in development mode'),
  ('spotify_integration', false, 'all', 'Enable Spotify integration features')
ON CONFLICT (flag_name, environment) DO NOTHING;

-- ============================================================================
-- SECTION 8: TICKETING SYSTEM
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Ticket Tiers Table
-- ----------------------------------------------------------------------------
CREATE TABLE ticket_tiers (
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

CREATE INDEX idx_ticket_tiers_event_id ON ticket_tiers(event_id);
CREATE INDEX idx_ticket_tiers_tier_order ON ticket_tiers(tier_order);

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

CREATE TRIGGER check_ticket_tier_inventory
  BEFORE INSERT OR UPDATE ON ticket_tiers
  FOR EACH ROW
  EXECUTE FUNCTION validate_ticket_tier_inventory();

CREATE TRIGGER update_ticket_tiers_updated_at
  BEFORE UPDATE ON ticket_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE ticket_tiers ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Ticket Holds Table (temporary reservations)
-- ----------------------------------------------------------------------------
CREATE TABLE ticket_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_tier_id UUID NOT NULL REFERENCES ticket_tiers(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fingerprint TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ticket_holds_expiry ON ticket_holds(expires_at);
CREATE INDEX idx_ticket_holds_tier ON ticket_holds(ticket_tier_id);
CREATE INDEX idx_ticket_holds_user_id ON ticket_holds(user_id);

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
CREATE TABLE orders (
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_event ON orders(event_id);
CREATE INDEX idx_orders_stripe_session ON orders(stripe_checkout_session_id);
CREATE INDEX idx_orders_status ON orders(status);

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

CREATE TRIGGER check_order_totals
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION validate_order_totals();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Order Items Table
-- ----------------------------------------------------------------------------
CREATE TABLE order_items (
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

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_tier ON order_items(ticket_tier_id);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Tickets Table
-- ----------------------------------------------------------------------------
CREATE TABLE tickets (
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

CREATE INDEX idx_tickets_order ON tickets(order_id);
CREATE INDEX idx_tickets_event ON tickets(event_id);
CREATE INDEX idx_tickets_qr ON tickets(qr_code_data);
CREATE INDEX idx_tickets_status ON tickets(status);

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Ticketing Fees Table
-- ----------------------------------------------------------------------------
CREATE TABLE ticketing_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_name TEXT NOT NULL,
  fee_type TEXT NOT NULL CHECK (fee_type IN ('flat', 'percentage')),
  fee_value NUMERIC NOT NULL CHECK (fee_value >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  environment TEXT NOT NULL DEFAULT 'all',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ticketing_fees_fee_name_environment_key UNIQUE (fee_name, environment)
);

CREATE INDEX idx_ticketing_fees_active ON ticketing_fees(is_active);

CREATE TRIGGER update_ticketing_fees_updated_at
  BEFORE UPDATE ON ticketing_fees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Default fees
INSERT INTO ticketing_fees (fee_name, fee_type, fee_value, is_active) VALUES
  ('sales_tax', 'percentage', 0, true),
  ('processing_fee', 'percentage', 0, true),
  ('platform_fee', 'flat', 0, true);

ALTER TABLE ticketing_fees ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Promo Codes Table
-- ----------------------------------------------------------------------------
CREATE TABLE promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'flat')),
  discount_value NUMERIC NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_promo_codes_code ON promo_codes(code) WHERE is_active = true;

CREATE TRIGGER update_promo_codes_updated_at
  BEFORE UPDATE ON promo_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Test data
INSERT INTO promo_codes (code, discount_type, discount_value) VALUES
  ('FM-50', 'percentage', 50),
  ('FM-5-OFF', 'flat', 5);

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Queue Management Tables
-- ----------------------------------------------------------------------------

-- Ticketing Sessions (queue management)
CREATE TABLE ticketing_sessions (
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

CREATE INDEX idx_ticketing_sessions_event_status ON ticketing_sessions(event_id, status);
CREATE INDEX idx_ticketing_sessions_user_session ON ticketing_sessions(user_session_id);
CREATE INDEX idx_ticketing_sessions_created_at ON ticketing_sessions(created_at);

CREATE TRIGGER update_ticketing_sessions_updated_at
  BEFORE UPDATE ON ticketing_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE ticketing_sessions ENABLE ROW LEVEL SECURITY;

-- Queue Configurations (per-event settings)
CREATE TABLE queue_configurations (
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

CREATE INDEX idx_queue_configurations_event_id ON queue_configurations(event_id);

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
-- SECTION 9: CONTENT & ANALYTICS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Exclusive Content Grants Table
-- ----------------------------------------------------------------------------
CREATE TABLE exclusive_content_grants (
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

CREATE INDEX idx_content_grants_user ON exclusive_content_grants(user_id);
CREATE INDEX idx_content_grants_event ON exclusive_content_grants(event_id);

ALTER TABLE exclusive_content_grants ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Event Views Table (analytics)
-- ----------------------------------------------------------------------------
CREATE TABLE event_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_event_views_event_id ON event_views(event_id);
CREATE INDEX idx_event_views_viewed_at ON event_views(viewed_at DESC);
CREATE INDEX idx_event_views_viewer_id ON event_views(viewer_id);

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
CREATE TABLE event_images (
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

CREATE INDEX idx_event_images_event_id ON event_images(event_id);
CREATE INDEX idx_event_images_is_primary ON event_images(event_id, is_primary);

CREATE TRIGGER update_event_images_updated_at
  BEFORE UPDATE ON event_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE event_images ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 10: INTEGRATIONS & WEBHOOKS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Webhook Events Table (Stripe webhook idempotency)
-- ----------------------------------------------------------------------------
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL
);

CREATE INDEX idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed_at);

ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 11: DEVELOPER TOOLS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Dev Notes Table (TODO tracking)
-- ----------------------------------------------------------------------------
CREATE TABLE dev_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('TODO', 'INFO', 'BUG', 'QUESTION')),
  status TEXT NOT NULL DEFAULT 'TODO' CHECK (status IN ('TODO', 'IN_PROGRESS', 'ARCHIVED', 'RESOLVED', 'CANCELLED'))
);

CREATE INDEX idx_dev_notes_author_id ON dev_notes(author_id);
CREATE INDEX idx_dev_notes_status ON dev_notes(status);
CREATE INDEX idx_dev_notes_type ON dev_notes(type);
CREATE INDEX idx_dev_notes_created_at ON dev_notes(created_at DESC);

CREATE TRIGGER update_dev_notes_updated_at
  BEFORE UPDATE ON dev_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE dev_notes ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- DataGrid Configs Table (user grid preferences)
-- ----------------------------------------------------------------------------
CREATE TABLE datagrid_configs (
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

CREATE INDEX idx_datagrid_configs_user_grid ON datagrid_configs(user_id, grid_id);

CREATE TRIGGER update_datagrid_configs_updated_at
  BEFORE UPDATE ON datagrid_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE datagrid_configs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 12: SCAVENGER HUNT TABLES (minimal schema - inferred)
-- ============================================================================

CREATE TABLE scavenger_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  checkin_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE scavenger_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES scavenger_locations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, location_id)
);

CREATE TABLE scavenger_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  location_id UUID REFERENCES scavenger_locations(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE scavenger_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE scavenger_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE scavenger_tokens ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 13: ADDITIONAL UTILITY FUNCTIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Genre Helper Functions
-- ----------------------------------------------------------------------------

-- Get genre hierarchy (recursive tree)
CREATE OR REPLACE FUNCTION get_genre_hierarchy(genre_id_param UUID)
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
CREATE OR REPLACE FUNCTION get_artist_genres(artist_id_param UUID)
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
CREATE OR REPLACE FUNCTION get_artists_by_genre(
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
-- User Profile Functions
-- ----------------------------------------------------------------------------

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
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Get all users with complete info (admin function)
CREATE OR REPLACE FUNCTION get_all_users_with_email()
RETURNS TABLE (
  id UUID,
  user_id UUID,
  display_name TEXT,
  full_name TEXT,
  gender TEXT,
  age_range TEXT,
  home_city TEXT,
  avatar_url TEXT,
  billing_address TEXT,
  billing_city TEXT,
  billing_state TEXT,
  billing_zip TEXT,
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
  IF NOT (has_role(auth.uid(), 'admin') OR is_dev_admin()) THEN
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
    p.billing_address,
    p.billing_city,
    p.billing_state,
    p.billing_zip,
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

-- Get complete user info (for views)
CREATE OR REPLACE FUNCTION get_all_users()
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

-- ============================================================================
-- SECTION 14: VIEWS
-- ============================================================================

-- Complete user information view
CREATE OR REPLACE VIEW users_complete AS
SELECT * FROM get_all_users();

-- ============================================================================
-- SECTION 15: ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Profiles RLS
-- ----------------------------------------------------------------------------

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR is_dev_admin());

CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR is_dev_admin());

CREATE POLICY "Admins can delete profiles"
  ON profiles FOR DELETE
  USING (has_role(auth.uid(), 'admin') OR is_dev_admin());

-- ----------------------------------------------------------------------------
-- Roles RLS
-- ----------------------------------------------------------------------------

CREATE POLICY "Anyone can view roles"
  ON roles FOR SELECT
  USING (true);

CREATE POLICY "Admins and developers can manage roles"
  ON roles FOR ALL
  USING (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'developer')
    OR is_dev_admin()
  );

-- ----------------------------------------------------------------------------
-- User Roles RLS
-- ----------------------------------------------------------------------------

CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins and developers can view all roles"
  ON user_roles FOR SELECT
  USING (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'developer')
    OR is_dev_admin()
  );

CREATE POLICY "Admins and developers can insert user_roles"
  ON user_roles FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'developer')
    OR is_dev_admin()
  );

CREATE POLICY "Admins and developers can update user_roles"
  ON user_roles FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'developer')
    OR is_dev_admin()
  );

CREATE POLICY "Admins and developers can delete user_roles"
  ON user_roles FOR DELETE
  USING (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'developer')
    OR is_dev_admin()
  );

-- ----------------------------------------------------------------------------
-- Organizations RLS
-- ----------------------------------------------------------------------------

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
-- Feature Flags RLS
-- ----------------------------------------------------------------------------

CREATE POLICY "Anyone can view feature flags"
  ON feature_flags FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert feature flags"
  ON feature_flags FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR is_dev_admin());

CREATE POLICY "Admins can update feature flags"
  ON feature_flags FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR is_dev_admin());

CREATE POLICY "Admins can delete feature flags"
  ON feature_flags FOR DELETE
  USING (has_role(auth.uid(), 'admin') OR is_dev_admin());

-- ----------------------------------------------------------------------------
-- Cities RLS
-- ----------------------------------------------------------------------------

CREATE POLICY "Admins can insert cities"
  ON cities FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin') OR is_dev_admin());

CREATE POLICY "Admins can update cities"
  ON cities FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin') OR is_dev_admin())
  WITH CHECK (has_role(auth.uid(), 'admin') OR is_dev_admin());

CREATE POLICY "Admins can delete cities"
  ON cities FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin') OR is_dev_admin());

-- ----------------------------------------------------------------------------
-- Venues RLS
-- ----------------------------------------------------------------------------

CREATE POLICY "Venues are publicly viewable"
  ON venues FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert venues"
  ON venues FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR is_dev_admin());

CREATE POLICY "Admins can update venues"
  ON venues FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR is_dev_admin())
  WITH CHECK (has_role(auth.uid(), 'admin') OR is_dev_admin());

CREATE POLICY "Admins can delete venues"
  ON venues FOR DELETE
  USING (has_role(auth.uid(), 'admin') OR is_dev_admin());

-- ----------------------------------------------------------------------------
-- Events RLS
-- ----------------------------------------------------------------------------

CREATE POLICY "Events are publicly viewable"
  ON events FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert events"
  ON events FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR is_dev_admin());

CREATE POLICY "Admins can update events"
  ON events FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR is_dev_admin())
  WITH CHECK (has_role(auth.uid(), 'admin') OR is_dev_admin());

CREATE POLICY "Admins can delete events"
  ON events FOR DELETE
  USING (has_role(auth.uid(), 'admin') OR is_dev_admin());

-- ----------------------------------------------------------------------------
-- Genres RLS
-- ----------------------------------------------------------------------------

CREATE POLICY "Anyone can view genres"
  ON genres FOR SELECT
  USING (true);

CREATE POLICY "Admins and developers can manage genres"
  ON genres FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'developer'));

-- ----------------------------------------------------------------------------
-- Artists RLS
-- ----------------------------------------------------------------------------

CREATE POLICY "Artists are publicly viewable"
  ON artists FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert artists"
  ON artists FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR is_dev_admin());

CREATE POLICY "Admins can update artists"
  ON artists FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR is_dev_admin());

CREATE POLICY "Admins can delete artists"
  ON artists FOR DELETE
  USING (has_role(auth.uid(), 'admin') OR is_dev_admin());

-- ----------------------------------------------------------------------------
-- Artist Genres RLS
-- ----------------------------------------------------------------------------

CREATE POLICY "Anyone can view artist genres"
  ON artist_genres FOR SELECT
  USING (true);

CREATE POLICY "Admins and developers can manage artist genres"
  ON artist_genres FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'developer'));

-- ----------------------------------------------------------------------------
-- Event Artists RLS
-- ----------------------------------------------------------------------------

CREATE POLICY "Anyone can view event artists"
  ON event_artists FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage event artists"
  ON event_artists FOR ALL
  USING (has_role(auth.uid(), 'admin') OR is_dev_admin());

-- ----------------------------------------------------------------------------
-- Ticket Tiers RLS
-- ----------------------------------------------------------------------------

CREATE POLICY "Ticket tiers are publicly viewable"
  ON ticket_tiers FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can insert ticket tiers"
  ON ticket_tiers FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR is_dev_admin());

CREATE POLICY "Admins can update ticket tiers"
  ON ticket_tiers FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR is_dev_admin())
  WITH CHECK (has_role(auth.uid(), 'admin') OR is_dev_admin());

CREATE POLICY "Admins can delete ticket tiers"
  ON ticket_tiers FOR DELETE
  USING (has_role(auth.uid(), 'admin') OR is_dev_admin());

-- ----------------------------------------------------------------------------
-- Ticket Holds RLS
-- ----------------------------------------------------------------------------

CREATE POLICY "Users can view their own holds"
  ON ticket_holds FOR SELECT
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can create holds"
  ON ticket_holds FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Admins can update holds"
  ON ticket_holds FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR is_dev_admin());

CREATE POLICY "Admins can delete holds"
  ON ticket_holds FOR DELETE
  USING (has_role(auth.uid(), 'admin') OR is_dev_admin());

-- ----------------------------------------------------------------------------
-- Orders RLS
-- ----------------------------------------------------------------------------

CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own orders"
  ON orders FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR is_dev_admin());

CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR is_dev_admin());

CREATE POLICY "Admins can delete orders"
  ON orders FOR DELETE
  USING (has_role(auth.uid(), 'admin') OR is_dev_admin());

-- ----------------------------------------------------------------------------
-- Order Items RLS
-- ----------------------------------------------------------------------------

CREATE POLICY "Users can view items for their orders"
  ON order_items FOR SELECT
  USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert items for their orders"
  ON order_items FOR INSERT
  WITH CHECK (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all order items"
  ON order_items FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR is_dev_admin());

CREATE POLICY "Admins can update order_items"
  ON order_items FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR is_dev_admin());

CREATE POLICY "Admins can delete order_items"
  ON order_items FOR DELETE
  USING (has_role(auth.uid(), 'admin') OR is_dev_admin());

-- ----------------------------------------------------------------------------
-- Tickets RLS
-- ----------------------------------------------------------------------------

CREATE POLICY "Users can view tickets for their orders"
  ON tickets FOR SELECT
  USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));

CREATE POLICY "Users can update attendee info for their tickets"
  ON tickets FOR UPDATE
  USING (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()))
  WITH CHECK (order_id IN (SELECT id FROM orders WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all tickets"
  ON tickets FOR SELECT
  USING (has_role(auth.uid(), 'admin') OR is_dev_admin());

CREATE POLICY "Admins can insert tickets"
  ON tickets FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR is_dev_admin());

CREATE POLICY "Admins can delete tickets"
  ON tickets FOR DELETE
  USING (has_role(auth.uid(), 'admin') OR is_dev_admin());

-- ----------------------------------------------------------------------------
-- Ticketing Fees RLS
-- ----------------------------------------------------------------------------

CREATE POLICY "Public can view active fees"
  ON ticketing_fees FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can insert fees"
  ON ticketing_fees FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR is_dev_admin());

CREATE POLICY "Admins can update fees"
  ON ticketing_fees FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR is_dev_admin());

CREATE POLICY "Admins can delete fees"
  ON ticketing_fees FOR DELETE
  USING (has_role(auth.uid(), 'admin') OR is_dev_admin());

-- ----------------------------------------------------------------------------
-- Promo Codes RLS
-- ----------------------------------------------------------------------------

CREATE POLICY "Public can view active promo codes"
  ON promo_codes FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "Admins can insert promo codes"
  ON promo_codes FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR is_dev_admin());

CREATE POLICY "Admins can update promo codes"
  ON promo_codes FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR is_dev_admin());

CREATE POLICY "Admins can delete promo codes"
  ON promo_codes FOR DELETE
  USING (has_role(auth.uid(), 'admin') OR is_dev_admin());

-- ----------------------------------------------------------------------------
-- Queue Management RLS
-- ----------------------------------------------------------------------------

CREATE POLICY "Anyone can view ticketing sessions"
  ON ticketing_sessions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create ticketing sessions"
  ON ticketing_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own sessions"
  ON ticketing_sessions FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can view queue configurations"
  ON queue_configurations FOR SELECT
  USING (true);

CREATE POLICY "Admins can create queue configurations"
  ON queue_configurations FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update queue configurations"
  ON queue_configurations FOR UPDATE
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete queue configurations"
  ON queue_configurations FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- ----------------------------------------------------------------------------
-- Content & Analytics RLS
-- ----------------------------------------------------------------------------

CREATE POLICY "Users can view their own content grants"
  ON exclusive_content_grants FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can insert content grants"
  ON exclusive_content_grants FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin') OR is_dev_admin());

CREATE POLICY "Admins can update content grants"
  ON exclusive_content_grants FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR is_dev_admin());

CREATE POLICY "Admins can delete content grants"
  ON exclusive_content_grants FOR DELETE
  USING (has_role(auth.uid(), 'admin') OR is_dev_admin());

CREATE POLICY "Anyone can record event views"
  ON event_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read event views"
  ON event_views FOR SELECT
  USING (true);

CREATE POLICY "Only admins can delete event views"
  ON event_views FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view event images metadata"
  ON event_images FOR SELECT
  USING (true);

CREATE POLICY "Admins and developers can insert event images"
  ON event_images FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'developer')
  );

CREATE POLICY "Admins and developers can update event images"
  ON event_images FOR UPDATE
  USING (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'developer')
  );

CREATE POLICY "Admins and developers can delete event images"
  ON event_images FOR DELETE
  USING (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'developer')
  );

-- ----------------------------------------------------------------------------
-- Webhook Events RLS
-- ----------------------------------------------------------------------------

CREATE POLICY "No direct access to webhooks"
  ON webhook_events FOR SELECT
  USING (false);

CREATE POLICY "Service role can manage webhooks"
  ON webhook_events FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ----------------------------------------------------------------------------
-- Developer Tools RLS
-- ----------------------------------------------------------------------------

CREATE POLICY "Developers can view all dev notes"
  ON dev_notes FOR SELECT
  USING (
    has_role(auth.uid(), 'developer')
    OR has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Developers can create dev notes"
  ON dev_notes FOR INSERT
  WITH CHECK (
    (has_role(auth.uid(), 'developer') OR has_role(auth.uid(), 'admin'))
    AND author_id = auth.uid()
  );

CREATE POLICY "Developers can update their own dev notes"
  ON dev_notes FOR UPDATE
  USING (
    author_id = auth.uid()
    AND (has_role(auth.uid(), 'developer') OR has_role(auth.uid(), 'admin'))
  )
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Developers can delete their own dev notes"
  ON dev_notes FOR DELETE
  USING (
    author_id = auth.uid()
    AND (has_role(auth.uid(), 'developer') OR has_role(auth.uid(), 'admin'))
  );

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
-- Scavenger Hunt RLS (placeholder - admin only for now)
-- ----------------------------------------------------------------------------

CREATE POLICY "Admin access to scavenger_locations"
  ON scavenger_locations FOR ALL
  USING (has_role(auth.uid(), 'admin') OR is_dev_admin());

CREATE POLICY "Admin access to scavenger_claims"
  ON scavenger_claims FOR ALL
  USING (has_role(auth.uid(), 'admin') OR is_dev_admin());

CREATE POLICY "Admin access to scavenger_tokens"
  ON scavenger_tokens FOR ALL
  USING (has_role(auth.uid(), 'admin') OR is_dev_admin());

-- ============================================================================
-- SECTION 16: STORAGE BUCKETS
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
CREATE POLICY "Anyone can view event images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-images');

CREATE POLICY "Admins and developers can upload event images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'event-images' AND
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
-- MIGRATION COMPLETE
-- ============================================================================
--
-- This completes the database initialization migration.
-- All tables, functions, triggers, policies, and storage buckets are now set up.
--
-- To use this migration:
-- 1. Deploy to a fresh Supabase project
-- 2. Run any additional seed data migrations as needed
-- 3. Configure Stripe webhook endpoints
-- 4. Set up environment variables in your application
--
-- ============================================================================

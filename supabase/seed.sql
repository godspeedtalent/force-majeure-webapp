-- ============================================================================
-- Supabase Seed Data
-- ============================================================================
-- This file is automatically run by Supabase after migrations on fresh databases.
-- It contains reference data that should exist in all environments.
--
-- Note: Wrapped in a transaction block with ON CONFLICT to make it safe
-- to run multiple times (idempotent).
-- ============================================================================

BEGIN;

-- ============================================================================
-- GENRES: Complete Electronic Music Genre Hierarchy
-- ============================================================================
-- This creates a comprehensive, hierarchical genre taxonomy for electronic music.
-- Includes 200+ genres from House to Psytrance to Bass Music and everything in between.

-- First, insert all top-level genres (no parent)
INSERT INTO genres (name, parent_id) VALUES
  ('Electronic', NULL)
ON CONFLICT (name) DO NOTHING;

-- Second-level genres (direct children of Electronic)
INSERT INTO genres (name, parent_id)
SELECT name, (SELECT id FROM genres WHERE name = 'Electronic' LIMIT 1)
FROM (VALUES
  ('House'), ('Techno'), ('Trance'),
  ('Drum & Bass'), ('Dubstep'), ('Ambient'),
  ('Downtempo'), ('Breakbeat'), ('Hard Dance'),
  ('Bass Music'), ('Industrial'), ('Electronica'),
  ('Synthwave'), ('IDM'), ('Electro'),
  ('Noise'), ('Disco'), ('Garage'),
  ('Jersey Club'), ('Footwork'), ('Vaporwave'),
  ('Hyperpop'), ('Experimental Electronic')
) AS t(name)
ON CONFLICT (name) DO NOTHING;

-- House subgenres
INSERT INTO genres (name, parent_id)
SELECT name, (SELECT id FROM genres WHERE name = parent_name LIMIT 1)
FROM (VALUES
  ('Deep House', 'House'), ('Tech House', 'House'), ('Progressive House', 'House'),
  ('Electro House', 'House'), ('Big Room House', 'House'), ('Bass House', 'House'),
  ('Future House', 'House'), ('Tropical House', 'House'), ('Melodic House', 'House'),
  ('Minimal House', 'House'), ('Chicago House', 'House'), ('Detroit House', 'House'),
  ('Funky House', 'House'), ('Soulful House', 'House'), ('Jackin House', 'House'),
  ('Acid House', 'House'), ('Tribal House', 'House'), ('Latin House', 'House'),
  ('Afro House', 'House'), ('French House', 'House'), ('Blog House', 'House'),
  ('Future Rave', 'House'), ('Disco House', 'House'), ('Organic House', 'House'),
  ('Fidget House', 'House'), ('Ghetto House', 'House'), ('Slap House', 'House'),
  ('Brazilian Bass', 'House'), ('Ambient House', 'House'), ('Moombahton', 'House')
) AS t(name, parent_name)
ON CONFLICT (name) DO NOTHING;

-- Afro House subgenres
INSERT INTO genres (name, parent_id)
SELECT name, (SELECT id FROM genres WHERE name = 'Afro House' LIMIT 1)
FROM (VALUES
  ('Amapiano'), ('Afro Tech'), ('Gqom'), ('Kwaito')
) AS t(name)
ON CONFLICT (name) DO NOTHING;

-- Latin House subgenres
INSERT INTO genres (name, parent_id)
SELECT name, (SELECT id FROM genres WHERE name = 'Latin House' LIMIT 1)
FROM (VALUES
  ('Guaracha (EDM)')
) AS t(name)
ON CONFLICT (name) DO NOTHING;

-- Moombahton subgenres
INSERT INTO genres (name, parent_id)
SELECT name, (SELECT id FROM genres WHERE name = 'Moombahton' LIMIT 1)
FROM (VALUES
  ('Moombahcore')
) AS t(name)
ON CONFLICT (name) DO NOTHING;

-- Techno subgenres
INSERT INTO genres (name, parent_id)
SELECT name, (SELECT id FROM genres WHERE name = 'Techno' LIMIT 1)
FROM (VALUES
  ('Hard Techno'), ('Melodic Techno'), ('Minimal Techno'),
  ('Industrial Techno'), ('Dub Techno'), ('Ambient Techno'),
  ('Peak Time Techno'), ('Schranz'), ('Ghettotech'),
  ('Acid Techno'), ('Detroit Techno'), ('Berlin Techno'),
  ('Trance Techno'), ('Hardgroove Techno')
) AS t(name)
ON CONFLICT (name) DO NOTHING;

-- Trance and subgenres
INSERT INTO genres (name, parent_id)
SELECT name, (SELECT id FROM genres WHERE name = 'Trance' LIMIT 1)
FROM (VALUES
  ('Progressive Trance'), ('Uplifting Trance'),
  ('Vocal Trance'), ('Tech Trance'),
  ('Psychedelic Trance'), ('Hard Trance'),
  ('Acid Trance'), ('Euro-Trance')
) AS t(name)
ON CONFLICT (name) DO NOTHING;

-- Psychedelic Trance subgenres
INSERT INTO genres (name, parent_id)
SELECT name, (SELECT id FROM genres WHERE name = 'Psychedelic Trance' LIMIT 1)
FROM (VALUES
  ('Goa Trance'), ('Full-On Psytrance'),
  ('Progressive Psytrance'), ('Minimal Psytrance'),
  ('Dark Psytrance'), ('Suomisaundi'),
  ('Hard Psy'), ('Zenonesque'),
  ('Forest Psy'), ('Hi-Tech Psy')
) AS t(name)
ON CONFLICT (name) DO NOTHING;

-- Hard Dance and subgenres
INSERT INTO genres (name, parent_id)
SELECT name, (SELECT id FROM genres WHERE name = 'Hard Dance' LIMIT 1)
FROM (VALUES
  ('Hardstyle'), ('Hardcore'), ('Makina'),
  ('Hardbass'), ('Hard NRG'), ('Jumpstyle'),
  ('Hands Up')
) AS t(name)
ON CONFLICT (name) DO NOTHING;

-- Hardstyle subgenres
INSERT INTO genres (name, parent_id)
SELECT name, (SELECT id FROM genres WHERE name = 'Hardstyle' LIMIT 1)
FROM (VALUES
  ('Euphoric Hardstyle'), ('Rawstyle')
) AS t(name)
ON CONFLICT (name) DO NOTHING;

-- Hardcore subgenres
INSERT INTO genres (name, parent_id)
SELECT name, (SELECT id FROM genres WHERE name = 'Hardcore' LIMIT 1)
FROM (VALUES
  ('Dutch Hardcore'), ('Early Hardcore'),
  ('Mainstream Hardcore'), ('Happy Hardcore'),
  ('UK Hardcore'), ('Frenchcore'), ('Speedcore'),
  ('Freeform Hardcore'), ('Industrial Hardcore')
) AS t(name)
ON CONFLICT (name) DO NOTHING;

-- Speedcore subgenres
INSERT INTO genres (name, parent_id)
SELECT name, (SELECT id FROM genres WHERE name = 'Speedcore' LIMIT 1)
FROM (VALUES
  ('Terrorcore')
) AS t(name)
ON CONFLICT (name) DO NOTHING;

-- Drum & Bass and subgenres
INSERT INTO genres (name, parent_id)
SELECT name, (SELECT id FROM genres WHERE name = 'Drum & Bass' LIMIT 1)
FROM (VALUES
  ('Jungle'), ('Liquid Drum & Bass'),
  ('Neurofunk'), ('Jump-Up Drum & Bass'),
  ('Techstep'), ('Darkstep'),
  ('Atmospheric Drum & Bass'), ('Drumstep'),
  ('Halftime')
) AS t(name)
ON CONFLICT (name) DO NOTHING;

-- Jungle subgenres
INSERT INTO genres (name, parent_id)
SELECT name, (SELECT id FROM genres WHERE name = 'Jungle' LIMIT 1)
FROM (VALUES
  ('Ragga Jungle')
) AS t(name)
ON CONFLICT (name) DO NOTHING;

-- Bass Music and subgenres
INSERT INTO genres (name, parent_id)
SELECT name, (SELECT id FROM genres WHERE name = 'Bass Music' LIMIT 1)
FROM (VALUES
  ('UK Bass'), ('Trap (EDM)'), ('Phonk'),
  ('Drill (UK)'), ('Midtempo Bass'), ('Latin Bass'),
  ('Jungle Terror'), ('Wave'),
  ('Baile Funk'), ('Regional Bass')
) AS t(name)
ON CONFLICT (name) DO NOTHING;

-- Trap (EDM) subgenres
INSERT INTO genres (name, parent_id)
SELECT name, (SELECT id FROM genres WHERE name = 'Trap (EDM)' LIMIT 1)
FROM (VALUES
  ('Festival Trap'), ('Hybrid Trap')
) AS t(name)
ON CONFLICT (name) DO NOTHING;

-- Phonk subgenres
INSERT INTO genres (name, parent_id)
SELECT name, (SELECT id FROM genres WHERE name = 'Phonk' LIMIT 1)
FROM (VALUES
  ('Drift Phonk')
) AS t(name)
ON CONFLICT (name) DO NOTHING;

-- Dubstep and subgenres
INSERT INTO genres (name, parent_id)
SELECT name, (SELECT id FROM genres WHERE name = 'Dubstep' LIMIT 1)
FROM (VALUES
  ('Riddim'), ('Brostep'), ('Chillstep'),
  ('Melodic Dubstep'), ('Post-Dubstep'), ('Trapstep')
) AS t(name)
ON CONFLICT (name) DO NOTHING;

-- Garage and subgenres
INSERT INTO genres (name, parent_id)
SELECT name, (SELECT id FROM genres WHERE name = 'Garage' LIMIT 1)
FROM (VALUES
  ('UK Garage')
) AS t(name)
ON CONFLICT (name) DO NOTHING;

-- UK Garage subgenres
INSERT INTO genres (name, parent_id)
SELECT name, (SELECT id FROM genres WHERE name = 'UK Garage' LIMIT 1)
FROM (VALUES
  ('2-Step'), ('Speed Garage'),
  ('Bassline'), ('Future Garage'), ('UK Funky'),
  ('Grime')
) AS t(name)
ON CONFLICT (name) DO NOTHING;

-- Breakbeat and subgenres
INSERT INTO genres (name, parent_id)
SELECT name, (SELECT id FROM genres WHERE name = 'Breakbeat' LIMIT 1)
FROM (VALUES
  ('Breakbeat Hardcore'), ('Big Beat'),
  ('Nu Skool Breaks'), ('Breakcore'),
  ('Jungle Breaks')
) AS t(name)
ON CONFLICT (name) DO NOTHING;

-- Breakcore subgenres
INSERT INTO genres (name, parent_id)
SELECT name, (SELECT id FROM genres WHERE name = 'Breakcore' LIMIT 1)
FROM (VALUES
  ('Raggacore')
) AS t(name)
ON CONFLICT (name) DO NOTHING;

-- Footwork subgenres
INSERT INTO genres (name, parent_id)
SELECT name, (SELECT id FROM genres WHERE name = 'Footwork' LIMIT 1)
FROM (VALUES
  ('Juke')
) AS t(name)
ON CONFLICT (name) DO NOTHING;

-- Jersey Club subgenres
INSERT INTO genres (name, parent_id)
SELECT name, (SELECT id FROM genres WHERE name = 'Jersey Club' LIMIT 1)
FROM (VALUES
  ('Baltimore Club')
) AS t(name)
ON CONFLICT (name) DO NOTHING;

-- Experimental Electronic subgenres
INSERT INTO genres (name, parent_id)
SELECT name, (SELECT id FROM genres WHERE name = 'Experimental Electronic' LIMIT 1)
FROM (VALUES
  ('Deconstructed Club'),
  ('Electroacoustic')
) AS t(name)
ON CONFLICT (name) DO NOTHING;

-- Downtempo subgenres
INSERT INTO genres (name, parent_id)
SELECT name, (SELECT id FROM genres WHERE name = 'Downtempo' LIMIT 1)
FROM (VALUES
  ('Trip Hop'), ('Chillout')
) AS t(name)
ON CONFLICT (name) DO NOTHING;

-- Ambient subgenres
INSERT INTO genres (name, parent_id)
SELECT name, (SELECT id FROM genres WHERE name = 'Ambient' LIMIT 1)
FROM (VALUES
  ('Psybient'), ('Dark Ambient'), ('Ambient Dub'),
  ('Space Ambient'), ('Drone')
) AS t(name)
ON CONFLICT (name) DO NOTHING;

-- IDM subgenres
INSERT INTO genres (name, parent_id)
SELECT name, (SELECT id FROM genres WHERE name = 'IDM' LIMIT 1)
FROM (VALUES
  ('Glitch')
) AS t(name)
ON CONFLICT (name) DO NOTHING;

-- Glitch subgenres
INSERT INTO genres (name, parent_id)
SELECT name, (SELECT id FROM genres WHERE name = 'Glitch' LIMIT 1)
FROM (VALUES
  ('Glitch Hop'), ('Wonky')
) AS t(name)
ON CONFLICT (name) DO NOTHING;

-- Industrial subgenres
INSERT INTO genres (name, parent_id)
SELECT name, (SELECT id FROM genres WHERE name = 'Industrial' LIMIT 1)
FROM (VALUES
  ('Electro-Industrial'), ('EBM'), ('New Beat')
) AS t(name)
ON CONFLICT (name) DO NOTHING;

-- EBM subgenres
INSERT INTO genres (name, parent_id)
SELECT name, (SELECT id FROM genres WHERE name = 'EBM' LIMIT 1)
FROM (VALUES
  ('Futurepop')
) AS t(name)
ON CONFLICT (name) DO NOTHING;

-- Electronic (misc) subgenres
INSERT INTO genres (name, parent_id)
SELECT name, (SELECT id FROM genres WHERE name = 'Electronic' LIMIT 1)
FROM (VALUES
  ('Witch House'), ('Darkwave'), ('Coldwave'),
  ('Chillwave'), ('Livetronica'),
  ('Folktronica'), ('Nu Jazz')
) AS t(name)
ON CONFLICT (name) DO NOTHING;

-- Nu Jazz subgenres
INSERT INTO genres (name, parent_id)
SELECT name, (SELECT id FROM genres WHERE name = 'Nu Jazz' LIMIT 1)
FROM (VALUES
  ('Jazztronica')
) AS t(name)
ON CONFLICT (name) DO NOTHING;

-- Synthwave subgenres
INSERT INTO genres (name, parent_id)
SELECT name, (SELECT id FROM genres WHERE name = 'Synthwave' LIMIT 1)
FROM (VALUES
  ('Darksynth'), ('Retrowave')
) AS t(name)
ON CONFLICT (name) DO NOTHING;

-- Noise subgenres
INSERT INTO genres (name, parent_id)
SELECT name, (SELECT id FROM genres WHERE name = 'Noise' LIMIT 1)
FROM (VALUES
  ('Power Noise')
) AS t(name)
ON CONFLICT (name) DO NOTHING;

-- Disco subgenres
INSERT INTO genres (name, parent_id)
SELECT name, (SELECT id FROM genres WHERE name = 'Disco' LIMIT 1)
FROM (VALUES
  ('Nu-Disco'), ('Space Disco'), ('Italo Disco'),
  ('Hi-NRG'), ('Eurobeat')
) AS t(name)
ON CONFLICT (name) DO NOTHING;

-- Vaporwave subgenres
INSERT INTO genres (name, parent_id)
SELECT name, (SELECT id FROM genres WHERE name = 'Vaporwave' LIMIT 1)
FROM (VALUES
  ('Future Funk'), ('Hardvapour'), ('Mallsoft'),
  ('Signalwave'), ('Plunderphonics')
) AS t(name)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- ENVIRONMENTS: Required reference data
-- ============================================================================
INSERT INTO environments (name, display_name, description) VALUES
  ('dev', 'Development', 'Local development and testing environment'),
  ('qa', 'QA/Staging', 'Quality assurance and pre-production testing'),
  ('prod', 'Production', 'Live production environment'),
  ('all', 'All Environments', 'Configuration applies to all environments')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- FEATURE FLAGS: Initialize all flags with environment references
-- ============================================================================
INSERT INTO feature_flags (flag_name, is_enabled, environment_id, description)
SELECT 'coming_soon_mode', false, e.id, 'Shows "Coming Soon" page instead of main content'
FROM environments e WHERE e.name = 'all'
ON CONFLICT (flag_name, environment_id) DO NOTHING;

INSERT INTO feature_flags (flag_name, is_enabled, environment_id, description)
SELECT 'demo_pages', CASE WHEN e.name IN ('dev', 'qa') THEN true ELSE false END, e.id, 'Enables access to demo/testing pages'
FROM environments e WHERE e.name IN ('dev', 'qa', 'prod')
ON CONFLICT (flag_name, environment_id) DO NOTHING;

INSERT INTO feature_flags (flag_name, is_enabled, environment_id, description)
SELECT 'event_checkout_timer', false, e.id, 'Shows countdown timer during event checkout'
FROM environments e WHERE e.name = 'all'
ON CONFLICT (flag_name, environment_id) DO NOTHING;

INSERT INTO feature_flags (flag_name, is_enabled, environment_id, description)
SELECT 'scavenger_hunt', false, e.id, 'Enables scavenger hunt feature'
FROM environments e WHERE e.name = 'all'
ON CONFLICT (flag_name, environment_id) DO NOTHING;

INSERT INTO feature_flags (flag_name, is_enabled, environment_id, description)
SELECT 'scavenger_hunt_active', false, e.id, 'Activates current scavenger hunt campaign'
FROM environments e WHERE e.name = 'all'
ON CONFLICT (flag_name, environment_id) DO NOTHING;

INSERT INTO feature_flags (flag_name, is_enabled, environment_id, description)
SELECT 'show_leaderboard', false, e.id, 'Displays scavenger hunt leaderboard'
FROM environments e WHERE e.name = 'all'
ON CONFLICT (flag_name, environment_id) DO NOTHING;

INSERT INTO feature_flags (flag_name, is_enabled, environment_id, description)
SELECT 'member_profiles', false, e.id, 'Enables member profile pages'
FROM environments e WHERE e.name = 'all'
ON CONFLICT (flag_name, environment_id) DO NOTHING;

INSERT INTO feature_flags (flag_name, is_enabled, environment_id, description)
SELECT 'merch_store', false, e.id, 'Enables merchandise store'
FROM environments e WHERE e.name = 'all'
ON CONFLICT (flag_name, environment_id) DO NOTHING;

INSERT INTO feature_flags (flag_name, is_enabled, environment_id, description)
SELECT 'global_search', true, e.id, 'Enables global search functionality'
FROM environments e WHERE e.name = 'all'
ON CONFLICT (flag_name, environment_id) DO NOTHING;

-- ============================================================================
-- ROLES & PERMISSIONS: Default System Roles
-- ============================================================================
-- Create default roles with their permissions
-- Permissions are stored as JSONB arrays in the format: ["permission_name"]
-- Use "*" as a wildcard to grant all permissions

INSERT INTO roles (name, display_name, description, permissions, is_system_role) VALUES
  (
    'admin',
    'Administrator',
    'Full system administrator with all permissions',
    '["*"]'::jsonb,
    true
  ),
  (
    'developer',
    'Developer',
    'Developer access with debugging and development tools',
    '["access_dev_tools", "access_demo_pages", "*"]'::jsonb,
    true
  ),
  (
    'org_admin',
    'Organization Admin',
    'Organization administrator with event and staff management',
    '["manage_organization", "view_organization", "scan_tickets", "manage_events", "manage_venues", "manage_artists"]'::jsonb,
    true
  ),
  (
    'org_staff',
    'Organization Staff',
    'Organization staff with limited access',
    '["view_organization", "scan_tickets"]'::jsonb,
    true
  ),
  (
    'artist',
    'Artist',
    'Approved artist with artist-specific features',
    '[]'::jsonb,
    true
  ),
  (
    'user',
    'User',
    'Standard user with basic access',
    '[]'::jsonb,
    true
  )
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions,
  is_system_role = EXCLUDED.is_system_role;

COMMIT;

-- ============================================================================
-- Seed Complete
-- ============================================================================
-- Successfully seeded:
-- - 200+ electronic music genres with hierarchical relationships
-- - 9 feature flags (all disabled by default)
-- - 5 default system roles (admin, developer, org_admin, org_staff, user)
-- ============================================================================

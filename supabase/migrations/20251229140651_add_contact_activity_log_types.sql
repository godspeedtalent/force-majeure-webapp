-- Migration: Add Contact Activity Log Types
-- Description: Adds 'contact' category and 'contact_submission' event type for logging contact form submissions

-- ============================================================================
-- SECTION 1: ADD NEW ENUM VALUES
-- ============================================================================

-- Add 'contact' to activity_category enum
ALTER TYPE activity_category ADD VALUE IF NOT EXISTS 'contact';

-- Add 'contact_submission' to activity_event_type enum
ALTER TYPE activity_event_type ADD VALUE IF NOT EXISTS 'contact_submission';

-- ============================================================================
-- SECTION 2: COMMENTS
-- ============================================================================

COMMENT ON TYPE activity_category IS 'Categories for activity logs: account, event, artist, venue, recording, ticket_tier, ticket, system, contact';
COMMENT ON TYPE activity_event_type IS 'Event types for activity logs including contact_submission for contact form entries';

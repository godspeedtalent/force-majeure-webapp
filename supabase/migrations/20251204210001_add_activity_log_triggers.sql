-- Migration: Add Activity Log Triggers for CUD Operations
-- Description: Creates triggers to automatically log create, update, delete operations

-- ============================================================================
-- GENERIC TRIGGER FUNCTION FOR RESOURCE CUD OPERATIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION log_resource_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_event_type activity_event_type;
  v_category activity_category;
  v_description TEXT;
  v_resource_name TEXT;
  v_metadata JSONB;
  v_user_id UUID;
  v_resource_id UUID;
BEGIN
  -- Determine event type based on operation
  CASE TG_OP
    WHEN 'INSERT' THEN v_event_type := 'resource_created';
    WHEN 'UPDATE' THEN v_event_type := 'resource_updated';
    WHEN 'DELETE' THEN v_event_type := 'resource_deleted';
  END CASE;

  -- Determine category and resource name based on table
  CASE TG_TABLE_NAME
    WHEN 'events' THEN
      v_category := 'event';
      v_resource_name := COALESCE(NEW.title, OLD.title, 'Unknown Event');
    WHEN 'artists' THEN
      v_category := 'artist';
      v_resource_name := COALESCE(NEW.name, OLD.name, 'Unknown Artist');
    WHEN 'venues' THEN
      v_category := 'venue';
      v_resource_name := COALESCE(NEW.name, OLD.name, 'Unknown Venue');
    WHEN 'artist_recordings' THEN
      v_category := 'recording';
      v_resource_name := COALESCE(NEW.name, OLD.name, 'Unknown Recording');
    WHEN 'ticket_tiers' THEN
      v_category := 'ticket_tier';
      v_resource_name := COALESCE(NEW.name, OLD.name, 'Unknown Tier');
    ELSE
      v_category := 'system';
      v_resource_name := 'Unknown Resource';
  END CASE;

  -- Build description
  v_description := CASE TG_OP
    WHEN 'INSERT' THEN 'Created ' || TG_TABLE_NAME || ': ' || v_resource_name
    WHEN 'UPDATE' THEN 'Updated ' || TG_TABLE_NAME || ': ' || v_resource_name
    WHEN 'DELETE' THEN 'Deleted ' || TG_TABLE_NAME || ': ' || v_resource_name
  END;

  -- Build metadata with before/after state
  CASE TG_OP
    WHEN 'INSERT' THEN
      v_metadata := jsonb_build_object('after', to_jsonb(NEW));
    WHEN 'UPDATE' THEN
      v_metadata := jsonb_build_object(
        'before', to_jsonb(OLD),
        'after', to_jsonb(NEW),
        'changed_fields', (
          SELECT jsonb_object_agg(key, value)
          FROM jsonb_each(to_jsonb(NEW))
          WHERE to_jsonb(OLD) -> key IS DISTINCT FROM value
        )
      );
    WHEN 'DELETE' THEN
      v_metadata := jsonb_build_object('before', to_jsonb(OLD));
  END CASE;

  -- Get current user (may be null for system operations)
  v_user_id := auth.uid();

  -- Get resource ID
  v_resource_id := COALESCE(NEW.id, OLD.id);

  -- Insert the activity log
  INSERT INTO activity_logs (
    event_type,
    category,
    description,
    user_id,
    target_resource_type,
    target_resource_id,
    target_resource_name,
    metadata
  ) VALUES (
    v_event_type,
    v_category,
    v_description,
    v_user_id,
    TG_TABLE_NAME,
    v_resource_id,
    v_resource_name,
    v_metadata
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CREATE TRIGGERS FOR RESOURCE TABLES
-- ============================================================================

-- Events trigger
DROP TRIGGER IF EXISTS log_events_activity ON events;
CREATE TRIGGER log_events_activity
  AFTER INSERT OR UPDATE OR DELETE ON events
  FOR EACH ROW EXECUTE FUNCTION log_resource_activity();

-- Artists trigger
DROP TRIGGER IF EXISTS log_artists_activity ON artists;
CREATE TRIGGER log_artists_activity
  AFTER INSERT OR UPDATE OR DELETE ON artists
  FOR EACH ROW EXECUTE FUNCTION log_resource_activity();

-- Venues trigger
DROP TRIGGER IF EXISTS log_venues_activity ON venues;
CREATE TRIGGER log_venues_activity
  AFTER INSERT OR UPDATE OR DELETE ON venues
  FOR EACH ROW EXECUTE FUNCTION log_resource_activity();

-- Artist Recordings trigger
DROP TRIGGER IF EXISTS log_recordings_activity ON artist_recordings;
CREATE TRIGGER log_recordings_activity
  AFTER INSERT OR UPDATE OR DELETE ON artist_recordings
  FOR EACH ROW EXECUTE FUNCTION log_resource_activity();

-- Ticket Tiers trigger
DROP TRIGGER IF EXISTS log_ticket_tiers_activity ON ticket_tiers;
CREATE TRIGGER log_ticket_tiers_activity
  AFTER INSERT OR UPDATE OR DELETE ON ticket_tiers
  FOR EACH ROW EXECUTE FUNCTION log_resource_activity();

-- ============================================================================
-- ROLE CHANGE TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION log_role_change()
RETURNS TRIGGER AS $$
DECLARE
  v_event_type activity_event_type;
  v_description TEXT;
  v_role_name TEXT;
  v_target_user_email TEXT;
  v_actor_id UUID;
BEGIN
  -- Get role name
  SELECT name INTO v_role_name
  FROM roles
  WHERE id = COALESCE(NEW.role_id, OLD.role_id);

  -- Get target user's email for description
  SELECT email INTO v_target_user_email
  FROM auth.users
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);

  -- Get current user (the admin performing the action)
  v_actor_id := auth.uid();

  IF TG_OP = 'INSERT' THEN
    v_event_type := 'role_assigned';
    v_description := 'Role "' || COALESCE(v_role_name, 'Unknown') || '" assigned to ' || COALESCE(v_target_user_email, 'unknown user');
  ELSE
    v_event_type := 'role_removed';
    v_description := 'Role "' || COALESCE(v_role_name, 'Unknown') || '" removed from ' || COALESCE(v_target_user_email, 'unknown user');
  END IF;

  INSERT INTO activity_logs (
    event_type,
    category,
    description,
    user_id,
    target_resource_type,
    target_resource_id,
    target_resource_name,
    metadata
  ) VALUES (
    v_event_type,
    'account',
    v_description,
    v_actor_id,
    'profile',
    COALESCE(NEW.user_id, OLD.user_id),
    v_target_user_email,
    jsonb_build_object(
      'role_id', COALESCE(NEW.role_id, OLD.role_id),
      'role_name', v_role_name,
      'target_user_id', COALESCE(NEW.user_id, OLD.user_id)
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for role changes
DROP TRIGGER IF EXISTS log_role_changes ON user_roles;
CREATE TRIGGER log_role_changes
  AFTER INSERT OR DELETE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION log_role_change();

-- ============================================================================
-- ACCOUNT CREATION TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION log_account_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_logs (
    event_type,
    category,
    description,
    user_id,
    target_resource_type,
    target_resource_id,
    target_resource_name,
    metadata
  ) VALUES (
    'account_created',
    'account',
    'New account created: ' || COALESCE(NEW.email, NEW.display_name, 'Unknown'),
    NEW.id, -- The new user is their own actor for account creation
    'profile',
    NEW.id,
    COALESCE(NEW.display_name, NEW.email, 'New User'),
    jsonb_build_object(
      'email', NEW.email,
      'display_name', NEW.display_name
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for account creation
DROP TRIGGER IF EXISTS log_account_creation ON profiles;
CREATE TRIGGER log_account_creation
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION log_account_creation();

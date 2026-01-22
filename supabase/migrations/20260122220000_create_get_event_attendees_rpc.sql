-- Create a consolidated RPC to fetch all attendees for an event in one call
-- This replaces 4 separate queries with a single database call to improve performance

-- Drop existing function if exists
DROP FUNCTION IF EXISTS get_event_attendees(uuid);

CREATE OR REPLACE FUNCTION get_event_attendees(p_event_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Build a single JSON result with all attendee types
  WITH
    -- Ticket holders (completed orders with user_id)
    ticket_holders AS (
      SELECT DISTINCT ON (o.user_id)
        o.user_id,
        'ticket_holder' AS attendee_type,
        jsonb_build_object(
          'id', p.id,
          'display_name', p.display_name,
          'full_name', p.full_name,
          'avatar_url', p.avatar_url,
          'guest_list_visible', COALESCE(p.guest_list_visible, true)
        ) AS profile
      FROM orders o
      JOIN profiles p ON p.user_id = o.user_id
      WHERE o.event_id = p_event_id
        AND o.status = 'completed'
        AND o.user_id IS NOT NULL
    ),
    -- RSVP holders (confirmed RSVPs)
    rsvp_holders AS (
      SELECT DISTINCT ON (r.user_id)
        r.user_id,
        'rsvp' AS attendee_type,
        jsonb_build_object(
          'id', p.id,
          'display_name', p.display_name,
          'full_name', p.full_name,
          'avatar_url', p.avatar_url,
          'guest_list_visible', COALESCE(p.guest_list_visible, true)
        ) AS profile
      FROM event_rsvps r
      JOIN profiles p ON p.user_id = r.user_id
      WHERE r.event_id = p_event_id
        AND r.status = 'confirmed'
        -- Exclude users who also have tickets (they'll be in ticket_holders)
        AND NOT EXISTS (
          SELECT 1 FROM orders o
          WHERE o.event_id = p_event_id
            AND o.user_id = r.user_id
            AND o.status = 'completed'
        )
    ),
    -- Interested users
    interested_users AS (
      SELECT DISTINCT ON (i.user_id)
        i.user_id,
        'interested' AS attendee_type,
        jsonb_build_object(
          'id', p.id,
          'display_name', p.display_name,
          'full_name', p.full_name,
          'avatar_url', p.avatar_url,
          'guest_list_visible', COALESCE(p.guest_list_visible, true)
        ) AS profile
      FROM user_event_interests i
      JOIN profiles p ON p.user_id = i.user_id
      WHERE i.event_id = p_event_id
        -- Exclude users who have tickets or RSVPs
        AND NOT EXISTS (
          SELECT 1 FROM orders o
          WHERE o.event_id = p_event_id
            AND o.user_id = i.user_id
            AND o.status = 'completed'
        )
        AND NOT EXISTS (
          SELECT 1 FROM event_rsvps r
          WHERE r.event_id = p_event_id
            AND r.user_id = i.user_id
            AND r.status = 'confirmed'
        )
    ),
    -- Guest ticket holders (anonymous checkouts)
    guest_holders AS (
      SELECT DISTINCT ON (o.guest_id)
        o.guest_id,
        'guest' AS attendee_type,
        jsonb_build_object(
          'id', g.id,
          'full_name', g.full_name,
          'email', g.email
        ) AS guest_info
      FROM orders o
      JOIN guests g ON g.id = o.guest_id
      WHERE o.event_id = p_event_id
        AND o.status = 'completed'
        AND o.guest_id IS NOT NULL
    )
  SELECT jsonb_build_object(
    'ticket_holders', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'userId', user_id::text,
        'profile', profile
      ))
      FROM ticket_holders
    ), '[]'::jsonb),
    'rsvp_holders', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'userId', user_id::text,
        'profile', profile
      ))
      FROM rsvp_holders
    ), '[]'::jsonb),
    'interested_users', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'userId', user_id::text,
        'profile', profile
      ))
      FROM interested_users
    ), '[]'::jsonb),
    'guest_holders', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'guestId', guest_id::text,
        'guest', guest_info
      ))
      FROM guest_holders
    ), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_event_attendees(uuid) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_event_attendees(uuid) IS 'Fetches all attendees for an event in a single call - includes ticket holders, RSVPs, interested users, and guests';

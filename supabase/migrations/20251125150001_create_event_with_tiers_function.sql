-- ============================================================================
-- Service Role Function: Create Event with Ticket Tiers Atomically
-- ============================================================================
--
-- This function provides a server-side alternative for creating events with
-- ticket tiers. It runs with elevated privileges (SECURITY DEFINER) but still
-- validates that the user has appropriate permissions.
--
-- Benefits:
-- - Atomic operation (both succeed or both fail)
-- - Bypasses RLS for the actual INSERT (but validates permissions first)
-- - Simpler error handling
-- - Can be called from client code as fallback
-- ============================================================================

CREATE OR REPLACE FUNCTION create_event_with_tiers(
  -- Event data
  p_event_data jsonb,
  -- Ticket tiers array
  p_ticket_tiers jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER  -- Runs with function owner's privileges
AS $$
DECLARE
  v_user_id uuid;
  v_event_id uuid;
  v_organization_id uuid;
  v_has_permission boolean;
  v_result jsonb;
  v_tier jsonb;
  v_tier_ids uuid[] := ARRAY[]::uuid[];
BEGIN
  -- Get current user
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Extract organization_id from event data
  v_organization_id := (p_event_data->>'organization_id')::uuid;

  IF v_organization_id IS NULL THEN
    RAISE EXCEPTION 'organization_id is required';
  END IF;

  -- Check if user has permission to create events
  -- Allow: admin role, dev_admin flag, or manage_events permission for their org
  SELECT (
    has_role(v_user_id, 'admin') OR
    is_dev_admin(v_user_id) OR
    (
      has_permission(v_user_id, 'manage_events') AND
      EXISTS (
        SELECT 1 FROM profiles
        WHERE user_id = v_user_id
        AND organization_id = v_organization_id
      )
    )
  ) INTO v_has_permission;

  IF NOT v_has_permission THEN
    RAISE EXCEPTION 'Permission denied: user does not have manage_events permission for this organization';
  END IF;

  -- Start transaction (implicit in function, but explicit for clarity)
  -- Insert event
  INSERT INTO events (
    title,
    description,
    date,
    time,
    end_time,
    venue_id,
    organization_id,
    headliner_id,
    status,
    is_tba,
    is_after_hours,
    image_url,
    created_at,
    updated_at
  )
  SELECT
    p_event_data->>'title',
    p_event_data->>'description',
    (p_event_data->>'date')::timestamptz,
    (p_event_data->>'time')::time,
    (p_event_data->>'end_time')::time,
    (p_event_data->>'venue_id')::uuid,
    (p_event_data->>'organization_id')::uuid,
    (p_event_data->>'headliner_id')::uuid,
    COALESCE(p_event_data->>'status', 'draft'),
    COALESCE((p_event_data->>'is_tba')::boolean, false),
    COALESCE((p_event_data->>'is_after_hours')::boolean, false),
    p_event_data->>'image_url',
    NOW(),
    NOW()
  RETURNING id INTO v_event_id;

  -- Insert ticket tiers
  FOR v_tier IN SELECT * FROM jsonb_array_elements(p_ticket_tiers)
  LOOP
    DECLARE
      v_tier_id uuid;
    BEGIN
      INSERT INTO ticket_tiers (
        event_id,
        name,
        description,
        price,
        capacity,
        sales_start,
        sales_end,
        created_at,
        updated_at
      )
      VALUES (
        v_event_id,
        v_tier->>'name',
        v_tier->>'description',
        (v_tier->>'price')::decimal,
        (v_tier->>'capacity')::integer,
        (v_tier->>'sales_start')::timestamptz,
        (v_tier->>'sales_end')::timestamptz,
        NOW(),
        NOW()
      )
      RETURNING id INTO v_tier_id;

      v_tier_ids := array_append(v_tier_ids, v_tier_id);
    END;
  END LOOP;

  -- Build result
  v_result := jsonb_build_object(
    'event_id', v_event_id,
    'tier_ids', to_jsonb(v_tier_ids),
    'success', true
  );

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    -- Re-raise the exception to rollback transaction
    RAISE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_event_with_tiers(jsonb, jsonb) TO authenticated;

-- Add comment
COMMENT ON FUNCTION create_event_with_tiers IS
  'Creates an event with ticket tiers atomically. Validates user permissions before creating. Returns event_id and tier_ids on success.';

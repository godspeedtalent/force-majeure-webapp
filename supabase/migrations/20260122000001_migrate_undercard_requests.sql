-- ============================================================================
-- MIGRATE UNDERCARD REQUESTS TO SCREENING SYSTEM
-- ============================================================================
-- Created: 2026-01-22
-- Purpose: Migrate existing undercard_requests data to new screening_submissions table
-- Note: Run this AFTER 20260122000000_create_screening_system.sql
-- ============================================================================

-- Migrate existing undercard_requests to screening_submissions
DO $$
DECLARE
  v_migrated_count INTEGER := 0;
  v_skipped_count INTEGER := 0;
  v_request RECORD;
  v_resolved_artist_id UUID;
  v_resolved_recording_id UUID;
  v_has_recording_type BOOLEAN;
  v_has_is_primary BOOLEAN;
BEGIN
  RAISE NOTICE 'Starting migration of undercard_requests to screening_submissions...';

  -- Check if undercard_requests table exists and has data
  IF NOT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'undercard_requests'
  ) THEN
    RAISE NOTICE 'undercard_requests table does not exist, skipping migration';
    RETURN;
  END IF;

  -- Check once which columns exist in artist_recordings
  SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'artist_recordings'
    AND column_name = 'recording_type'
  ) INTO v_has_recording_type;

  SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'artist_recordings'
    AND column_name = 'is_primary_dj_set'
  ) INTO v_has_is_primary;

  RAISE NOTICE 'Schema check: recording_type=%, is_primary_dj_set=%', v_has_recording_type, v_has_is_primary;

  FOR v_request IN
    SELECT
      ur.id,
      ur.event_id,
      ur.artist_registration_id,
      ur.status,
      ur.reviewed_by,
      ur.reviewed_at,
      ur.reviewer_notes,
      ur.created_at,
      ur.updated_at
    FROM undercard_requests ur
    ORDER BY ur.created_at
  LOOP
    -- Reset recording_id for each iteration
    v_resolved_recording_id := NULL;

    -- Resolve artist_id from artist_registration_id -> user_id -> artists
    SELECT a.id INTO v_resolved_artist_id
    FROM artist_registrations ar
    JOIN artists a ON a.user_id = ar.user_id
    WHERE ar.id = v_request.artist_registration_id
    LIMIT 1;

    -- Resolve recording_id based on available columns
    IF v_has_is_primary AND v_has_recording_type THEN
      -- Try to get primary DJ set first
      SELECT id INTO v_resolved_recording_id
      FROM artist_recordings
      WHERE artist_id = v_resolved_artist_id
        AND recording_type = 'dj_set'
        AND is_primary_dj_set = true
      LIMIT 1;

      -- If no primary DJ set, get any DJ set
      IF v_resolved_recording_id IS NULL THEN
        SELECT id INTO v_resolved_recording_id
        FROM artist_recordings
        WHERE artist_id = v_resolved_artist_id
          AND recording_type = 'dj_set'
        ORDER BY created_at DESC
        LIMIT 1;
      END IF;
    ELSIF v_has_recording_type THEN
      -- Only recording_type exists, get any DJ set
      SELECT id INTO v_resolved_recording_id
      FROM artist_recordings
      WHERE artist_id = v_resolved_artist_id
        AND recording_type = 'dj_set'
      ORDER BY created_at DESC
      LIMIT 1;
    ELSE
      -- No type filtering, just get any recording
      SELECT id INTO v_resolved_recording_id
      FROM artist_recordings
      WHERE artist_id = v_resolved_artist_id
      ORDER BY created_at DESC
      LIMIT 1;
    END IF;

    -- Skip if we can't resolve both artist and recording
    IF v_resolved_artist_id IS NULL OR v_resolved_recording_id IS NULL THEN
      v_skipped_count := v_skipped_count + 1;
      RAISE NOTICE 'Skipped undercard_request % - could not resolve artist_id (%) or recording_id (%)',
        v_request.id, v_resolved_artist_id, v_resolved_recording_id;
      CONTINUE;
    END IF;

    -- Insert into screening_submissions
    BEGIN
      INSERT INTO screening_submissions (
        artist_id,
        recording_id,
        context_type,
        event_id,
        status,
        decided_by,
        decided_at,
        decision_note,
        created_at,
        updated_at
      ) VALUES (
        v_resolved_artist_id,
        v_resolved_recording_id,
        'event',
        v_request.event_id,
        v_request.status,
        v_request.reviewed_by,
        v_request.reviewed_at,
        v_request.reviewer_notes,
        v_request.created_at,
        COALESCE(v_request.updated_at, v_request.created_at)
      );

      v_migrated_count := v_migrated_count + 1;

    EXCEPTION
      WHEN unique_violation THEN
        -- Skip duplicates silently
        v_skipped_count := v_skipped_count + 1;
        RAISE NOTICE 'Skipped duplicate undercard_request % (artist:%, recording:%, event:%)',
          v_request.id, v_resolved_artist_id, v_resolved_recording_id, v_request.event_id;
      WHEN OTHERS THEN
        -- Log other errors but continue
        v_skipped_count := v_skipped_count + 1;
        RAISE WARNING 'Error migrating undercard_request %: %', v_request.id, SQLERRM;
    END;
  END LOOP;

  RAISE NOTICE 'Migration complete: % migrated, % skipped', v_migrated_count, v_skipped_count;
END $$;

-- Verify migration results (skip if table doesn't exist)
DO $$
DECLARE
  v_old_count INTEGER;
  v_new_count INTEGER;
BEGIN
  -- Check if screening_submissions table exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'screening_submissions'
  ) THEN
    RAISE NOTICE 'screening_submissions table does not exist yet - skipping verification';
    RETURN;
  END IF;

  SELECT COUNT(*) INTO v_old_count FROM undercard_requests;
  SELECT COUNT(*) INTO v_new_count FROM screening_submissions WHERE context_type = 'event';

  RAISE NOTICE 'Verification: % undercard_requests, % event-context screening_submissions',
    v_old_count, v_new_count;

  IF v_new_count = 0 AND v_old_count > 0 THEN
    RAISE WARNING 'No undercard_requests were migrated! Check migration logs above.';
  END IF;
END $$;

-- Add deprecation comment to old table (skip if doesn't exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'undercard_requests'
  ) THEN
    COMMENT ON TABLE undercard_requests IS 'DEPRECATED (2026-01-22): Migrated to screening_submissions with context_type=''event''. Safe to drop after 2026-02-22 (30-day verification period).';
  END IF;
END $$;

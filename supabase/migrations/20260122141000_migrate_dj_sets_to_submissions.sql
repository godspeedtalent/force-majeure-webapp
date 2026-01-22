-- ============================================================================
-- ONE-TIME MIGRATION: DJ Sets to Screening Submissions
-- ============================================================================
-- Created: 2026-01-22
-- Purpose: Migrates all artist_recordings with recording_type='dj_set' to screening_submissions
-- Creates universal "MIGRATED" tag and applies it to all migrated submissions
-- NOTE: This migration is conditional - only runs if recording_type column exists
-- ============================================================================

DO $$
DECLARE
  v_migrated_tag_id UUID;
  v_migrated_count INTEGER := 0;
  v_skipped_count INTEGER := 0;
  v_recording RECORD;
  v_column_exists BOOLEAN;
BEGIN
  -- Check if recording_type column exists in artist_recordings table
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'artist_recordings'
      AND column_name = 'recording_type'
  ) INTO v_column_exists;

  -- Skip migration if column doesn't exist
  IF NOT v_column_exists THEN
    RAISE NOTICE 'Skipping DJ Set migration: recording_type column does not exist in artist_recordings';
    RETURN;
  END IF;

  -- Step 1: Create "MIGRATED" universal tag (if it doesn't exist)
  INSERT INTO tags (name, entity_type, description, created_by)
  VALUES (
    'MIGRATED',
    NULL, -- Universal tag (not entity-specific)
    'Automatically migrated from legacy DJ set recordings',
    NULL  -- System tag, no creator
  )
  ON CONFLICT (name) DO NOTHING
  RETURNING id INTO v_migrated_tag_id;

  -- If tag already existed, fetch its ID
  IF v_migrated_tag_id IS NULL THEN
    SELECT id INTO v_migrated_tag_id FROM tags WHERE name = 'MIGRATED';
  END IF;

  -- Step 2: Migrate DJ sets to submissions
  FOR v_recording IN
    EXECUTE 'SELECT
      ar.id as recording_id,
      ar.artist_id,
      ar.name as recording_name
    FROM artist_recordings ar
    WHERE ar.recording_type = ''dj_set''
    ORDER BY ar.created_at ASC'
  LOOP
    -- Check if submission already exists for this recording
    IF EXISTS (
      SELECT 1 FROM screening_submissions
      WHERE recording_id = v_recording.recording_id
    ) THEN
      v_skipped_count := v_skipped_count + 1;
      CONTINUE;
    END IF;

    -- Insert submission with 'pending' status
    -- General context (not event or venue specific)
    -- No genre mismatch flag for general submissions
    INSERT INTO screening_submissions (
      artist_id,
      recording_id,
      context_type,
      event_id,
      venue_id,
      status,
      has_genre_mismatch
    ) VALUES (
      v_recording.artist_id,
      v_recording.recording_id,
      'general',  -- General discovery queue (not event/venue specific)
      NULL,
      NULL,
      'pending', -- Migrated submissions start as pending for staff review
      false      -- No venue context = no genre mismatch
    );

    -- Tag the submission with MIGRATED tag
    INSERT INTO submission_tags (submission_id, tag_id, tagged_by)
    SELECT
      ss.id,
      v_migrated_tag_id,
      NULL -- System-tagged (no specific user)
    FROM screening_submissions ss
    WHERE ss.recording_id = v_recording.recording_id;

    v_migrated_count := v_migrated_count + 1;
  END LOOP;

  -- Log results
  RAISE NOTICE 'DJ Set Migration Complete:';
  RAISE NOTICE '  - Migrated: % DJ sets', v_migrated_count;
  RAISE NOTICE '  - Skipped (already exist): %', v_skipped_count;
  RAISE NOTICE '  - MIGRATED tag ID: %', v_migrated_tag_id;
END $$;

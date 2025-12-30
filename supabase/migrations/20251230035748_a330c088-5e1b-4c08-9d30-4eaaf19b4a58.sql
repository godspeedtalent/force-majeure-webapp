
-- One-time migration: Import press_images from artist_registrations into media_items
-- This handles cases where artist was created from a registration with additional photos

DO $$
DECLARE
  v_artist RECORD;
  v_registration RECORD;
  v_img_url TEXT;
  v_display_order INTEGER;
BEGIN
  -- Find artists that have galleries and were created from registrations
  FOR v_artist IN
    SELECT a.id, a.name, a.user_id, a.gallery_id, a.image_url
    FROM artists a
    WHERE a.gallery_id IS NOT NULL
      AND a.user_id IS NOT NULL
  LOOP
    -- Find the matching registration
    SELECT * INTO v_registration
    FROM artist_registrations ar
    WHERE ar.user_id = v_artist.user_id
      AND LOWER(ar.artist_name) = LOWER(v_artist.name)
    LIMIT 1;
    
    IF v_registration IS NOT NULL AND v_registration.press_images IS NOT NULL THEN
      -- Get current max display_order for this gallery
      SELECT COALESCE(MAX(display_order), 0) INTO v_display_order
      FROM media_items
      WHERE gallery_id = v_artist.gallery_id;
      
      -- Insert each press image that doesn't already exist
      FOREACH v_img_url IN ARRAY v_registration.press_images
      LOOP
        -- Skip if this image already exists in the gallery
        IF NOT EXISTS (
          SELECT 1 FROM media_items 
          WHERE gallery_id = v_artist.gallery_id 
            AND file_path = v_img_url
        ) THEN
          v_display_order := v_display_order + 1;
          
          INSERT INTO media_items (
            gallery_id,
            file_path,
            media_type,
            is_cover,
            display_order,
            is_active
          ) VALUES (
            v_artist.gallery_id,
            v_img_url,
            'image',
            false,
            v_display_order,
            true
          );
          
          RAISE NOTICE 'Added press image for artist %: %', v_artist.name, v_img_url;
        END IF;
      END LOOP;
    END IF;
  END LOOP;
END;
$$;

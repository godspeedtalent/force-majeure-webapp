-- One-time migration: Create galleries for existing artists and populate with their images

DO $$
DECLARE
  artist_record RECORD;
  v_gallery_id UUID;
  v_slug TEXT;
BEGIN
  -- Loop through all artists without a gallery
  FOR artist_record IN 
    SELECT id, name, image_url 
    FROM artists 
    WHERE gallery_id IS NULL
  LOOP
    -- Generate slug from artist id
    v_slug := 'artist-' || artist_record.id::text;

    -- Create the gallery
    INSERT INTO media_galleries (slug, name, description, allowed_types)
    VALUES (
      v_slug,
      artist_record.name || ' Gallery',
      'Media gallery for ' || artist_record.name,
      '{image}'
    )
    RETURNING id INTO v_gallery_id;

    -- Update artist with gallery reference
    UPDATE artists
    SET gallery_id = v_gallery_id
    WHERE id = artist_record.id;

    -- If artist has an image_url, add it as cover image
    IF artist_record.image_url IS NOT NULL AND artist_record.image_url != '' THEN
      INSERT INTO media_items (
        gallery_id,
        file_path,
        media_type,
        is_cover,
        display_order,
        is_active
      ) VALUES (
        v_gallery_id,
        artist_record.image_url,
        'image',
        true,
        0,
        true
      );
    END IF;
  END LOOP;
END $$;
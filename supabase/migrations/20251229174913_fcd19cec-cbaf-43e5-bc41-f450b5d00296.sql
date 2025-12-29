-- Update the handle_user_request_approval function to actually delete artist data
CREATE OR REPLACE FUNCTION handle_user_request_approval()
RETURNS TRIGGER AS $$
DECLARE
  v_artist_id UUID;
BEGIN
  -- Only process when status changes to 'approved'
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    CASE NEW.request_type
      WHEN 'link_artist' THEN
        -- Link the artist to the user
        UPDATE artists
        SET user_id = NEW.user_id
        WHERE id = (NEW.parameters->>'artist_id')::UUID
        AND user_id IS NULL; -- Only if not already linked

      WHEN 'unlink_artist' THEN
        -- Unlink the artist from the user
        UPDATE artists
        SET user_id = NULL
        WHERE id = (NEW.parameters->>'artist_id')::UUID
        AND user_id = NEW.user_id;

      WHEN 'delete_data' THEN
        -- Get the artist_id from parameters
        v_artist_id := (NEW.parameters->>'artist_id')::UUID;
        
        IF v_artist_id IS NOT NULL THEN
          -- Delete artist recordings first (child records)
          DELETE FROM artist_recordings WHERE artist_id = v_artist_id;
          
          -- Delete artist genre associations
          DELETE FROM artist_genres WHERE artist_id = v_artist_id;
          
          -- Delete event artist associations
          DELETE FROM event_artists WHERE artist_id = v_artist_id;
          
          -- Update events to remove headliner reference
          UPDATE events SET headliner_id = NULL WHERE headliner_id = v_artist_id;
          
          -- Finally delete the artist
          DELETE FROM artists WHERE id = v_artist_id;
        END IF;
    END CASE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
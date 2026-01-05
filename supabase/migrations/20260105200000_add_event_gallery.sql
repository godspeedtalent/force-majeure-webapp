-- Add gallery support to events
-- Each event can have their own media gallery for photos
-- The hero_image column already exists and will be used as the primary/cover image

-- Add gallery_id column to events
alter table events add column if not exists gallery_id uuid references media_galleries(id) on delete set null;

-- Create index for gallery lookup
create index if not exists idx_events_gallery on events(gallery_id);

-- Function to create a gallery for an event
create or replace function create_event_gallery(
  p_event_id uuid,
  p_event_title text
)
returns uuid as $$
declare
  v_gallery_id uuid;
  v_slug text;
begin
  -- Generate slug from event id
  v_slug := 'event-' || p_event_id::text;

  -- Create the gallery
  insert into media_galleries (slug, name, description, allowed_types)
  values (
    v_slug,
    p_event_title || ' Gallery',
    'Media gallery for ' || p_event_title,
    '{image}'
  )
  returning id into v_gallery_id;

  -- Update event with gallery reference
  update events
  set gallery_id = v_gallery_id
  where id = p_event_id;

  return v_gallery_id;
end;
$$ language plpgsql security definer;

-- Grant execute permission
grant execute on function create_event_gallery(uuid, text) to authenticated;

-- Add comment for documentation
comment on column events.gallery_id is 'Reference to the event''s media gallery for photos';
comment on function create_event_gallery is 'Creates a media gallery for an event and links it';
-- Add gallery support to artists
-- Each artist can have their own media gallery for photos

-- Add gallery_id column to artists
alter table artists add column gallery_id uuid references media_galleries(id) on delete set null;

-- Create index for gallery lookup
create index idx_artists_gallery on artists(gallery_id);

-- Function to create a gallery for an artist
create or replace function create_artist_gallery(
  p_artist_id uuid,
  p_artist_name text
)
returns uuid as $$
declare
  v_gallery_id uuid;
  v_slug text;
begin
  -- Generate slug from artist name
  v_slug := 'artist-' || p_artist_id::text;

  -- Create the gallery
  insert into media_galleries (slug, name, description, allowed_types)
  values (
    v_slug,
    p_artist_name || ' Gallery',
    'Media gallery for ' || p_artist_name,
    '{image}'
  )
  returning id into v_gallery_id;

  -- Update artist with gallery reference
  update artists
  set gallery_id = v_gallery_id
  where id = p_artist_id;

  return v_gallery_id;
end;
$$ language plpgsql security definer;

-- Grant execute permission
grant execute on function create_artist_gallery(uuid, text) to authenticated;

-- Add comment for documentation
comment on column artists.gallery_id is 'Reference to the artist''s media gallery for photos';
comment on function create_artist_gallery is 'Creates a media gallery for an artist and links it';

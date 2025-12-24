-- Media Library Tables
-- Provides a flexible system for managing images, videos, and audio
-- organized into galleries that can be referenced by slug

-- Media types enum
create type media_type as enum ('image', 'video', 'audio');

-- Galleries/collections table
create table media_galleries (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  allowed_types media_type[] default '{image}',
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Media items table
create table media_items (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid references media_galleries(id) on delete cascade,
  media_type media_type not null default 'image',

  -- File info
  file_path text not null,
  thumbnail_path text,
  mime_type text,
  file_size_bytes integer,

  -- Dimensions (images/videos)
  width integer,
  height integer,
  duration_seconds integer,

  -- Metadata
  alt_text text,
  title text,
  description text,
  creator text,
  year integer,
  tags text[],

  -- Display
  display_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index idx_media_items_gallery on media_items(gallery_id);
create index idx_media_items_type on media_items(media_type);
create index idx_media_items_active on media_items(is_active) where is_active = true;
create index idx_media_galleries_slug on media_galleries(slug);

-- Updated_at trigger function (reuse if exists)
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_media_galleries_updated_at
  before update on media_galleries
  for each row execute function update_updated_at_column();

create trigger update_media_items_updated_at
  before update on media_items
  for each row execute function update_updated_at_column();

-- RLS policies
alter table media_galleries enable row level security;
alter table media_items enable row level security;

-- Public read access for active galleries and items
create policy "Anyone can view active galleries"
  on media_galleries for select
  using (is_active = true);

create policy "Anyone can view active media items"
  on media_items for select
  using (is_active = true);

-- Admin write access (using has_role function)
create policy "Admins can manage galleries"
  on media_galleries for all
  using (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'developer')
  );

create policy "Admins can manage media items"
  on media_items for all
  using (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'developer')
  );

-- Seed the artist signup carousel gallery
insert into media_galleries (slug, name, description, allowed_types)
values (
  'artist-signup-carousel',
  'Artist Signup Carousel',
  'Showcase images displayed on the artist registration page',
  '{image}'
);

-- Add comment for documentation
comment on table media_galleries is 'Collections of media items that can be referenced by slug';
comment on table media_items is 'Individual media items (images, videos, audio) belonging to galleries';
comment on column media_galleries.slug is 'URL-safe unique identifier used in code to reference this gallery';
comment on column media_items.creator is 'Photographer, videographer, or audio creator credit';

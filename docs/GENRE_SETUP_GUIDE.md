# Genre System Setup Guide

## Overview

A comprehensive hierarchical genre system has been implemented for Force Majeure, with 200+ electronic music genres organized in a parent-child tree structure.

## Setup Instructions

### Step 1: Run the Database Migration

Since you have migration conflicts with `npx supabase db push`, use the manual SQL script instead:

1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/orgxcrnnecblhuxjfruy
2. Go to **SQL Editor**
3. Copy the contents of `supabase/migrations/manual_genres_setup.sql`
4. Paste into SQL Editor
5. Click **Run** or press `Ctrl+Enter`

This script:
- Creates the `genres` table with hierarchical structure
- Seeds all 200+ genres from your list
- Creates `artist_genres` junction table for many-to-many relationships
- Migrates existing text-based genre data
- Sets up helper functions for querying hierarchies
- Is safe to run multiple times (uses `IF NOT EXISTS`)

### Step 2: Update TypeScript Types

After running the migration, generate updated types:

```bash
npx supabase gen types typescript --project-id orgxcrnnecblhuxjfruy > src/shared/api/supabase/types.ts
```

This will add:
- `genres` table types
- `artist_genres` table types
- New RPC function signatures

### Step 3: Verify Setup

Run a quick test query in Supabase SQL Editor:

```sql
-- Check genre count
SELECT COUNT(*) FROM genres;

-- View genre hierarchy (example: House music)
SELECT * FROM get_genre_hierarchy(
  (SELECT id FROM genres WHERE name = 'House')
);

-- Check migrated artist genres
SELECT COUNT(*) FROM artist_genres;
```

## Implementation Structure

### Database Tables

**`genres`**
- `id` (UUID) - Primary key
- `name` (TEXT) - Genre name (unique)
- `parent_id` (UUID) - References parent genre
- `created_at`, `updated_at` (TIMESTAMPTZ)

**`artist_genres`** (Junction Table)
- `id` (UUID) - Primary key
- `artist_id` (UUID) - References artists table
- `genre_id` (UUID) - References genres table
- `is_primary` (BOOLEAN) - Mark one genre as primary
- `created_at` (TIMESTAMPTZ)

### TypeScript Structure

```
src/features/artists/
├── types/
│   └── index.ts         # Genre, Artist, and relationship types
├── services/
│   ├── genreService.ts  # Genre CRUD and hierarchy queries
│   └── artistService.ts # Artist-genre relationship management
├── hooks/
│   ├── useGenres.ts     # React Query hooks for genres
│   └── useArtistGenres.ts # React Query hooks for artist-genre relations
└── index.ts             # Barrel exports
```

### Key Features

#### Hierarchical Queries
- Get all child genres (subgenres) recursively
- Get parent chain for any genre
- Build complete genre tree
- Query artists by genre with optional subgenre inclusion

#### Type-Safe Operations
- All database types properly mapped to TypeScript
- Helper functions for type conversions
- Type guards for runtime checking

#### React Query Integration
- Cached genre data (10-minute stale time)
- Optimistic updates for mutations
- Automatic cache invalidation
- Toast notifications for user feedback

## Usage Examples

### Get All Genres

```typescript
import { useGenres } from '@/features/artists';

function MyComponent() {
  const { data: genres, isLoading } = useGenres();

  return (
    <ul>
      {genres?.map(genre => (
        <li key={genre.id}>{genre.name}</li>
      ))}
    </ul>
  );
}
```

### Get Genre Tree (Hierarchical)

```typescript
import { useGenreTree } from '@/features/artists';

function GenreTree() {
  const { data: tree, isLoading } = useGenreTree();

  // tree.topLevel contains root genres
  // tree.byId for fast lookups
  // Each node has .children array

  return <TreeView nodes={tree?.topLevel} />;
}
```

### Get Artist Genres

```typescript
import { useArtistGenres } from '@/features/artists';

function ArtistProfile({ artistId }: { artistId: string }) {
  const { data: genres } = useArtistGenres(artistId);
  const primaryGenre = genres?.find(g => g.isPrimary);

  return (
    <div>
      <h3>Primary: {primaryGenre?.genre.name}</h3>
      <p>All Genres: {genres?.map(g => g.genre.name).join(', ')}</p>
    </div>
  );
}
```

### Update Artist Genres

```typescript
import { useUpdateArtistGenres } from '@/features/artists';

function EditArtistGenres({ artistId }: { artistId: string }) {
  const updateGenres = useUpdateArtistGenres();

  const handleSave = (selectedGenreIds: string[], primaryGenreId: string) => {
    const selections = selectedGenreIds.map(id => ({
      genreId: id,
      isPrimary: id === primaryGenreId,
    }));

    updateGenres.mutate({ artistId, genreSelections: selections });
  };

  // ... rest of component
}
```

### Search Genres

```typescript
import { useGenreSearch } from '@/features/artists';

function GenreSearch() {
  const [query, setQuery] = useState('');
  const { data: results } = useGenreSearch(query);

  return (
    <input
      type="text"
      value={query}
      onChange={e => setQuery(e.target.value)}
      placeholder="Search genres..."
    />
  );
}
```

### Get Artists by Genre

```typescript
import { useArtistsByGenre } from '@/features/artists';

function GenrePage({ genreId }: { genreId: string }) {
  // includeSubgenres=true means "House" includes "Tech House", "Deep House", etc.
  const { data: artists } = useArtistsByGenre(genreId, true);

  return (
    <div>
      <h2>Artists in this genre</h2>
      {artists?.map(artist => (
        <ArtistCard key={artist.id} artist={artist} />
      ))}
    </div>
  );
}
```

## Component Updates Needed

The following components still use the old text-based `genre` field and should be updated:

1. **[FmCreateArtistButton.tsx](src/components/common/buttons/FmCreateArtistButton.tsx)**
   - Replace text input with genre multi-select
   - Use `useGenreOptions()` for dropdown options
   - Submit genre IDs instead of text

2. **[FmArtistDetailsModal.tsx](src/components/artist/FmArtistDetailsModal.tsx)**
   - Display genres from `artist_genres` table
   - Show primary genre prominently
   - Link to genre hierarchy

3. **[FmArtistRow.tsx](src/components/artist/FmArtistRow.tsx)**
   - Use `useArtistPrimaryGenreName()` hook for display
   - Show genre badges

4. **[ArtistDetails.tsx](src/pages/admin/ArtistDetails.tsx)**
   - Full genre management UI
   - Allow adding/removing genres
   - Set primary genre

5. **Event-related components**
   - [EventDetailsContent.tsx](src/pages/event/EventDetailsContent.tsx)
   - [EventCard.tsx](src/features/events/components/EventCard.tsx)
   - [EventRow.tsx](src/features/events/components/EventRow.tsx)

## Helper Hooks

### `useGenreOptions()`
Returns genres formatted for select components:
```typescript
const { options } = useGenreOptions();
// options = [{ value: 'uuid', label: 'House' }, ...]
```

### `useHierarchicalGenreOptions()`
Returns indented genre tree for dropdowns:
```typescript
const { options } = useHierarchicalGenreOptions();
// options = [
//   { value: 'uuid', label: 'Electronic', level: 0 },
//   { value: 'uuid', label: '  House', level: 1 },
//   { value: 'uuid', label: '    Tech House', level: 2 },
// ]
```

### `useArtistPrimaryGenreName(artistId)`
Quick access to primary genre name for display:
```typescript
const primaryGenre = useArtistPrimaryGenreName(artistId);
// primaryGenre = "Tech House"
```

### `useArtistGenreNames(artistId)`
Comma-separated list of all genres:
```typescript
const genres = useArtistGenreNames(artistId);
// genres = "Tech House, Minimal Techno, Progressive House"
```

## Database Functions

### `get_genre_hierarchy(genre_id)`
Returns all child genres recursively:
```sql
SELECT * FROM get_genre_hierarchy('genre-uuid');
-- Returns: id, name, level
```

### `get_genre_path(genre_id)`
Returns breadcrumb path from root:
```sql
SELECT get_genre_path('genre-uuid');
-- Returns: "Electronic > House > Tech House"
```

### `get_artist_genres(artist_id)`
Returns all genres for an artist:
```sql
SELECT * FROM get_artist_genres('artist-uuid');
-- Returns: genre_id, genre_name, is_primary, parent_genre_id, parent_genre_name
```

### `get_artists_by_genre(genre_id, include_subgenres)`
Returns artists in genre (optionally including subgenres):
```sql
SELECT * FROM get_artists_by_genre('genre-uuid', true);
-- Returns: artist_id, artist_name, artist_image_url, genre_name, is_primary
```

## Migration Notes

- **Backwards Compatibility**: The old `artists.genre` text column is preserved for now
- **Data Migration**: Existing text genres are automatically matched to new genre IDs
- **Case-Insensitive**: Genre matching is case-insensitive
- **Unmatched Genres**: Artists with genres not in the table won't be migrated (check logs)

## Next Steps

1. ✅ Run SQL migration script
2. ✅ Generate updated TypeScript types
3. ⏳ Update `FmCreateArtistButton` to use genre selector
4. ⏳ Update other components to display/edit genres
5. ⏳ Test genre hierarchy queries
6. ⏳ Add genre filtering to artist/event search
7. ⏳ Create genre browse page
8. ⏳ Consider removing old `artists.genre` column after full migration

## Troubleshooting

**Q: Genres not showing up?**
- Check if migration ran successfully: `SELECT COUNT(*) FROM genres`
- Verify RLS policies allow reading: Check Supabase dashboard

**Q: Artist genres not migrated?**
- Check migration output for unmatched genres
- Manually add missing genres or update artist_genres table

**Q: Types not updating?**
- Ensure migration completed before generating types
- Restart TypeScript server in VS Code: `Ctrl+Shift+P` → "Restart TS Server"

**Q: Performance issues with large genre trees?**
- Indexes are automatically created on `parent_id` and `genre_id`
- Use caching with React Query (already configured)
- Consider pagination for very large artist lists

## Resources

- [Supabase Dashboard](https://supabase.com/dashboard/project/orgxcrnnecblhuxjfruy)
- [PostgreSQL Recursive CTEs](https://www.postgresql.org/docs/current/queries-with.html)
- [React Query Docs](https://tanstack.com/query/latest/docs/react/overview)

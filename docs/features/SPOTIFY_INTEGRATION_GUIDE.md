# Spotify Artist Integration Guide

## Overview

The Spotify artist integration allows you to search for artists on Spotify and automatically create artist records in your local database, populated with Spotify metadata (name, bio, image, genres, social links).

## Setup

### 1. Get Spotify API Credentials

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click "Create App"
4. Fill in the app details:
   - **App Name**: Force Majeure (or your choice)
   - **App Description**: Event management platform
   - **Redirect URIs**: Leave empty (we use Client Credentials flow)
5. Accept terms and click "Create"
6. Copy your **Client ID** and **Client Secret**

### 2. Configure Environment Variables

Add your Spotify credentials to `.env`:

```env
VITE_SPOTIFY_CLIENT_ID="your_client_id_here"
VITE_SPOTIFY_CLIENT_SECRET="your_client_secret_here"
```

### 3. Run Database Migration

Apply the migration to add Spotify fields to the artists table:

```bash
npx supabase db push
```

Or if using local Supabase:

```bash
npx supabase migration up
```

## Usage

### Basic Usage

```tsx
import { FmSpotifyArtistSearchDropdown } from '@/components/common/search/FmSpotifyArtistSearchDropdown';

function MyComponent() {
  const handleArtistCreated = (artistId: string, artistName: string) => {
    console.log('Artist created:', { artistId, artistName });
    // Do something with the created artist (e.g., add to event, navigate to profile)
  };

  return (
    <FmSpotifyArtistSearchDropdown
      onArtistCreated={handleArtistCreated}
      placeholder="Search Spotify for artists..."
    />
  );
}
```

### In a Form

```tsx
import { useState } from 'react';
import { FmSpotifyArtistSearchDropdown } from '@/components/common/search/FmSpotifyArtistSearchDropdown';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';

function AddArtistToEventForm({ eventId }: { eventId: string }) {
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [selectedArtistName, setSelectedArtistName] = useState<string>('');

  const handleAddToEvent = async () => {
    if (!selectedArtistId) return;

    // Add artist to event
    await addArtistToEvent(eventId, selectedArtistId);
  };

  return (
    <div className='space-y-[20px]'>
      <FmSpotifyArtistSearchDropdown
        onArtistCreated={(artistId, artistName) => {
          setSelectedArtistId(artistId);
          setSelectedArtistName(artistName);
        }}
        selectedLabel={selectedArtistName || undefined}
      />

      <FmCommonButton
        onClick={handleAddToEvent}
        disabled={!selectedArtistId}
      >
        Add Artist to Event
      </FmCommonButton>
    </div>
  );
}
```

### Advanced: Direct API Usage

If you need more control, you can use the services directly:

```tsx
import { searchSpotifyArtists, getSpotifyArtist } from '@/services/spotify/spotifyApiService';
import { createArtistFromSpotify } from '@/services/spotify/spotifyArtistService';

// Search Spotify
const results = await searchSpotifyArtists('Daft Punk', 10);

// Get detailed artist info
const artist = await getSpotifyArtist('4tZwfgrHOc3mvqYlEYSvVi');

// Create artist in database
const localArtist = await createArtistFromSpotify('4tZwfgrHOc3mvqYlEYSvVi');
```

## Component Props

### FmSpotifyArtistSearchDropdown

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onArtistCreated` | `(artistId: string, artistName: string) => void` | Yes | Callback when artist is created |
| `placeholder` | `string` | No | Placeholder text (default: "Search Spotify for artists...") |
| `disabled` | `boolean` | No | Disable the dropdown |
| `selectedLabel` | `string` | No | Display selected artist name |

## How It Works

1. **User types in search box** → Component calls `searchSpotifyArtists(query)`
2. **Spotify API returns results** → Displayed in dropdown with artist images
3. **User selects an artist** → Component:
   - Checks if artist exists in database (by `spotify_id`)
   - If exists: Returns existing artist ID
   - If new: Creates artist with Spotify data
4. **Artist created** → `onArtistCreated` callback fired with artist ID

## Database Schema

The migration adds these fields to the `artists` table:

```sql
spotify_id TEXT UNIQUE           -- Spotify artist ID (e.g., "4tZwfgrHOc3mvqYlEYSvVi")
spotify_data JSONB               -- Cached metadata (popularity, followers, etc.)
```

### Example spotify_data

```json
{
  "popularity": 78,
  "followers": 1234567,
  "externalUrls": {
    "spotify": "https://open.spotify.com/artist/4tZwfgrHOc3mvqYlEYSvVi"
  },
  "uri": "spotify:artist:4tZwfgrHOc3mvqYlEYSvVi",
  "genres": ["electronic", "french house", "filter house"]
}
```

## Data Hydration

When creating an artist from Spotify, the following fields are populated:

| Database Field | Source | Description |
|----------------|--------|-------------|
| `name` | `artist.name` | Artist name |
| `bio` | Generated | Auto-generated from genres |
| `image_url` | `artist.images[0].url` | Highest quality image |
| `social_links` | `artist.external_urls` | Spotify URL added to social links |
| `spotify_id` | `artist.id` | Spotify artist ID |
| `spotify_data` | Metadata | Cached popularity, followers, etc. |
| `genre` | `artist.genres[0]` | First genre (legacy field) |

## Error Handling

The component handles common errors automatically:

- **Missing credentials**: Toast error with helpful message
- **API failures**: Graceful fallback with error toast
- **Duplicate artists**: Detects existing artists and returns their ID
- **Network issues**: User-friendly error messages

## Best Practices

1. **Always handle `onArtistCreated`**: Use the callback to update your UI or navigate
2. **Show selected state**: Pass `selectedLabel` to show which artist is selected
3. **Disable during operations**: The component auto-disables while creating
4. **Check for duplicates**: The service automatically checks for existing artists
5. **Cache credentials**: Tokens are cached automatically (55 minutes)

## Troubleshooting

### "Spotify API credentials not configured"

- Make sure `VITE_SPOTIFY_CLIENT_ID` and `VITE_SPOTIFY_CLIENT_SECRET` are set in `.env`
- Restart the dev server after adding credentials

### "Spotify authentication failed: 401"

- Verify your Client ID and Client Secret are correct
- Check they haven't expired in the Spotify Dashboard

### "Failed to search Spotify"

- Check your internet connection
- Verify Spotify API is not down: https://status.spotify.com/
- Check browser console for detailed error messages

### No results appearing

- Try a different search query
- Some artists may not be in Spotify's database
- Check the browser console for API errors

## API Reference

### Services

#### spotifyApiService

```ts
// Search for artists
searchSpotifyArtists(query: string, limit?: number): Promise<SpotifyArtist[]>

// Get artist by ID
getSpotifyArtist(artistId: string): Promise<SpotifyArtist>

// Get multiple artists
getSpotifyArtists(artistIds: string[]): Promise<SpotifyArtist[]>

// Clear cached token
clearSpotifyToken(): void
```

#### spotifyArtistService

```ts
// Create artist from Spotify data
createArtistFromSpotify(spotifyId: string): Promise<Artist>

// Refresh existing artist with fresh Spotify data
refreshArtistFromSpotify(artistId: string): Promise<Artist>

// Check if artist exists by Spotify ID
checkArtistExistsBySpotifyId(spotifyId: string): Promise<string | null>
```

## Future Enhancements

Possible improvements for the future:

- Genre mapping: Automatically create genre relationships based on Spotify genres
- Artist syncing: Periodic refresh of artist data from Spotify
- Related artists: Import related/similar artists
- Top tracks: Store artist's top tracks
- Album artwork: Import additional images
- Popularity tracking: Chart popularity changes over time

## Support

For issues or questions:
1. Check the browser console for detailed error logs
2. Verify environment variables are set correctly
3. Ensure database migration was applied successfully
4. Check Spotify Developer Dashboard for API status

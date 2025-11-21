/**
 * FmSpotifyArtistSearchDropdown
 *
 * Search dropdown for Spotify artists. Searches Spotify API in real-time
 * and creates artist records in local database when selected.
 */

import { useState } from 'react';
import { Music } from 'lucide-react';
import { toast } from 'sonner';
import { FmCommonSearchDropdown, SearchDropdownOption } from './FmCommonSearchDropdown';
import { SpotifyIcon } from '@/components/common/icons/SpotifyIcon';
import { searchSpotifyArtists } from '@/services/spotify/spotifyApiService';
import { createArtistFromSpotify, checkArtistExistsBySpotifyId } from '@/services/spotify/spotifyArtistService';
import { logger } from '@/shared/services/logger';

interface FmSpotifyArtistSearchDropdownProps {
  /** Callback when an artist is selected/created */
  onArtistCreated: (artistId: string, artistName: string) => void;
  /** Optional placeholder text */
  placeholder?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Currently selected artist name (for display) */
  selectedLabel?: string;
}

export function FmSpotifyArtistSearchDropdown({
  onArtistCreated,
  placeholder = 'Search Spotify for artists...',
  disabled = false,
  selectedLabel,
}: FmSpotifyArtistSearchDropdownProps) {
  const [isCreating, setIsCreating] = useState(false);

  /**
   * Search Spotify for artists
   */
  const handleSearch = async (query: string): Promise<SearchDropdownOption[]> => {
    try {
      const results = await searchSpotifyArtists(query, 10);

      return results.map(artist => ({
        id: artist.id, // Spotify ID
        label: artist.name,
        icon: artist.images[0] ? (
          <img
            src={artist.images[0].url}
            alt={artist.name}
            className='h-8 w-8 object-cover'
          />
        ) : (
          <div className='h-8 w-8 bg-white/10 flex items-center justify-center'>
            <Music className='h-4 w-4 text-white/50' />
          </div>
        ),
      }));
    } catch (error) {
      logger.error('Failed to search Spotify artists', { error });
      toast.error('Failed to search Spotify. Please check your API credentials.');
      return [];
    }
  };

  /**
   * Handle artist selection - create in database if needed
   */
  const handleSelect = async (spotifyId: string, artistName?: string) => {
    if (isCreating) return;

    setIsCreating(true);

    try {
      // Check if artist already exists
      const existingArtistId = await checkArtistExistsBySpotifyId(spotifyId);

      if (existingArtistId) {
        logger.info('Artist already exists', { spotifyId, artistId: existingArtistId });
        toast.success(`Artist "${artistName}" already exists in database`);
        onArtistCreated(existingArtistId, artistName || 'Unknown Artist');
        return;
      }

      // Create new artist from Spotify data
      const artist = await createArtistFromSpotify(spotifyId);

      logger.info('Artist created from Spotify', {
        spotifyId,
        artistId: artist.id,
        name: artist.name,
      });

      toast.success(`Artist "${artist.name}" added from Spotify`);
      onArtistCreated(artist.id, artist.name);
    } catch (error) {
      logger.error('Failed to create artist from Spotify', { error, spotifyId });
      toast.error('Failed to add artist. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <FmCommonSearchDropdown
      onChange={handleSelect}
      onSearch={handleSearch}
      placeholder={placeholder}
      disabled={disabled || isCreating}
      selectedLabel={isCreating ? 'Adding artist...' : selectedLabel}
      typeIcon={<SpotifyIcon className='h-3 w-3 text-[#1DB954]' />}
      typeTooltip='Spotify Artist'
    />
  );
}

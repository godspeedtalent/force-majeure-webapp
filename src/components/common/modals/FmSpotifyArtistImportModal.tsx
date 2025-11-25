/**
 * FmSpotifyArtistImportModal
 *
 * Modal for importing an artist from Spotify.
 * Allows user to search Spotify, select an artist, and preview/create the artist record.
 */

import { useState } from 'react';
import { Music, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FmCommonModal } from './FmCommonModal';
import { FmSpotifyArtistSearchDropdown } from '@/components/common/search/FmSpotifyArtistSearchDropdown';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { getSpotifyArtist } from '@/services/spotify/spotifyApiService';
import { createArtistFromSpotify } from '@/services/spotify/spotifyArtistService';
import { logger } from '@/shared/services/logger';
import { toast } from 'sonner';

interface FmSpotifyArtistImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ArtistPreview {
  spotifyId: string;
  name: string;
  imageUrl: string | null;
  bio: string;
  genres: string[];
}

export function FmSpotifyArtistImportModal({
  open,
  onOpenChange,
}: FmSpotifyArtistImportModalProps) {
  const navigate = useNavigate();
  const [selectedSpotifyId, setSelectedSpotifyId] = useState<string | null>(null);
  const [artistPreview, setArtistPreview] = useState<ArtistPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  /**
   * Handle artist selection from Spotify search
   */
  const handleArtistSelected = async (spotifyId: string) => {
    setSelectedSpotifyId(spotifyId);
    setIsLoadingPreview(true);

    try {
      // Fetch full artist data from Spotify
      const spotifyArtist = await getSpotifyArtist(spotifyId);

      // Get the best quality image (largest)
      const imageUrl =
        spotifyArtist.images.length > 0
          ? spotifyArtist.images.sort((a, b) => (b.width || 0) - (a.width || 0))[0].url
          : null;

      // Create bio from genres and popularity
      const genresText =
        spotifyArtist.genres.length > 0
          ? spotifyArtist.genres.slice(0, 3).join(', ')
          : 'Various genres';
      const bio = `${spotifyArtist.name} is an artist known for ${genresText}.`;

      setArtistPreview({
        spotifyId,
        name: spotifyArtist.name,
        imageUrl,
        bio,
        genres: spotifyArtist.genres,
      });
    } catch (error) {
      logger.error('Failed to fetch artist preview from Spotify', { error, spotifyId });
      toast.error('Failed to load artist preview');
      setSelectedSpotifyId(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  /**
   * Create artist in database and navigate to edit page
   */
  const handleCreate = async () => {
    if (!selectedSpotifyId || !artistPreview) return;

    setIsCreating(true);

    try {
      const artist = await createArtistFromSpotify(selectedSpotifyId);

      logger.info('Artist imported from Spotify successfully', {
        spotifyId: selectedSpotifyId,
        artistId: artist.id,
        name: artist.name,
      });

      toast.success(`Artist "${artist.name}" imported successfully`);

      // Navigate to artist edit page
      navigate(`/admin/artists/${artist.id}/edit`);

      // Close modal
      onOpenChange(false);

      // Reset state
      setSelectedSpotifyId(null);
      setArtistPreview(null);
    } catch (error) {
      logger.error('Failed to import artist from Spotify', { error, spotifyId: selectedSpotifyId });
      toast.error('Failed to import artist. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    setSelectedSpotifyId(null);
    setArtistPreview(null);
    onOpenChange(false);
  };

  return (
    <FmCommonModal
      open={open}
      onOpenChange={onOpenChange}
      title='Import Artist from Spotify'
      description='Search for an artist on Spotify and import their profile data.'
    >
      <div className='space-y-[40px]'>
        {/* Spotify Search */}
        <div>
          <label className='block text-xs uppercase tracking-wider text-muted-foreground mb-[10px] font-canela'>
            Search Spotify
          </label>
          <FmSpotifyArtistSearchDropdown
            onArtistCreated={handleArtistSelected}
            placeholder='Search for an artist on Spotify...'
            disabled={isCreating}
          />
        </div>

        {/* Loading State */}
        {isLoadingPreview && (
          <div className='flex items-center justify-center py-[60px]'>
            <Loader2 className='h-8 w-8 animate-spin text-fm-gold' />
          </div>
        )}

        {/* Artist Preview */}
        {artistPreview && !isLoadingPreview && (
          <div className='space-y-[20px] border border-white/20 rounded-none p-[20px] bg-black/40 backdrop-blur-sm'>
            <h3 className='text-sm uppercase tracking-wider text-fm-gold font-canela'>
              Artist Preview
            </h3>

            <div className='flex gap-[20px]'>
              {/* Artist Image */}
              {artistPreview.imageUrl ? (
                <img
                  src={artistPreview.imageUrl}
                  alt={artistPreview.name}
                  className='h-24 w-24 object-cover border border-white/20'
                />
              ) : (
                <div className='h-24 w-24 bg-white/10 flex items-center justify-center border border-white/20'>
                  <Music className='h-12 w-12 text-white/50' />
                </div>
              )}

              {/* Artist Details */}
              <div className='flex-1 space-y-[10px]'>
                <div>
                  <p className='text-xs uppercase tracking-wider text-muted-foreground font-canela'>
                    Name
                  </p>
                  <p className='text-base font-canela'>{artistPreview.name}</p>
                </div>

                {artistPreview.genres.length > 0 && (
                  <div>
                    <p className='text-xs uppercase tracking-wider text-muted-foreground font-canela'>
                      Genres
                    </p>
                    <p className='text-sm font-canela text-white/80'>
                      {artistPreview.genres.slice(0, 5).join(', ')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Bio Preview */}
            <div>
              <p className='text-xs uppercase tracking-wider text-muted-foreground font-canela mb-[5px]'>
                Bio (auto-generated)
              </p>
              <p className='text-sm font-canela text-white/80'>{artistPreview.bio}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className='flex gap-[10px] justify-end pt-[20px] border-t border-white/20'>
          <FmCommonButton
            type='button'
            variant='secondary'
            onClick={handleCancel}
            disabled={isCreating}
          >
            Cancel
          </FmCommonButton>
          <FmCommonButton
            type='button'
            variant='default'
            onClick={handleCreate}
            disabled={!artistPreview || isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Artist'}
          </FmCommonButton>
        </div>
      </div>
    </FmCommonModal>
  );
}

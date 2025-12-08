import { useState } from 'react';
import { FaSpotify, FaSoundcloud } from 'react-icons/fa6';
import { toast } from 'sonner';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmGenreMultiSelect } from '@/features/artists/components/FmGenreMultiSelect';
import { SpotifyArtistImport } from '@/components/spotify/SpotifyArtistImport';
import { SoundCloudUserImport, type SoundCloudUserData } from '@/components/soundcloud/SoundCloudUserImport';
import { getArtistTopTracks, type SpotifyArtist } from '@/services/spotify/spotifyApiService';
import { getArtistPopularTrack } from '@/services/soundcloud/soundcloudApiService';
import { logger } from '@force-majeure/shared/services/logger';
import type { ArtistRegistrationFormData, RegistrationTrack } from '../../types/registration';
import type { Genre } from '@/features/artists/types';

interface BasicDetailsStepProps {
  formData: ArtistRegistrationFormData;
  onInputChange: (field: keyof ArtistRegistrationFormData, value: any) => void;
  onNext: () => void;
}

export function BasicDetailsStep({
  formData,
  onInputChange,
  onNext,
}: BasicDetailsStepProps) {
  const [showSpotifyImport, setShowSpotifyImport] = useState(false);
  const [showSoundCloudImport, setShowSoundCloudImport] = useState(false);

  const handleSpotifyImport = async (artist: SpotifyArtist) => {
    onInputChange('stageName', artist.name);
    // Use the largest image for profile
    if (artist.images.length > 0) {
      onInputChange('profileImageUrl', artist.images[0].url);
    }
    // Set Spotify URL
    onInputChange('spotifyUrl', artist.external_urls.spotify);

    // Fetch and add top track
    try {
      const topTracks = await getArtistTopTracks(artist.id);
      if (topTracks.length > 0) {
        const topTrack = topTracks[0];
        const newTrack: RegistrationTrack = {
          id: crypto.randomUUID(),
          name: topTrack.name,
          url: topTrack.external_urls.spotify,
          coverArt: topTrack.album.images[0]?.url,
          platform: 'spotify',
          recordingType: 'track',
        };
        // Add to existing tracks (don't overwrite)
        onInputChange('tracks', [...formData.tracks, newTrack]);
        toast.success(`Added "${topTrack.name}" to your recordings`);
      }
    } catch (error) {
      logger.error('Failed to fetch top track from Spotify', { error, artistId: artist.id });
      // Don't show error toast - profile import still succeeded
    }
  };

  const handleSoundCloudImport = async (user: SoundCloudUserData) => {
    onInputChange('stageName', user.name);
    if (user.avatarUrl) {
      onInputChange('profileImageUrl', user.avatarUrl);
    }
    if (user.description) {
      onInputChange('bio', user.description);
    }
    // Set SoundCloud URL
    onInputChange('soundcloudUrl', user.profileUrl);

    // Try to fetch a popular track
    try {
      const popularTrack = await getArtistPopularTrack(user.profileUrl);
      if (popularTrack) {
        const newTrack: RegistrationTrack = {
          id: crypto.randomUUID(),
          name: popularTrack.name,
          url: popularTrack.url,
          coverArt: popularTrack.coverArt,
          platform: 'soundcloud',
          recordingType: 'track',
        };
        // Add to existing tracks (don't overwrite)
        onInputChange('tracks', [...formData.tracks, newTrack]);
        toast.success(`Added "${popularTrack.name}" to your recordings`);
      }
    } catch (error) {
      logger.error('Failed to fetch popular track from SoundCloud', { error, profileUrl: user.profileUrl });
      // Don't show error toast - profile import still succeeded
    }
  };

  return (
    <div className='h-full flex flex-col p-[20px]'>
      <div className='flex-1 overflow-y-auto pr-[10px]'>
        <div className='flex justify-center items-start'>
          <div className='w-[85vw] sm:w-[80%] space-y-[20px] bg-black/60 backdrop-blur-sm border border-white/10 p-[30px] sm:p-[40px]'>
            <div>
              <h2 className='font-canela text-3xl mb-[10px]'>
                Tell us about your sound.
              </h2>
              <p className='font-canela text-sm text-muted-foreground'>
                Share your stage name, bio, and musical style.
              </p>
            </div>

            {/* OAuth-style Import Buttons */}
            <div className='flex flex-col gap-[10px] max-w-[65vw] mx-auto'>
              <button
                type='button'
                onClick={() => setShowSpotifyImport(true)}
                className='flex items-center justify-center gap-[10px] px-[20px] py-[12px] bg-transparent hover:bg-[#1DB954]/10 border-2 border-[#1DB954] text-[#1DB954] font-canela text-sm font-medium transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]'
              >
                <FaSpotify className='h-5 w-5' />
                Continue with Spotify
              </button>
              <button
                type='button'
                onClick={() => setShowSoundCloudImport(true)}
                className='flex items-center justify-center gap-[10px] px-[20px] py-[12px] bg-transparent hover:bg-[#FF5500]/10 border-2 border-[#FF5500] text-[#FF5500] font-canela text-sm font-medium transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]'
              >
                <FaSoundcloud className='h-5 w-5' />
                Continue with SoundCloud
              </button>
            </div>

            <div className='w-full h-[1px] bg-gradient-to-r from-fm-gold via-white/30 to-transparent' />

            <div className='space-y-[20px]'>
              <FmCommonTextField
                label='Stage Name'
                required
                value={formData.stageName}
                onChange={e => onInputChange('stageName', e.target.value)}
                placeholder='Your artist or DJ name'
              />

              <FmCommonTextField
                label='Bio'
                required
                value={formData.bio}
                onChange={e => onInputChange('bio', e.target.value)}
                placeholder='Tell us about your musical journey, style, and influences...'
                multiline
                rows={6}
              />

              <FmCommonTextField
                label='City'
                required
                value={formData.city}
                onChange={e => onInputChange('city', e.target.value)}
                placeholder='Where are you based? (e.g., Los Angeles, CA)'
              />

              <div className='w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent' />

              <FmGenreMultiSelect
                label='Genres'
                required
                selectedGenres={formData.genres}
                onChange={(genres: Genre[]) => onInputChange('genres', genres)}
                maxGenres={5}
              />
            </div>
          </div>
        </div>
      </div>

      <div className='flex justify-end pt-[20px] border-t border-white/10 flex-shrink-0'>
        <FmCommonButton onClick={onNext} variant='default'>
          Next
        </FmCommonButton>
      </div>

      {/* Import Modals */}
      <SpotifyArtistImport
        open={showSpotifyImport}
        onClose={() => setShowSpotifyImport(false)}
        onImport={handleSpotifyImport}
      />
      <SoundCloudUserImport
        open={showSoundCloudImport}
        onClose={() => setShowSoundCloudImport(false)}
        onImport={handleSoundCloudImport}
      />
    </div>
  );
}

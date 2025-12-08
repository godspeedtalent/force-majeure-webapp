import { ChevronLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { TrackInputForm, TrackList, type TrackFormData } from '@/features/artists/components/TrackInputForm';
import type { ArtistRegistrationFormData, RegistrationTrack } from '../../types/registration';
import { cn } from '@/shared/utils/utils';

interface MusicStepProps {
  formData: ArtistRegistrationFormData;
  onInputChange: (field: keyof ArtistRegistrationFormData, value: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function MusicStep({
  formData,
  onInputChange,
  onNext,
  onPrevious,
}: MusicStepProps) {
  // Check if we have at least one DJ Set
  const hasDjSet = formData.tracks.some(t => t.recordingType === 'dj_set');
  const djSetCount = formData.tracks.filter(t => t.recordingType === 'dj_set').length;
  const trackCount = formData.tracks.filter(t => t.recordingType === 'track').length;

  const handleAddTrack = (track: TrackFormData) => {
    const newTrack: RegistrationTrack = {
      id: track.id,
      name: track.name,
      url: track.url,
      coverArt: track.coverArt,
      platform: track.platform,
      recordingType: track.recordingType,
    };
    onInputChange('tracks', [...formData.tracks, newTrack]);
  };

  const handleRemoveTrack = (trackId: string) => {
    onInputChange('tracks', formData.tracks.filter(t => t.id !== trackId));
  };

  return (
    <div className='h-full flex flex-col p-[20px]'>
      <div className='flex-1 overflow-y-auto pr-[10px]'>
        <div className='flex justify-center items-start'>
          <div className='w-[85vw] sm:w-[80%] space-y-[20px] bg-black/60 backdrop-blur-sm border border-white/10 p-[30px] sm:p-[40px]'>
            <div>
              <h2 className='font-canela text-3xl mb-[10px]'>Show us your music.</h2>
              <p className='font-canela text-sm text-muted-foreground'>
                Add your recordings from Spotify or SoundCloud. At least one DJ Set is required.
              </p>
            </div>

            {/* Requirement Indicator */}
            <div className={cn(
              'flex items-center gap-[10px] px-[20px] py-[10px] border',
              hasDjSet
                ? 'border-green-500/30 bg-green-500/10 text-green-400'
                : 'border-fm-gold/30 bg-fm-gold/10 text-fm-gold'
            )}>
              {hasDjSet ? (
                <CheckCircle className='h-4 w-4' />
              ) : (
                <AlertCircle className='h-4 w-4' />
              )}
              <span className='text-sm font-canela'>
                {hasDjSet
                  ? `DJ Set requirement met (${djSetCount} DJ Set${djSetCount > 1 ? 's' : ''}${trackCount > 0 ? `, ${trackCount} Track${trackCount > 1 ? 's' : ''}` : ''})`
                  : 'You need to add at least one DJ Set recording'}
              </span>
            </div>

            <div className='w-full h-[1px] bg-gradient-to-r from-fm-gold via-white/30 to-transparent' />

            {/* Added Tracks List */}
            <TrackList
              tracks={formData.tracks}
              onRemoveTrack={handleRemoveTrack}
            />

            {/* Add Track Form */}
            <TrackInputForm
              onAddTrack={handleAddTrack}
              submitButtonText="Add Recording"
            />
          </div>
        </div>
      </div>

      <div className='flex justify-between pt-[20px] border-t border-white/10 flex-shrink-0'>
        <FmCommonButton onClick={onPrevious} variant='secondary'>
          <ChevronLeft className='h-4 w-4 mr-[10px]' />
          Previous
        </FmCommonButton>
        <FmCommonButton onClick={onNext} variant='default'>
          Next
        </FmCommonButton>
      </div>
    </div>
  );
}

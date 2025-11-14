import { ChevronLeft } from 'lucide-react';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import type { ArtistRegistrationFormData } from '../../types/registration';

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
  return (
    <div className='h-full flex flex-col p-[20px]'>
      <div className='flex-1 overflow-y-auto pr-[10px]'>
        <div className='flex justify-center'>
          <div className='w-[60%] space-y-[20px]'>
            <div>
              <h2 className='font-canela text-3xl mb-[10px]'>Show us your music.</h2>
              <p className='font-canela text-sm text-muted-foreground'>
                Share samples of your work so we can hear your sound.
              </p>
            </div>

            <div className='w-full h-[1px] bg-gradient-to-r from-fm-gold via-white/30 to-transparent' />

            <div className='space-y-[20px]'>
              <FmCommonTextField
                label='SoundCloud Sample Set'
                required
                value={formData.soundcloudSetUrl}
                onChange={e => onInputChange('soundcloudSetUrl', e.target.value)}
                placeholder='https://soundcloud.com/you/sets/your-sample-set'
              />
              <p className='font-canela text-xs text-muted-foreground -mt-[10px]'>
                A full set or mix showcasing your style is required.
              </p>

              <div className='w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent' />

              <FmCommonTextField
                label='Spotify Track (Optional)'
                value={formData.spotifyTrackUrl}
                onChange={e => onInputChange('spotifyTrackUrl', e.target.value)}
                placeholder='https://open.spotify.com/track/...'
              />
              <p className='font-canela text-xs text-muted-foreground -mt-[10px]'>
                Share a representative track if you have music on Spotify.
              </p>
            </div>
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

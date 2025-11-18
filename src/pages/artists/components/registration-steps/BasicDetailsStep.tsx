import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmGenreMultiSelect } from '@/features/artists/components/FmGenreMultiSelect';
import type { ArtistRegistrationFormData } from '../../types/registration';
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
  return (
    <div className='h-full flex flex-col p-[20px]'>
      <div className='flex-1 overflow-y-auto pr-[10px]'>
        <div className='flex justify-center'>
          <div className='w-[60%] space-y-[20px]'>
            <div>
              <h2 className='font-canela text-3xl mb-[10px]'>
                Tell us about your sound.
              </h2>
              <p className='font-canela text-sm text-muted-foreground'>
                Share your stage name, bio, and musical style.
              </p>
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
    </div>
  );
}

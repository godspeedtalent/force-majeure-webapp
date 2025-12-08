import { Instagram as InstagramIcon, Music, ChevronLeft } from 'lucide-react';
import { SiSoundcloud, SiSpotify, SiTiktok } from 'react-icons/si';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { cn } from '@force-majeure/shared/utils/utils';
import { useIsMobile } from '@force-majeure/shared/hooks/use-mobile';
import { SocialImagesGridMobile } from './SocialImagesGridMobile';
import { SocialImagesGridDesktop } from './SocialImagesGridDesktop';
import type { ArtistRegistrationFormData } from '../../types/registration';

interface SocialImagesStepProps {
  formData: ArtistRegistrationFormData;
  onInputChange: (field: keyof ArtistRegistrationFormData, value: any) => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function SocialImagesStep({
  formData,
  onInputChange,
  onNext,
  onPrevious,
}: SocialImagesStepProps) {
  const isMobile = useIsMobile();

  const handleImageUpload = (field: keyof ArtistRegistrationFormData, label: string) => {
    const url = prompt(`Enter image URL for ${label}:`);
    if (url) onInputChange(field, url);
  };

  return (
    <div className='h-full flex flex-col p-[20px]'>
      <div className='flex-1 overflow-y-auto pr-[10px]'>
        <div className='flex justify-center items-start'>
          <div className='w-[85vw] sm:w-[80%] lg:w-[60%] space-y-[20px] bg-black/60 backdrop-blur-sm border border-white/10 p-[30px] sm:p-[40px]'>
            <div>
              <h2 className='font-canela text-3xl mb-[10px]'>Your online presence.</h2>
              <p className='font-canela text-sm text-muted-foreground'>
                Add your profile images and social media links.
              </p>
            </div>

            <div className='w-full h-[1px] bg-gradient-to-r from-fm-gold via-white/30 to-transparent' />

            {/* Profile Images - Grid Upload */}
            <div className='space-y-[10px]'>
              <h3 className='font-canela text-lg'>Profile Images</h3>

              {isMobile ? (
                <SocialImagesGridMobile formData={formData} onImageUpload={handleImageUpload} />
              ) : (
                <SocialImagesGridDesktop formData={formData} onImageUpload={handleImageUpload} />
              )}
            </div>

            <div className='w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent' />

            {/* Social Links */}
            <div className='space-y-[10px]'>
              <h3 className='font-canela text-lg'>Social Media</h3>
              <div className='flex items-center gap-[10px]'>
                <InstagramIcon className='h-5 w-5 text-fm-gold flex-shrink-0' />
                <FmCommonTextField
                  label='Instagram Handle'
                  required
                  value={formData.instagramHandle}
                  onChange={e => onInputChange('instagramHandle', e.target.value)}
                  placeholder='@yourusername'
                  className='flex-1'
                />
              </div>

              <div
                className={cn(
                  'bg-black/40 backdrop-blur-sm border rounded-none p-[15px] transition-colors',
                  !formData.soundcloudUrl && !formData.spotifyUrl
                    ? 'border-fm-danger/50'
                    : 'border-white/20'
                )}
              >
                <p className='font-canela text-xs mb-[10px] flex items-center gap-[5px]'>
                  <Music className='h-3 w-3' />
                  <span
                    className={cn(
                      'transition-colors',
                      !formData.soundcloudUrl && !formData.spotifyUrl
                        ? 'text-fm-danger'
                        : 'text-muted-foreground'
                    )}
                  >
                    At least one music platform is required:
                  </span>
                </p>
                <div className='space-y-[10px]'>
                  <div className='flex items-center gap-[10px]'>
                    <SiSoundcloud className='h-5 w-5 text-[#ff5500] flex-shrink-0' />
                    <FmCommonTextField
                      label='SoundCloud URL'
                      value={formData.soundcloudUrl}
                      onChange={e => onInputChange('soundcloudUrl', e.target.value)}
                      placeholder='https://soundcloud.com/your-profile'
                      className='flex-1'
                    />
                  </div>
                  <div className='flex items-center gap-[10px]'>
                    <SiSpotify className='h-5 w-5 text-[#1DB954] flex-shrink-0' />
                    <FmCommonTextField
                      label='Spotify Artist URL'
                      value={formData.spotifyUrl}
                      onChange={e => onInputChange('spotifyUrl', e.target.value)}
                      placeholder='https://open.spotify.com/artist/...'
                      className='flex-1'
                    />
                  </div>
                </div>
              </div>

              <div className='flex items-center gap-[10px]'>
                <SiTiktok className='h-5 w-5 flex-shrink-0' />
                <FmCommonTextField
                  label='TikTok Handle (Optional)'
                  value={formData.tiktokHandle}
                  onChange={e => onInputChange('tiktokHandle', e.target.value)}
                  placeholder='@yourusername'
                  className='flex-1'
                />
              </div>
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

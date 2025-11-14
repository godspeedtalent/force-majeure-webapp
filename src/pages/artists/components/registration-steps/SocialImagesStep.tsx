import { Instagram as InstagramIcon, Upload, Music, ChevronLeft } from 'lucide-react';
import { SiSoundcloud, SiSpotify, SiTiktok } from 'react-icons/si';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { cn } from '@/shared/utils/utils';
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
  const handleImageUpload = (field: keyof ArtistRegistrationFormData, label: string) => {
    const url = prompt(`Enter image URL for ${label}:`);
    if (url) onInputChange(field, url);
  };

  return (
    <div className='h-full flex flex-col p-[20px]'>
      <div className='flex-1 overflow-y-auto pr-[10px]'>
        <div className='flex justify-center'>
          <div className='w-[60%] space-y-[20px]'>
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
              <div className='grid grid-cols-2 gap-[10px]'>
                {/* Main Profile Picture */}
                <div className='col-span-1 row-span-2'>
                  <div
                    className='aspect-[3/4] border-2 border-dashed border-white/30 rounded-none bg-black/40 hover:border-fm-gold hover:bg-fm-gold/5 transition-all cursor-pointer relative overflow-hidden group'
                    onClick={() => handleImageUpload('profileImageUrl', 'main profile picture')}
                  >
                    {formData.profileImageUrl ? (
                      <img
                        src={formData.profileImageUrl}
                        alt='Profile'
                        className='w-full h-full object-cover'
                      />
                    ) : (
                      <div className='absolute inset-0 flex flex-col items-center justify-center text-white/50 group-hover:text-fm-gold transition-colors'>
                        <Upload className='h-8 w-8 mb-[10px]' />
                        <span className='text-xs font-canela'>Main Profile</span>
                        <span className='text-xs font-canela text-white/30'>Required</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Press Photo 1 */}
                <div className='col-span-1'>
                  <div
                    className='aspect-[3/2] border-2 border-dashed border-white/30 rounded-none bg-black/40 hover:border-fm-gold hover:bg-fm-gold/5 transition-all cursor-pointer relative overflow-hidden group'
                    onClick={() => handleImageUpload('pressImage1Url', 'press photo 1')}
                  >
                    {formData.pressImage1Url ? (
                      <img
                        src={formData.pressImage1Url}
                        alt='Press 1'
                        className='w-full h-full object-cover'
                      />
                    ) : (
                      <div className='absolute inset-0 flex flex-col items-center justify-center text-white/50 group-hover:text-fm-gold transition-colors'>
                        <Upload className='h-6 w-6 mb-[5px]' />
                        <span className='text-xs font-canela'>Press Photo</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Press Photo 2 - Only show if Press Photo 1 has content */}
                {formData.pressImage1Url && (
                  <div className='col-span-1'>
                    <div
                      className='aspect-[3/2] border-2 border-dashed border-white/30 rounded-none bg-black/40 hover:border-fm-gold hover:bg-fm-gold/5 transition-all cursor-pointer relative overflow-hidden group'
                      onClick={() => handleImageUpload('pressImage2Url', 'press photo 2')}
                    >
                      {formData.pressImage2Url ? (
                        <img
                          src={formData.pressImage2Url}
                          alt='Press 2'
                          className='w-full h-full object-cover'
                        />
                      ) : (
                        <div className='absolute inset-0 flex flex-col items-center justify-center text-white/50 group-hover:text-fm-gold transition-colors'>
                          <Upload className='h-6 w-6 mb-[5px]' />
                          <span className='text-xs font-canela'>Press Photo</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Press Photo 3 - Only show if Press Photo 2 has content */}
                {formData.pressImage1Url && formData.pressImage2Url && (
                  <div className='col-span-2'>
                    <div
                      className='aspect-[3/1] border-2 border-dashed border-white/30 rounded-none bg-black/40 hover:border-fm-gold hover:bg-fm-gold/5 transition-all cursor-pointer relative overflow-hidden group'
                      onClick={() => handleImageUpload('pressImage3Url', 'press photo 3')}
                    >
                      {formData.pressImage3Url ? (
                        <img
                          src={formData.pressImage3Url}
                          alt='Press 3'
                          className='w-full h-full object-cover'
                        />
                      ) : (
                        <div className='absolute inset-0 flex flex-col items-center justify-center text-white/50 group-hover:text-fm-gold transition-colors'>
                          <Upload className='h-6 w-6 mb-[5px]' />
                          <span className='text-xs font-canela'>Press Photo</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
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

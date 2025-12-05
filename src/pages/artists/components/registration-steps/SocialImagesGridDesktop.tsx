import { Upload, Star } from 'lucide-react';
import type { ArtistRegistrationFormData } from '../../types/registration';

export interface SocialImagesGridProps {
  formData: ArtistRegistrationFormData;
  onImageUpload: (field: keyof ArtistRegistrationFormData, label: string) => void;
}

export function SocialImagesGridDesktop({ formData, onImageUpload }: SocialImagesGridProps) {
  return (
    <div className='grid grid-cols-2 gap-[10px]'>
      {/* Main Profile Picture */}
      <div className='col-span-1 row-span-2'>
        <div
          className='aspect-[3/4] border-2 border-dashed border-fm-gold rounded-none bg-fm-gold/5 hover:bg-fm-gold/10 transition-all cursor-pointer relative overflow-hidden group'
          onClick={() => onImageUpload('profileImageUrl', 'main profile picture')}
        >
          {formData.profileImageUrl ? (
            <>
              <img
                src={formData.profileImageUrl}
                alt='Profile'
                className='w-full h-full object-cover'
              />
              <div className='absolute top-[10px] left-[10px] bg-fm-gold/90 px-[10px] py-[5px] flex items-center gap-[5px]'>
                <Star className='h-3 w-3 text-black fill-black' />
                <span className='text-xs font-canela font-medium text-black'>Profile</span>
              </div>
            </>
          ) : (
            <div className='absolute inset-0 flex flex-col items-center justify-center text-fm-gold transition-colors'>
              <Upload className='h-8 w-8 mb-[10px]' />
              <span className='text-xs font-canela'>Main Profile</span>
              <span className='text-xs font-canela text-fm-gold/60'>Required</span>
            </div>
          )}
        </div>
      </div>

      {/* Press Photo 1 */}
      <div className='col-span-1'>
        <div
          className='aspect-[3/2] border-2 border-dashed border-white/30 rounded-none bg-black/40 hover:border-fm-gold hover:bg-fm-gold/5 transition-all cursor-pointer relative overflow-hidden group'
          onClick={() => onImageUpload('pressImage1Url', 'press photo 1')}
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
            onClick={() => onImageUpload('pressImage2Url', 'press photo 2')}
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
            onClick={() => onImageUpload('pressImage3Url', 'press photo 3')}
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
  );
}

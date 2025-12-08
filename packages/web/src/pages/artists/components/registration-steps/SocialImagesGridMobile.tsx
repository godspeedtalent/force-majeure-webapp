import { Upload, Star } from 'lucide-react';
import { cn } from '@force-majeure/shared/utils/utils';
import type { ArtistRegistrationFormData } from '../../types/registration';

export interface SocialImagesGridProps {
  formData: ArtistRegistrationFormData;
  onImageUpload: (field: keyof ArtistRegistrationFormData, label: string) => void;
}

export function SocialImagesGridMobile({ formData, onImageUpload }: SocialImagesGridProps) {
  return (
    <div className='space-y-[10px]'>
      {/* Main Profile Picture - Full Width Square with Gold Styling */}
      <div
        className='aspect-square w-full border-2 border-dashed border-fm-gold rounded-none bg-fm-gold/5 hover:bg-fm-gold/10 transition-all cursor-pointer relative overflow-hidden group'
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
            <Upload className='h-10 w-10 mb-[10px]' />
            <span className='text-sm font-canela font-medium'>Main Profile Photo</span>
            <span className='text-xs font-canela text-fm-gold/60'>Required</span>
          </div>
        )}
      </div>

      {/* Press Photos Grid - 3 columns */}
      <div className='grid grid-cols-3 gap-[10px]'>
        {/* Press Photo 1 */}
        <div
          className='aspect-square border-2 border-dashed border-white/30 rounded-none bg-black/40 hover:border-fm-gold hover:bg-fm-gold/5 transition-all cursor-pointer relative overflow-hidden group'
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
              <Upload className='h-5 w-5 mb-[5px]' />
              <span className='text-[10px] font-canela'>Press</span>
            </div>
          )}
        </div>

        {/* Press Photo 2 */}
        <div
          className={cn(
            'aspect-square border-2 border-dashed rounded-none transition-all cursor-pointer relative overflow-hidden group',
            formData.pressImage1Url
              ? 'border-white/30 bg-black/40 hover:border-fm-gold hover:bg-fm-gold/5'
              : 'border-white/10 bg-black/20 opacity-50 cursor-not-allowed'
          )}
          onClick={() => formData.pressImage1Url && onImageUpload('pressImage2Url', 'press photo 2')}
        >
          {formData.pressImage2Url ? (
            <img
              src={formData.pressImage2Url}
              alt='Press 2'
              className='w-full h-full object-cover'
            />
          ) : (
            <div className='absolute inset-0 flex flex-col items-center justify-center text-white/50 group-hover:text-fm-gold transition-colors'>
              <Upload className='h-5 w-5 mb-[5px]' />
              <span className='text-[10px] font-canela'>Press</span>
            </div>
          )}
        </div>

        {/* Press Photo 3 */}
        <div
          className={cn(
            'aspect-square border-2 border-dashed rounded-none transition-all cursor-pointer relative overflow-hidden group',
            formData.pressImage2Url
              ? 'border-white/30 bg-black/40 hover:border-fm-gold hover:bg-fm-gold/5'
              : 'border-white/10 bg-black/20 opacity-50 cursor-not-allowed'
          )}
          onClick={() => formData.pressImage2Url && onImageUpload('pressImage3Url', 'press photo 3')}
        >
          {formData.pressImage3Url ? (
            <img
              src={formData.pressImage3Url}
              alt='Press 3'
              className='w-full h-full object-cover'
            />
          ) : (
            <div className='absolute inset-0 flex flex-col items-center justify-center text-white/50 group-hover:text-fm-gold transition-colors'>
              <Upload className='h-5 w-5 mb-[5px]' />
              <span className='text-[10px] font-canela'>Press</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

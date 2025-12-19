import { Upload, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared';
import type { ArtistRegistrationFormData } from '../../types/registration';
import { FmI18nCommon } from '@/components/common/i18n';

export interface SocialImagesGridProps {
  formData: ArtistRegistrationFormData;
  onImageUpload: (field: keyof ArtistRegistrationFormData, label: string) => void;
}

export function SocialImagesGridMobile({ formData, onImageUpload }: SocialImagesGridProps) {
  const { t } = useTranslation('common');
  return (
    <div className='space-y-[10px]'>
      {/* Main Profile Picture - Full Width Square with Gold Styling */}
      <div
        className='aspect-square w-full border-2 border-dashed border-fm-gold rounded-none bg-fm-gold/5 hover:bg-fm-gold/10 transition-all cursor-pointer relative overflow-hidden group'
        onClick={() => onImageUpload('profileImageUrl', t('imageUpload.mainProfilePicture'))}
      >
        {formData.profileImageUrl ? (
          <>
            <img
              src={formData.profileImageUrl}
              alt={t('imageUpload.profile')}
              className='w-full h-full object-cover'
            />
            <div className='absolute top-[10px] left-[10px] bg-fm-gold/90 px-[10px] py-[5px] flex items-center gap-[5px]'>
              <Star className='h-3 w-3 text-black fill-black' />
              <FmI18nCommon i18nKey='imageUpload.profile' as='span' className='text-xs font-canela font-medium text-black' />
            </div>
          </>
        ) : (
          <div className='absolute inset-0 flex flex-col items-center justify-center text-fm-gold transition-colors'>
            <Upload className='h-10 w-10 mb-[10px]' />
            <FmI18nCommon i18nKey='imageUpload.mainProfilePhoto' as='span' className='text-sm font-canela font-medium' />
            <FmI18nCommon i18nKey='imageUpload.required' as='span' className='text-xs font-canela text-fm-gold/60' />
          </div>
        )}
      </div>

      {/* Press Photos Grid - 3 columns */}
      <div className='grid grid-cols-3 gap-[10px]'>
        {/* Press Photo 1 */}
        <div
          className='aspect-square border-2 border-dashed border-white/30 rounded-none bg-black/40 hover:border-fm-gold hover:bg-fm-gold/5 transition-all cursor-pointer relative overflow-hidden group'
          onClick={() => onImageUpload('pressImage1Url', t('imageUpload.pressPhoto', { number: 1 }))}
        >
          {formData.pressImage1Url ? (
            <img
              src={formData.pressImage1Url}
              alt={t('imageUpload.pressPhoto', { number: 1 })}
              className='w-full h-full object-cover'
            />
          ) : (
            <div className='absolute inset-0 flex flex-col items-center justify-center text-white/50 group-hover:text-fm-gold transition-colors'>
              <Upload className='h-5 w-5 mb-[5px]' />
              <FmI18nCommon i18nKey='imageUpload.press' as='span' className='text-[10px] font-canela' />
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
          onClick={() => formData.pressImage1Url && onImageUpload('pressImage2Url', t('imageUpload.pressPhoto', { number: 2 }))}
        >
          {formData.pressImage2Url ? (
            <img
              src={formData.pressImage2Url}
              alt={t('imageUpload.pressPhoto', { number: 2 })}
              className='w-full h-full object-cover'
            />
          ) : (
            <div className='absolute inset-0 flex flex-col items-center justify-center text-white/50 group-hover:text-fm-gold transition-colors'>
              <Upload className='h-5 w-5 mb-[5px]' />
              <FmI18nCommon i18nKey='imageUpload.press' as='span' className='text-[10px] font-canela' />
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
          onClick={() => formData.pressImage2Url && onImageUpload('pressImage3Url', t('imageUpload.pressPhoto', { number: 3 }))}
        >
          {formData.pressImage3Url ? (
            <img
              src={formData.pressImage3Url}
              alt={t('imageUpload.pressPhoto', { number: 3 })}
              className='w-full h-full object-cover'
            />
          ) : (
            <div className='absolute inset-0 flex flex-col items-center justify-center text-white/50 group-hover:text-fm-gold transition-colors'>
              <Upload className='h-5 w-5 mb-[5px]' />
              <FmI18nCommon i18nKey='imageUpload.press' as='span' className='text-[10px] font-canela' />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

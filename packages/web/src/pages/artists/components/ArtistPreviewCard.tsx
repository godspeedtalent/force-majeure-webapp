import { cn } from '@force-majeure/shared';
import { FmCommonBadgeGroup } from '@/components/common/display/FmCommonBadgeGroup';
import { Instagram as InstagramIcon } from 'lucide-react';
import { SiSoundcloud, SiSpotify, SiTiktok } from 'react-icons/si';
import type { ArtistRegistrationFormData } from '../types/registration';

interface BadgeItem {
  label: string;
  className?: string;
}

type PressImageField = 'pressImage1Url' | 'pressImage2Url' | 'pressImage3Url';

interface ArtistPreviewCardProps {
  formData: ArtistRegistrationFormData;
  genreBadges: BadgeItem[];
  className?: string;
  onInputChange?: (field: keyof ArtistRegistrationFormData, value: string | null) => void;
}

const DEFAULT_BIO =
  'Your bio will appear here. Tell your story, describe your sound, and share what makes you unique.';

export function ArtistPreviewCard({
  formData,
  genreBadges,
  className,
  onInputChange,
}: ArtistPreviewCardProps) {
  const pressImageFields: PressImageField[] = ['pressImage1Url', 'pressImage2Url', 'pressImage3Url'];

  const handleImageSwap = (clickedIndex: number) => {
    if (!onInputChange) return;

    const clickedField = pressImageFields[clickedIndex];
    const clickedImageUrl = formData[clickedField];

    // Only swap if the clicked image has a URL
    if (!clickedImageUrl) return;

    const currentProfileUrl = formData.profileImageUrl;

    // Swap: clicked image becomes profile, profile goes to clicked slot
    onInputChange('profileImageUrl', clickedImageUrl);
    onInputChange(clickedField, currentProfileUrl || null);
  };
  return (
    <div
      className={cn(
        'bg-black/60 backdrop-blur-md border border-white/20 rounded-none p-[30px]',
        className
      )}
    >
      <div className='flex flex-col gap-6 sm:flex-row sm:items-stretch'>
        {/* Left: Image Column */}
        <div className='w-full sm:w-48 flex-shrink-0 flex flex-col gap-[10px]'>
          {/* Mobile: Main image + additional photos side by side */}
          {/* Desktop: Main image with additional photos below */}
          <div className='flex flex-row gap-[10px] sm:flex-col'>
            {/* Main Profile Image */}
            <div className='flex-1 sm:flex-none overflow-hidden rounded-xl border border-white/15 bg-white/5 shadow-inner'>
              {formData.profileImageUrl ? (
                <img
                  src={formData.profileImageUrl}
                  alt={formData.stageName}
                  className='aspect-[3/4] w-full object-cover'
                  onError={e => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className='aspect-[3/4] w-full bg-gradient-to-br from-fm-gold/15 via-fm-gold/5 to-transparent' />
              )}
            </div>

            {/* Additional Photos - Column on mobile (right of main), row on desktop (below main) */}
            {(formData.pressImage1Url || formData.pressImage2Url || formData.pressImage3Url) && (
              <div className='flex flex-col justify-between gap-[5px] w-16 sm:w-full sm:flex-row sm:gap-[10px]'>
                {[formData.pressImage1Url, formData.pressImage2Url, formData.pressImage3Url].map(
                  (imageUrl, index) => (
                    <button
                      key={index}
                      type='button'
                      onClick={() => handleImageSwap(index)}
                      disabled={!imageUrl || !onInputChange}
                      className={cn(
                        'aspect-square flex-1 overflow-hidden rounded-lg border border-white/15 bg-white/5',
                        'transition-all duration-200',
                        imageUrl && onInputChange && 'cursor-pointer hover:border-fm-gold/50 hover:scale-105 hover:shadow-lg hover:shadow-fm-gold/20',
                        (!imageUrl || !onInputChange) && 'cursor-default'
                      )}
                      aria-label={imageUrl ? `Click to make this the main image` : undefined}
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={`${formData.stageName} press photo ${index + 1}`}
                          className='w-full h-full object-cover'
                          onError={e => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : null}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Content Column */}
        <div className='flex-1 flex flex-col gap-4 sm:min-h-[280px]'>
          <div className='space-y-2'>
            <p className='text-[10px] uppercase tracking-[0.35em] text-white/50 font-canela'>
              Artist Spotlight
            </p>
            <h2 className='text-2xl font-canela font-semibold text-white leading-tight'>
              {formData.stageName || 'Your Name'}
            </h2>
            <div className='w-full h-[1px] bg-white/30' />
          </div>

          <div
            className={cn(
              'prose prose-invert max-w-none text-sm text-white/80 leading-relaxed font-canela',
              !formData.bio && 'italic text-white/60'
            )}
          >
            {formData.bio || DEFAULT_BIO}
          </div>

          {genreBadges.length > 0 && (
            <FmCommonBadgeGroup
              badges={genreBadges}
              className='mt-auto'
              badgeClassName='border-fm-gold/60 bg-fm-gold/10 text-fm-gold'
              gap='md'
            />
          )}
        </div>
      </div>

      {/* Social Media Links */}
      {(formData.instagramHandle ||
        formData.soundcloudUrl ||
        formData.spotifyUrl ||
        formData.tiktokHandle) && (
        <>
          <div className='w-full h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent mt-[20px]' />
          <div className='flex items-center justify-center gap-[15px] mt-[15px]'>
            {formData.instagramHandle && (
              <a
                href={`https://instagram.com/${formData.instagramHandle.replace('@', '')}`}
                target='_blank'
                rel='noopener noreferrer'
                className='p-[10px] rounded-none border border-white/20 bg-white/5 hover:bg-white/10 hover:border-fm-gold/50 transition-all duration-300'
                aria-label='Instagram'
              >
                <InstagramIcon className='h-5 w-5 text-white/70 hover:text-fm-gold' />
              </a>
            )}
            {formData.soundcloudUrl && (
              <a
                href={formData.soundcloudUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='p-[10px] rounded-none border border-white/20 bg-white/5 hover:bg-white/10 hover:border-[#FF5500]/50 transition-all duration-300'
                aria-label='SoundCloud'
              >
                <SiSoundcloud className='h-5 w-5 text-white/70 hover:text-[#FF5500]' />
              </a>
            )}
            {formData.spotifyUrl && (
              <a
                href={formData.spotifyUrl}
                target='_blank'
                rel='noopener noreferrer'
                className='p-[10px] rounded-none border border-white/20 bg-white/5 hover:bg-white/10 hover:border-[#1DB954]/50 transition-all duration-300'
                aria-label='Spotify'
              >
                <SiSpotify className='h-5 w-5 text-white/70 hover:text-[#1DB954]' />
              </a>
            )}
            {formData.tiktokHandle && (
              <a
                href={`https://tiktok.com/@${formData.tiktokHandle.replace('@', '')}`}
                target='_blank'
                rel='noopener noreferrer'
                className='p-[10px] rounded-none border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/50 transition-all duration-300'
                aria-label='TikTok'
              >
                <SiTiktok className='h-5 w-5 text-white/70 hover:text-white' />
              </a>
            )}
          </div>
        </>
      )}
    </div>
  );
}

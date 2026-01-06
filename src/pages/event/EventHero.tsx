import { useState } from 'react';
import { ArrowLeft, Settings, ImageOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { cn } from '@/shared';

import { EventDetailsRecord } from './types';

interface EventHeroProps {
  event: EventDetailsRecord;
  canManage: boolean;
  onBack: () => void;
  onManage?: () => void;
}

/**
 * Check if the image is a placeholder or missing
 */
const isPlaceholderImage = (src: string): boolean => {
  if (!src) return true;
  return src === '/placeholder.svg' || src.includes('placeholder');
};

export const EventHero = ({
  event,
  canManage,
  onBack,
  onManage,
}: EventHeroProps) => {
  const { t } = useTranslation('pages');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Get focal point from event data, default to center
  const focalY = (event as any).hero_image_focal_y ?? 50;

  // Check if we have a real hero image or just a placeholder
  const hasRealImage = !isPlaceholderImage(event.heroImage) && !imageError;

  // Show skeleton when: no real image, or image is loading
  const showSkeleton = !hasRealImage || !imageLoaded;

  return (
    <div
      className='relative h-full'
      style={{
        viewTransitionName: `magazine-hero-${event.id}`,
      }}
    >
      {/* Real image - only render if we have one */}
      {hasRealImage && (
        <img
          src={event.heroImage}
          alt={event.title || event.headliner.name}
          className={cn(
            'h-full w-auto object-contain transition-opacity duration-700',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          style={{
            objectPosition: `center ${focalY}%`,
          }}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
      )}

      {/* Skeleton/Placeholder state */}
      {showSkeleton && (
        <div className='absolute inset-0 flex items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-black'>
          {/* Animated gradient overlay */}
          <div className='absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40' />

          {/* Decorative pattern */}
          <div className='absolute inset-0 opacity-5'>
            <div
              className='h-full w-full'
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
          </div>

          {/* Center content */}
          <div className='relative z-10 flex flex-col items-center gap-4 text-center px-8'>
            {/* Icon */}
            <div className='p-4 rounded-full bg-white/5 border border-white/10'>
              <ImageOff className='h-8 w-8 text-muted-foreground/50' />
            </div>

            {/* Event info as fallback */}
            <div className='space-y-2'>
              <h2 className='text-2xl font-canela text-foreground/80'>
                {event.headliner.name}
              </h2>
              {event.venue && (
                <p className='text-sm text-muted-foreground'>
                  {event.venue}
                </p>
              )}
            </div>

            {/* Shimmer effect for loading state */}
            {hasRealImage && !imageLoaded && (
              <div className='absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/5 to-transparent' />
            )}
          </div>
        </div>
      )}

      {/* Fixed buttons - stay at top of viewport */}
      <div className='fixed top-20 left-6 z-50 flex gap-2'>
        {/* Back button */}
        <FmCommonButton
          variant='secondary'
          size='icon'
          onClick={onBack}
          icon={ArrowLeft}
          className='text-white bg-black/40 hover:bg-black/20 backdrop-blur-sm border-white border-2 hover:border-fm-gold hover:text-fm-gold hover:shadow-[0_0_20px_rgba(255,255,255,0.6)] transition-colors duration-200 lg:w-auto lg:px-4'
        >
          <span className='hidden lg:inline'>{t('eventDetails.back')}</span>
        </FmCommonButton>

        {/* Manage button */}
        {canManage && (
          <FmCommonButton
            variant='secondary'
            size='icon'
            onClick={onManage}
            icon={Settings}
            className='text-white bg-black/40 hover:bg-black/20 backdrop-blur-sm border-white border-2 hover:border-fm-gold hover:text-fm-gold hover:shadow-[0_0_20px_rgba(255,255,255,0.6)] transition-colors duration-200 lg:w-auto lg:px-4'
          >
            <span className='hidden lg:inline'>{t('eventDetails.manage')}</span>
          </FmCommonButton>
        )}
      </div>
    </div>
  );
};

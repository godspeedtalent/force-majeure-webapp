import { useState } from 'react';
import { ArrowLeft, Settings, ImageOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonIconButton } from '@/components/common/buttons/FmCommonIconButton';
import { cn } from '@/shared';

import { EventDetailsRecord } from './types';

interface EventHeroProps {
  event: EventDetailsRecord;
}

interface EventHeroActionsProps {
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

/**
 * Action buttons for the event hero (back, manage)
 * Rendered separately via layout to avoid stacking context issues
 */
export const EventHeroActions = ({
  canManage,
  onBack,
  onManage,
}: EventHeroActionsProps) => {
  const { t } = useTranslation('pages');

  return (
    <>
      {/* Back button - icon only on mobile, with text on desktop */}
      <FmCommonIconButton
        variant='secondary'
        size='default'
        onClick={onBack}
        icon={ArrowLeft}
        tooltip={t('eventDetails.back')}
        className='lg:hidden text-white bg-black/40 hover:bg-black/20 backdrop-blur-sm border-white border-2 hover:border-fm-gold hover:text-fm-gold hover:shadow-[0_0_20px_rgba(255,255,255,0.6)]'
      />
      <FmCommonButton
        variant='secondary'
        size='default'
        onClick={onBack}
        icon={ArrowLeft}
        className='hidden lg:flex text-white bg-black/40 hover:bg-black/20 backdrop-blur-sm border-white border-2 hover:border-fm-gold hover:text-fm-gold hover:shadow-[0_0_20px_rgba(255,255,255,0.6)] transition-colors duration-200 px-4'
      >
        {t('eventDetails.back')}
      </FmCommonButton>

      {/* Manage button - icon only on mobile, with text on desktop */}
      {canManage && (
        <>
          <FmCommonIconButton
            variant='secondary'
            size='default'
            onClick={onManage}
            icon={Settings}
            tooltip={t('eventDetails.manage')}
            className='lg:hidden text-white bg-black/40 hover:bg-black/20 backdrop-blur-sm border-white border-2 hover:border-fm-gold hover:text-fm-gold hover:shadow-[0_0_20px_rgba(255,255,255,0.6)]'
          />
          <FmCommonButton
            variant='secondary'
            size='default'
            onClick={onManage}
            icon={Settings}
            className='hidden lg:flex text-white bg-black/40 hover:bg-black/20 backdrop-blur-sm border-white border-2 hover:border-fm-gold hover:text-fm-gold hover:shadow-[0_0_20px_rgba(255,255,255,0.6)] transition-colors duration-200 px-4'
          >
            {t('eventDetails.manage')}
          </FmCommonButton>
        </>
      )}
    </>
  );
};

export const EventHero = ({ event }: EventHeroProps) => {
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
            'transition-opacity duration-700',
            // Mobile: conditionally show full height or cropped based on mobileFullHeroHeight setting
            // Desktop: always contain to show full image
            event.mobileFullHeroHeight
              ? 'w-full h-auto lg:h-full lg:w-auto lg:object-contain' // Full height on mobile: preserve aspect ratio
              : 'h-full w-full object-cover lg:w-auto lg:object-contain', // Default: crop to fill container
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          style={{
            objectPosition: event.mobileFullHeroHeight ? undefined : `center ${focalY}%`,
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
    </div>
  );
};

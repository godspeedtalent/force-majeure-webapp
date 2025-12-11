import { useState } from 'react';
import { ArrowLeft, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { cn } from '@force-majeure/shared';

import { EventDetailsRecord } from './types';

interface EventHeroProps {
  event: EventDetailsRecord;
  canManage: boolean;
  onBack: () => void;
  onManage?: () => void;
}

export const EventHero = ({
  event,
  canManage,
  onBack,
  onManage,
}: EventHeroProps) => {
  const { t } = useTranslation('pages');
  const [imageLoaded, setImageLoaded] = useState(false);

  // Get focal point from event data, default to center
  const focalY = (event as any).hero_image_focal_y ?? 50;

  return (
    <div
      className='relative'
      style={{
        viewTransitionName: `magazine-hero-${event.id}`,
        height: 'calc(100vh - 4rem)' // 100vh minus nav bar height (h-16 = 4rem = 64px)
      }}
    >
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
      />

      {!imageLoaded && (
        <div className='absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-muted-foreground/10 to-muted' />
      )}

      {/* Fixed buttons on mobile, absolute on desktop */}
      <div className='fixed lg:absolute top-6 left-6 right-6 lg:top-10 lg:left-10 lg:right-10 flex justify-between z-50 lg:z-auto pointer-events-none'>
        {/* Back button - left side */}
        <div className='flex gap-2 pointer-events-auto'>
          <FmCommonButton
            variant='secondary'
            size='icon'
            onClick={onBack}
            icon={ArrowLeft}
            className='text-white bg-black/40 hover:bg-black/20 backdrop-blur-sm border-white border-2 hover:border-fm-gold hover:text-fm-gold hover:shadow-[0_0_20px_rgba(255,255,255,0.6)] transition-colors duration-200 lg:w-auto lg:px-4'
          >
            <span className='hidden lg:inline'>{t('eventDetails.back')}</span>
          </FmCommonButton>
        </div>

        {/* Manage button - right side (top right on desktop) */}
        {canManage && (
          <div className='pointer-events-auto'>
            <FmCommonButton
              variant='secondary'
              size='icon'
              onClick={onManage}
              icon={Settings}
              className='text-white bg-black/40 hover:bg-black/20 backdrop-blur-sm border-white border-2 hover:border-fm-gold hover:text-fm-gold hover:shadow-[0_0_20px_rgba(255,255,255,0.6)] transition-colors duration-200 lg:w-auto lg:px-4'
            >
              <span className='hidden lg:inline'>{t('eventDetails.manage')}</span>
            </FmCommonButton>
          </div>
        )}
      </div>
    </div>
  );
};

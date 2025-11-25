import { useState } from 'react';
import { ArrowLeft, Settings } from 'lucide-react';

import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { cn } from '@/shared/utils/utils';

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
  const [imageLoaded, setImageLoaded] = useState(false);

  // Get focal point from event data, default to center
  const focalY = (event as any).hero_image_focal_y ?? 50;

  return (
    <div
      className='relative h-full max-h-[40vh] lg:max-h-none'
      style={{ viewTransitionName: `magazine-hero-${event.id}` }}
    >
      <img
        src={event.heroImage}
        alt={event.title || event.headliner.name}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-700 lg:object-center',
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

      {/* Gradient overlay only on desktop */}
      <div className='hidden lg:block absolute inset-0 bg-gradient-to-b from-black/45 via-black/15 to-transparent' />

      {/* Fixed buttons on mobile, absolute on desktop */}
      <div className='fixed lg:absolute top-6 left-6 right-6 lg:inset-0 lg:p-10 flex justify-between lg:flex-col lg:justify-between z-50 lg:z-auto pointer-events-none'>
        <div className='flex gap-2 pointer-events-auto'>
          <FmCommonButton
            variant='secondary'
            size='icon'
            onClick={onBack}
            icon={ArrowLeft}
            className='text-white bg-black/40 hover:bg-black/20 backdrop-blur-sm border-white/20 hover:border-fm-gold hover:text-fm-gold hover:shadow-[0_0_20px_rgba(255,255,255,0.6)] lg:w-auto lg:px-4'
          >
            <span className='hidden lg:inline'>Back</span>
          </FmCommonButton>
        </div>

        {canManage && (
          <div className='pointer-events-auto'>
            <FmCommonButton
              variant='secondary'
              size='icon'
              onClick={onManage}
              icon={Settings}
              className='text-white bg-black/40 hover:bg-black/20 backdrop-blur-sm border-white/20 hover:border-fm-gold hover:text-fm-gold hover:shadow-[0_0_20px_rgba(255,255,255,0.6)] lg:w-auto lg:px-4'
            >
              <span className='hidden lg:inline'>Manage</span>
            </FmCommonButton>
          </div>
        )}
      </div>
    </div>
  );
};

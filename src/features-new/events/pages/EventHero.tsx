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

  return (
    <div
      className='relative h-full'
      style={{ viewTransitionName: `magazine-hero-${event.id}` }}
    >
      <img
        src={event.heroImage}
        alt={event.title || event.headliner.name}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-700',
          imageLoaded ? 'opacity-100' : 'opacity-0'
        )}
        onLoad={() => setImageLoaded(true)}
      />

      {!imageLoaded && (
        <div className='absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-muted-foreground/10 to-muted' />
      )}

      <div className='absolute inset-0 bg-gradient-to-b from-black/45 via-black/15 to-transparent' />

      <div className='absolute inset-0 p-6 lg:p-10 flex flex-col justify-between'>
        <div className='flex gap-2'>
          <FmCommonButton
            variant='secondary'
            size='sm'
            onClick={onBack}
            icon={ArrowLeft}
            className='text-white bg-black/40 hover:bg-black/20 backdrop-blur-sm border-white/20 hover:border-fm-gold hover:text-fm-gold hover:shadow-[0_0_20px_rgba(255,255,255,0.6)]'
          >
            Back
          </FmCommonButton>

          {canManage && (
            <FmCommonButton
              variant='secondary'
              size='sm'
              onClick={onManage}
              icon={Settings}
              className='text-white bg-black/40 hover:bg-black/20 backdrop-blur-sm border-white/20 hover:border-fm-gold hover:text-fm-gold hover:shadow-[0_0_20px_rgba(255,255,255,0.6)]'
            >
              Manage
            </FmCommonButton>
          )}
        </div>
      </div>
    </div>
  );
};

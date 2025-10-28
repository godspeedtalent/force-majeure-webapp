import { ReactNode } from 'react';

import { ImageWithSkeleton } from '@/components/primitives/ImageWithSkeleton';
import { TopographicBackground } from '@/components/ui/misc/TopographicBackground';

import { cn } from '@/shared/utils/utils';

interface TwoColumnLayoutProps {
  left: ReactNode;
  right: ReactNode;
  leftDecor?: boolean;
  rightImage?: string;
  border?: boolean;
  className?: string;
}

export const TwoColumnLayout = ({
  left,
  right,
  leftDecor = true,
  rightImage,
  border = true,
  className,
}: TwoColumnLayoutProps) => {
  return (
    <div className={cn('min-h-screen flex', className)}>
      {/* Left Column */}
      <div
        className={cn(
          'w-1/2 flex items-center justify-center overflow-y-auto relative z-10 shadow-[8px_0_24px_-8px_rgba(0,0,0,0.3)]',
          border && 'border-r border-border'
        )}
      >
        {leftDecor && <TopographicBackground opacity={0.25} />}
        <div className='w-full max-w-3xl px-8 py-12 relative z-10'>{left}</div>
      </div>

      {/* Right Column */}
      <div className='w-1/2 bg-muted relative overflow-hidden'>
        {rightImage ? (
          <>
            <ImageWithSkeleton
              src={rightImage}
              alt='Background'
              className='w-full h-full object-cover brightness-90'
            />
            <div className='absolute inset-0 bg-background/5 backdrop-blur-[0.5px]' />
            <div className='absolute inset-0 bg-black/[0.03]' />
          </>
        ) : (
          right
        )}
      </div>
    </div>
  );
};

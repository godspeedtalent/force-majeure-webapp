import { ReactNode } from 'react';

import { Footer } from '@/components/navigation/Footer';
import { ExpandableMusicPlayer } from '@/components/MusicPlayer/ExpandableMusicPlayer';
import { Navigation } from '@/components/navigation/Navigation';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';

interface SplitPageLayoutProps {
  left: ReactNode;
  right: ReactNode;
  leftWidthClass?: string; // e.g., "w-full lg:w-1/3" or "w-1/4"
  rightWidthClass?: string; // e.g., "hidden lg:block w-2/3" or "w-3/4"
  leftDecor?: boolean; // apply topographic + gradient overlays
  className?: string;
}

export const SplitPageLayout = ({
  left,
  right,
  leftWidthClass = 'w-full lg:w-1/4',
  rightWidthClass = 'hidden lg:block w-3/4',
  leftDecor = true,
  className = '',
}: SplitPageLayoutProps) => {
  return (
    <div className={`min-h-screen bg-background flex flex-col ${className}`}>
      <Navigation />

      <div className='flex-1 flex min-h-[calc(100vh-160px)]'>
        {/* Left Panel */}
        <div className={`${leftWidthClass} relative overflow-hidden`}>
          {leftDecor && (
            <>
              <TopographicBackground opacity={0.35} />
              <div className='absolute inset-0 bg-gradient-monochrome opacity-10' />
            </>
          )}
          {/* Content (capped width) */}
          <div className='relative h-full'>
            <div className='mx-auto w-full max-w-[500px] h-full'>{left}</div>
          </div>
        </div>

        {/* Right Panel */}
        <div
          className={`${rightWidthClass} bg-muted/30 border-l border-border overflow-y-auto`}
        >
          <div className='h-[calc(100vh-160px)] pb-20'>{right}</div>
        </div>
      </div>

      {/* Fixed music player and footer at bottom */}
      <div className='fixed bottom-0 left-0 right-0 z-40'>
        <ExpandableMusicPlayer />
        <Footer />
      </div>
    </div>
  );
};

export default SplitPageLayout;

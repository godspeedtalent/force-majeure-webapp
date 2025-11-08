import { ReactNode } from 'react';

import { Footer } from '@/components/navigation/Footer';
import { ExpandableMusicPlayer } from '@/components/music-player/ExpandableMusicPlayer';
import { Navigation } from '@/components/navigation/Navigation';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';
import { FeatureGuard } from '@/components/common/guards/FeatureGuard';
import { FEATURE_FLAGS } from '@/shared/config/featureFlags';

interface ForceMajeureRootLayoutProps {
  children: ReactNode;
  className?: string;
}

export const ForceMajeureRootLayout = ({
  children,
  className = '',
}: ForceMajeureRootLayoutProps) => {
  return (
    <div className={`min-h-screen bg-background flex flex-col ${className}`}>
      <Navigation />

      {/* Main content area with topography background */}
      <div className='flex-1 relative overflow-hidden'>
        <TopographicBackground opacity={0.35} />
        <div className='absolute inset-0 bg-gradient-monochrome opacity-10' />

        {/* Content */}
        <div className='relative pb-20'>{children}</div>
      </div>

      {/* Fixed music player and footer at bottom */}
      <div className='fixed bottom-0 left-0 right-0 z-40'>
        <FeatureGuard feature={FEATURE_FLAGS.MUSIC_PLAYER}>
          <ExpandableMusicPlayer />
        </FeatureGuard>
        <Footer />
      </div>
    </div>
  );
};

export default ForceMajeureRootLayout;

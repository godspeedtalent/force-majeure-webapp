import { ReactNode } from 'react';

import { Footer } from '@/components/Navigation/Footer';
import { ExpandableMusicPlayer } from '@/components/MusicPlayer/ExpandableMusicPlayer';
import { Navigation } from '@/components/Navigation/Navigation';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className='min-h-screen bg-background flex flex-col'>
      <Navigation />

      <main className='flex-1 animate-fade-in pb-20 relative overflow-hidden'>
        <TopographicBackground opacity={0.35} />
        <div className='absolute inset-0 bg-gradient-monochrome opacity-10' />
        <div className='relative'>{children}</div>
      </main>

      <Footer />

      {/* Fixed music player at bottom */}
      <div className='fixed bottom-0 left-0 right-0 z-40'>
        <ExpandableMusicPlayer />
      </div>
    </div>
  );
};

import { ReactNode } from 'react';

import { Footer } from '@/components/navigation/Footer';
import { ExpandableMusicPlayer } from '@/components/MusicPlayer/ExpandableMusicPlayer';
import { Navigation } from '@/components/navigation/Navigation';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className='min-h-screen bg-background flex flex-col'>
      <Navigation />

      <main className='flex-1 animate-fade-in pb-20'>{children}</main>

      <Footer />

      {/* Fixed music player at bottom */}
      <div className='fixed bottom-0 left-0 right-0 z-40'>
        <ExpandableMusicPlayer />
      </div>
    </div>
  );
};

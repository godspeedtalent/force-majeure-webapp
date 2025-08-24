import { ReactNode } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { ExpandableMusicPlayer } from '@/components/MusicPlayer/ExpandableMusicPlayer';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      
      <main className="flex-1 animate-fade-in pb-10">
        {children}
      </main>
      
      <ExpandableMusicPlayer />
      <Footer />
    </div>
  );
};
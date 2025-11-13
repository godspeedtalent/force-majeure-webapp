/**
 * ArtistRegistrationLayout
 *
 * Shared layout for artist signup and registration pages.
 * Features topography background, navigation, and scroll-based footer visibility.
 */

import { ReactNode, useState, useEffect } from 'react';
import { Navigation } from '@/components/navigation/Navigation';
import { Footer } from '@/components/navigation/Footer';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';

interface ArtistRegistrationLayoutProps {
  children: ReactNode;
}

export const ArtistRegistrationLayout = ({ children }: ArtistRegistrationLayoutProps) => {
  const [showFooter, setShowFooter] = useState(false);

  // Handle scroll to show/hide footer
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 50;
      setShowFooter(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className='min-h-screen bg-background flex flex-col relative overflow-hidden'>
      {/* Topography Background */}
      <div className='fixed inset-0 z-0'>
        <TopographicBackground opacity={0.35} />
      </div>

      {/* Navigation */}
      <Navigation />

      {/* Main Content */}
      <div className='relative z-10' style={{ minHeight: 'calc(100vh - 80px)' }}>
        {children}
      </div>

      {/* Footer - Hidden until scroll */}
      <div
        className='transition-opacity duration-500 relative z-10'
        style={{ opacity: showFooter ? 1 : 0, pointerEvents: showFooter ? 'auto' : 'none' }}
      >
        <Footer />
      </div>
    </div>
  );
};

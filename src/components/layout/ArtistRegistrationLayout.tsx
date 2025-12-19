/**
 * ArtistRegistrationLayout
 *
 * Shared layout for artist signup and registration pages.
 * Features topography background and navigation.
 */

import { ReactNode } from 'react';
import { Navigation } from '@/components/navigation/Navigation';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';

interface ArtistRegistrationLayoutProps {
  children: ReactNode;
}

export const ArtistRegistrationLayout = ({ children }: ArtistRegistrationLayoutProps) => {
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
    </div>
  );
};

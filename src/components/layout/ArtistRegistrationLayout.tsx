/**
 * ArtistRegistrationLayout
 *
 * Shared layout for artist signup and registration pages.
 * Features topography background and navigation.
 */

import { ReactNode } from 'react';
import { Navigation } from '@/components/navigation/Navigation';
import { FmBackgroundLayer } from '@/components/common/layout/FmBackgroundLayer';

interface ArtistRegistrationLayoutProps {
  children: ReactNode;
}

export const ArtistRegistrationLayout = ({ children }: ArtistRegistrationLayoutProps) => {
  return (
    <div className='h-screen bg-background flex flex-col relative'>
      {/* Topography Background */}
      <div className='fixed inset-0 z-0'>
        <FmBackgroundLayer showGradient={false} />
      </div>

      {/* Navigation */}
      <Navigation />
      {/* Spacer for fixed navigation */}
      <div className='h-16 flex-shrink-0' />

      {/* Main Content */}
      <main className='relative z-10 flex-1 min-h-0'>
        {children}
      </main>
    </div>
  );
};

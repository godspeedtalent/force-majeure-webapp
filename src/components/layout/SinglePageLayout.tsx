import { ReactNode } from 'react';
import { Navigation } from '@/components/navigation/Navigation';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';

interface SinglePageLayoutProps {
  children: ReactNode;
  /** Optional opacity for the topographic background (default: 0.25) */
  backgroundOpacity?: number;
  /** Optional additional classes for the main content container */
  className?: string;
}

/**
 * SinglePageLayout - A minimal baseline layout for simple pages
 *
 * Features:
 * - Navigation bar at the top
 * - Topographic background with gradient overlay
 * - Full-height content area
 * - Site-wide tools (Music Player, Dev Tools) are handled at the App level
 *
 * Use this for pages that need just the basics without footer or complex structure.
 */
export const SinglePageLayout = ({
  children,
  backgroundOpacity = 0.35,
  className = '',
}: SinglePageLayoutProps) => {
  return (
    <div className='min-h-screen bg-background flex flex-col'>
      <Navigation />

      <main className={`flex-1 pt-16 pb-20 relative overflow-hidden ${className}`}>
        <TopographicBackground opacity={backgroundOpacity} />
        <div className='absolute inset-0 bg-gradient-monochrome opacity-10' />
        <div className='relative z-10 h-full'>
          {children}
        </div>
      </main>
    </div>
  );
};

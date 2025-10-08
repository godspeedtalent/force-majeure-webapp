import { ReactNode, useEffect, useRef } from 'react';

import { LocationCard } from '../shared';

import lfSystemImage from '@/assets/lf-system-scavenger.jpg';
import { Footer } from '@/components/Footer';
import { ImageWithSkeleton } from '@/components/ImageWithSkeleton';
import { ScavengerDevPanel } from '@/components/ScavengerDevPanel';
import { ScavengerNavigation } from '@/components/ScavengerNavigation';
import { Card } from '@/components/ui/card';
import { ImageAnchor } from '@/shared/types/imageAnchor';

interface ScavengerFullLayoutProps {
  showShoppingCart?: boolean;
  showDevPanel?: boolean;
  locations?: any[];
  userClaims?: any[];
  children?: ReactNode;
}

export function ScavengerFullLayout({
  showShoppingCart = true,
  showDevPanel = true,
  locations = [],
  userClaims = [],
  children,
}: ScavengerFullLayoutProps) {
  const parallaxRef = useRef<HTMLDivElement>(null);

  // Parallax scroll effect - mobile only
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (parallaxRef.current && window.innerWidth < 1024) {
        // Only on mobile/tablet
        parallaxRef.current.style.transform = `translateY(${scrollY * 0.5}px)`;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <ScavengerNavigation showShoppingCart={showShoppingCart} />

      {/* Mobile/Tablet: Hero image at top */}
      <div className='lg:hidden h-[50vh] w-full bg-muted relative overflow-hidden shadow-[0_12px_48px_-4px_rgba(0,0,0,0.7)]'>
        <div
          ref={parallaxRef}
          className='absolute inset-0 w-full h-[120%] -top-[10%]'
          style={{ willChange: 'transform' }}
        >
          <ImageWithSkeleton
            src={lfSystemImage}
            alt='LF System'
            anchor={ImageAnchor.TOP}
            className='w-full h-full object-cover brightness-90'
          />
        </div>
      </div>

      {/* Desktop: Split layout */}
      <div className='h-[calc(100vh-6.5rem)] flex flex-col lg:flex-row'>
        {/* Left Column - Content */}
        <div className='flex-1 lg:w-1/2 flex items-start justify-center lg:overflow-y-auto relative z-10 lg:shadow-[8px_0_24px_-8px_rgba(0,0,0,0.3)] lg:border-r border-border'>
          <div className='absolute inset-0 bg-topographic opacity-15 lg:opacity-25 bg-no-repeat bg-cover bg-center backdrop-blur-sm' />
          <div className='w-full max-w-3xl px-4 py-6 lg:px-8 lg:py-12 relative z-10'>
            {/* Header */}
            <div className='text-center mb-8'>
              <h1 className='font-display text-3xl md:text-4xl mb-4'>
                <span className='text-fm-gold'>LF System</span> Scavenger Hunt
              </h1>
              <p className='text-lg text-muted-foreground'>
                Find all 5 locations to complete the hunt!
              </p>
            </div>

            <div className='space-y-6'>
              <div className='grid gap-4 md:grid-cols-2'>
                {locations?.map(location => (
                  <LocationCard
                    key={location.id}
                    locationName={location.location_name}
                    totalTokens={location.total_tokens}
                    tokensRemaining={location.tokens_remaining}
                  />
                ))}
              </div>

              {/* User's stats */}
              {userClaims && userClaims.length > 0 && (
                <Card className='p-4 bg-gradient-gold border-none text-primary-foreground'>
                  <h3 className='font-display text-xl mb-3'>Your Progress</h3>
                  <div className='space-y-2'>
                    <p className='text-base'>
                      You&apos;ve found{' '}
                      <span className='font-bold'>{userClaims.length}</span> of
                      5 locations!
                    </p>
                    <div className='space-y-1'>
                      {userClaims.map(claim => (
                        <div
                          key={claim.id}
                          className='flex items-center justify-between bg-primary-foreground/10 rounded-lg p-2'
                        >
                          <span className='font-medium text-sm'>
                            {(claim.scavenger_locations as any).location_name}
                          </span>
                          <span className='text-xs'>
                            Position #{claim.claim_position}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {children}
            </div>
          </div>
        </div>

        {/* Desktop only: Right Column - Image */}
        <div className='hidden lg:block lg:w-1/2 bg-muted relative overflow-hidden'>
          <ImageWithSkeleton
            src={lfSystemImage}
            alt='LF System'
            anchor={ImageAnchor.TOP}
            className='w-full h-full object-cover brightness-90'
          />
          <div className='absolute inset-0 bg-background/5 backdrop-blur-[0.5px]' />
          <div className='absolute inset-0 bg-black/[0.03]' />
        </div>
      </div>

      <Footer />
      {showDevPanel && <ScavengerDevPanel />}
    </>
  );
}

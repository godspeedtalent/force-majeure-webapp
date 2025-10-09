import { ReactNode, useRef, useEffect } from 'react';

import lfSystemImage from '@/assets/lf-system-scavenger.jpg';
import { Footer } from '@/components/Footer';
import { ImageWithSkeleton } from '@/components/ImageWithSkeleton';
import { ScavengerNavigation } from '@/components/ScavengerNavigation';
import { ImageAnchor } from '@/shared/types/imageAnchor';

interface ScavengerSplitLayoutProps {
  children: ReactNode;
  showShoppingCart?: boolean;
}

export function ScavengerSplitLayout({
  children,
  showShoppingCart = true,
}: ScavengerSplitLayoutProps) {
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
        <div className='flex-1 lg:w-1/2 flex items-center justify-center lg:overflow-y-auto relative z-10 lg:shadow-[8px_0_24px_-8px_rgba(0,0,0,0.3)] lg:border-r border-border'>
          <div className='absolute inset-0 bg-topographic opacity-15 lg:opacity-25 bg-no-repeat bg-cover bg-center backdrop-blur-sm' />
          <div className='w-full max-w-md px-4 py-6 lg:px-8 lg:py-12 relative z-10'>
            {children}
          </div>
        </div>

        {/* Desktop only: Right side image */}
        <div className='hidden lg:block lg:w-1/2 bg-muted relative overflow-hidden'>
          <ImageWithSkeleton
            src={lfSystemImage}
            alt='LF System'
            anchor={ImageAnchor.TOP}
            className='w-full h-full object-cover brightness-90'
          />
        </div>
      </div>

      <Footer />
    </>
  );
}

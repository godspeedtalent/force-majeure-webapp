import { ReactNode } from 'react';

import { Footer } from '@/components/navigation/Footer';
import { ScavengerNavigation } from '@/components/navigation/ScavengerNavigation';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';

interface ScavengerSplitLayoutProps {
  children: ReactNode;
  showShoppingCart?: boolean;
}

export function ScavengerSplitLayout({
  children,
  showShoppingCart = true,
}: ScavengerSplitLayoutProps) {
  return (
    <>
      <ScavengerNavigation showShoppingCart={showShoppingCart} />

      {/* Desktop: Split layout */}
      <div className='h-[calc(100vh-6.5rem)] flex flex-col lg:flex-row'>
        {/* Left Column - Content */}
        <div className='flex-1 lg:w-1/2 flex items-center justify-center lg:overflow-y-auto relative z-10 lg:shadow-[8px_0_24px_-8px_rgba(0,0,0,0.3)] lg:border-r border-border'>
          <TopographicBackground
            opacity={0.2}
            className='lg:opacity-[0.3] backdrop-blur-sm'
          />
          <div className='w-full max-w-md px-4 py-6 lg:px-8 lg:py-12 relative z-10'>
            {children}
          </div>
        </div>

        {/* Desktop only: Right side decorative background */}
        <div className='hidden lg:block lg:w-1/2 bg-muted relative overflow-hidden'>
          <TopographicBackground opacity={0.4} />
        </div>
      </div>

      <Footer />
    </>
  );
}

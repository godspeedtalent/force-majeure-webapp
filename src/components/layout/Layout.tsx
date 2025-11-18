import { ReactNode } from 'react';
import { cn } from '@/shared/utils/utils';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { Footer } from '@/components/navigation/Footer';
import { Navigation } from '@/components/navigation/Navigation';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';

interface LayoutProps {
  children: ReactNode;
  enableScrollSnap?: boolean;
}

export const Layout = ({ children, enableScrollSnap = false }: LayoutProps) => {
  const isMobile = useIsMobile();

  return (
    <div className='min-h-screen bg-background flex flex-col'>
      <Navigation />

      <main
        className={cn(
          'flex-1 animate-fade-in pb-20 relative overflow-hidden',
          enableScrollSnap && isMobile && 'snap-y snap-mandatory overflow-y-auto'
        )}
        style={
          enableScrollSnap && isMobile
            ? {
                scrollPaddingTop: '64px',
                scrollBehavior: 'smooth',
              }
            : undefined
        }
      >
        <TopographicBackground opacity={0.35} />
        <div className='absolute inset-0 bg-gradient-monochrome opacity-10' />
        <div className='relative'>{children}</div>
      </main>

      <Footer />
    </div>
  );
};

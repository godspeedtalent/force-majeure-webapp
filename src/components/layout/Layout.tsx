import { ReactNode } from 'react';
import { cn } from '@/shared';
import { useIsMobile } from '@/shared';
import { Footer } from '@/components/navigation/Footer';
import { Navigation } from '@/components/navigation/Navigation';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';
import { FmBackButton } from '@/components/common/buttons/FmBackButton';

interface LayoutProps {
  children: ReactNode;
  enableScrollSnap?: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
  backButtonLabel?: string;
  /** Hide footer and remove bottom padding (for single-viewport pages) */
  hideFooter?: boolean;
}

export const Layout = ({
  children,
  enableScrollSnap = false,
  showBackButton = false,
  onBack,
  backButtonLabel,
  hideFooter = false,
}: LayoutProps) => {
  const isMobile = useIsMobile();

  return (
    <div className='min-h-screen bg-background flex flex-col'>
      <Navigation />

      <main
        className={cn(
          'flex-1 animate-fade-in relative overflow-hidden',
          !hideFooter && 'pb-[400px]',
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
        <div className='relative'>
          {showBackButton && (
            <FmBackButton
              position='floating'
              onClick={onBack}
              label={backButtonLabel}
            />
          )}
          {children}
        </div>
      </main>

      {!hideFooter && <Footer />}
    </div>
  );
};

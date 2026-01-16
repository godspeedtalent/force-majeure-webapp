import { ReactNode, useEffect } from 'react';
import { cn } from '@/shared';
import { useIsMobile } from '@/shared';
import { Footer } from '@/components/navigation/Footer';
import { Navigation } from '@/components/navigation/Navigation';
import { FmBackgroundLayer } from '@/components/common/layout/FmBackgroundLayer';
import { useNavigation } from '@/contexts/NavigationContext';

interface LayoutProps {
  children: ReactNode;
  enableScrollSnap?: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
  backButtonLabel?: string;
  /** Hide footer and remove bottom padding (for single-viewport pages) */
  hideFooter?: boolean;
  /** Hide the topographic background (for pages with custom backgrounds) */
  hideBackground?: boolean;
}

export const Layout = ({
  children,
  enableScrollSnap = false,
  showBackButton = false,
  onBack,
  backButtonLabel,
  hideFooter = false,
  hideBackground = false,
}: LayoutProps) => {
  const isMobile = useIsMobile();
  const { setBackButton, clearBackButton } = useNavigation();

  // Set back button in navigation bar when showBackButton is true
  useEffect(() => {
    if (showBackButton) {
      setBackButton({
        show: true,
        onClick: onBack,
        label: backButtonLabel,
      });
    }
    return () => clearBackButton();
  }, [showBackButton, onBack, backButtonLabel, setBackButton, clearBackButton]);

  return (
    <div className={cn('min-h-screen flex flex-col', !hideBackground && 'bg-background')}>
      <Navigation />
      {/* Spacer for fixed navigation */}
      <div className='h-16 flex-shrink-0' />

      <main
        className={cn(
          'flex-1 animate-fade-in relative overflow-hidden',
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
        {!hideBackground && <FmBackgroundLayer />}
        <div className='relative'>
          {children}
        </div>
      </main>

      {!hideFooter && <Footer />}
    </div>
  );
};

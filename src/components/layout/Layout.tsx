import { ReactNode } from 'react';
import { cn } from '@/shared/utils/utils';
import { useIsMobile } from '@/shared/hooks/use-mobile';
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
}

export const Layout = ({
  children,
  enableScrollSnap = false,
  showBackButton = false,
  onBack,
  backButtonLabel,
}: LayoutProps) => {
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

      <Footer />
    </div>
  );
};

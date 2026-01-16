import { ReactNode, useEffect } from 'react';
import { Navigation } from '@/components/navigation/Navigation';
import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';
import { useNavigation } from '@/contexts/NavigationContext';
import { cn } from '@/shared';

interface DemoLayoutProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  children: ReactNode;
  demoTools?: ReactNode;
  condensed?: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
  backButtonLabel?: string;
}

export const DemoLayout = ({
  title,
  description,
  icon: Icon,
  children,
  demoTools: _demoTools,
  condensed = false,
  showBackButton = true,
  onBack,
  backButtonLabel = 'Developer Home',
}: DemoLayoutProps) => {
  const { setBackButton, clearBackButton } = useNavigation();

  // Set back button in navigation bar
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
    <>
      <Navigation />
      <div className='relative min-h-screen overflow-hidden'>
        <TopographicBackground opacity={0.35} />
        <div className='absolute inset-0 bg-gradient-monochrome opacity-10' />

        <div className='container mx-auto pt-24 pb-8 px-4 relative z-10'>
          <div className={cn('mx-auto', condensed ? 'max-w-4xl' : 'max-w-7xl')}>
            {/* Header - Single Row */}
            <div className='mb-4'>
              <div className='flex items-center gap-3 mb-2'>
                <Icon className='h-6 w-6 text-fm-gold' />
                <h1 className='text-3xl font-canela'>{title}</h1>
              </div>
              <p className='text-muted-foreground'>{description}</p>
            </div>

            {/* Decorative Divider */}
            <DecorativeDivider
              marginTop='mt-0'
              marginBottom='mb-8'
              lineWidth='w-32'
              opacity={0.5}
            />

            {/* Main Content Below Divider */}
            <div>{children}</div>
          </div>
        </div>
      </div>
    </>
  );
};

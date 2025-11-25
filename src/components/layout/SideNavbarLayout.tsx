import { ReactNode } from 'react';
import { cn } from '@/shared/utils/utils';
import { useIsMobile } from '@/shared/hooks/use-mobile';
import { Navigation } from '@/components/navigation/Navigation';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';
import {
  FmCommonSideNav,
  FmCommonSideNavGroup,
} from '@/components/common/navigation/FmCommonSideNav';
import { SidebarProvider } from '@/components/common/shadcn/sidebar';
import { FmBackButton } from '@/components/common/buttons/FmBackButton';

interface SideNavbarLayoutProps<T extends string> {
  children: ReactNode;
  /** Navigation groups for the sidebar */
  navigationGroups: FmCommonSideNavGroup<T>[];
  /** Currently active navigation item */
  activeItem: T;
  /** Handler for navigation item changes */
  onItemChange: (item: T) => void;
  /** Show dividers between navigation groups (default: false) */
  showDividers?: boolean;
  /** Whether sidebar is open by default (default: true) */
  defaultOpen?: boolean;
  /** Optional opacity for the topographic background (default: 0.35) */
  backgroundOpacity?: number;
  /** Optional additional classes for the main content container */
  className?: string;
  /** Optional mobile bottom tab bar component */
  mobileTabBar?: ReactNode;
  /** Show back button in top-left (default: false) */
  showBackButton?: boolean;
  /** Custom back button click handler */
  onBack?: () => void;
  /** Text label for back button destination */
  backButtonLabel?: string;
}

/**
 * SideNavbarLayout - Layout for pages with a collapsible sidebar navigation
 *
 * Features:
 * - Top navigation bar
 * - Collapsible sidebar with FmCommonSideNav
 * - Topographic background with gradient overlay
 * - Full-height flex layout
 * - Site-wide tools (Music Player, Dev Tools) are handled at the App level
 *
 * Use this for admin panels, management pages, or any page that needs persistent sidebar navigation.
 */
export const SideNavbarLayout = <T extends string>({
  children,
  navigationGroups,
  activeItem,
  onItemChange,
  showDividers = false,
  defaultOpen = true,
  backgroundOpacity = 0.35,
  className = '',
  mobileTabBar,
  showBackButton = false,
  onBack,
  backButtonLabel,
}: SideNavbarLayoutProps<T>) => {
  const isMobile = useIsMobile();

  return (
    <>
      <Navigation />
      <SidebarProvider defaultOpen={defaultOpen}>
        <div className='flex min-h-screen w-full'>
          {/* Desktop sidebar - hidden on mobile when mobile tab bar is provided */}
          <div className={cn(mobileTabBar && isMobile ? 'hidden' : 'block')}>
            <FmCommonSideNav
              groups={navigationGroups}
              activeItem={activeItem}
              onItemChange={onItemChange}
              showDividers={showDividers}
            />
          </div>

          <main
            className={cn(
              'flex-1 pb-6 px-6 relative overflow-hidden',
              mobileTabBar && isMobile && 'pb-[80px]', // Add bottom padding on mobile to prevent tab bar overlap
              className
            )}
          >
            <TopographicBackground opacity={backgroundOpacity} />
            <div className='absolute inset-0 bg-gradient-monochrome opacity-10' />
            <div className='max-w-full relative z-10 m-10'>
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
        </div>
      </SidebarProvider>

      {/* Mobile bottom tab bar */}
      {mobileTabBar}
    </>
  );
};

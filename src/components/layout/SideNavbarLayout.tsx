import { ReactNode } from 'react';
import { cn } from '@/shared';
import { useIsMobile } from '@/shared';
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
  /** Optional mobile horizontal tabs component (renders at layout level for full width) */
  mobileHorizontalTabs?: ReactNode;
  /** Show back button in top-left (default: false) */
  showBackButton?: boolean;
  /** Custom back button click handler */
  onBack?: () => void;
  /** Text label for back button destination */
  backButtonLabel?: string;
  /** Optional actions to render alongside the back button */
  backButtonActions?: ReactNode;
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
  mobileHorizontalTabs,
  showBackButton = false,
  onBack,
  backButtonLabel,
  backButtonActions,
}: SideNavbarLayoutProps<T>) => {
  const isMobile = useIsMobile();

  // Nav height is h-16 (64px) - content below nav should account for this
  const NAV_HEIGHT = '64px';

  return (
    <div className='min-h-screen flex flex-col bg-background'>
      <Navigation />
      {/* Mobile horizontal tabs - rendered at layout level for full width */}
      {mobileHorizontalTabs}
      <SidebarProvider defaultOpen={defaultOpen}>
        <div
          className='flex flex-1 w-full'
          style={{ minHeight: `calc(100vh - ${NAV_HEIGHT})` }}
        >
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
              'flex-1 relative overflow-hidden',
              !isMobile && 'pb-6 px-6',
              className
            )}
          >
            <TopographicBackground opacity={backgroundOpacity} />
            <div className='absolute inset-0 bg-gradient-monochrome opacity-10' />
            <div
              className={cn(
                'max-w-full relative z-10',
                isMobile ? 'h-full overflow-y-auto px-[15vw] py-4' : 'm-10',
                isMobile && mobileTabBar && 'pb-[120px]' // Extra padding for mobile tab bar (~70px + safe area + spacing)
              )}
            >
              {(showBackButton || backButtonActions) && (
                <div className='mb-[20px] flex items-center justify-between'>
                  {showBackButton ? (
                    <FmBackButton
                      position='inline'
                      onClick={onBack}
                      label={backButtonLabel}
                    />
                  ) : (
                    <div />
                  )}
                  {backButtonActions}
                </div>
              )}
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>

      {/* Mobile bottom tab bar */}
      {mobileTabBar}
    </div>
  );
};

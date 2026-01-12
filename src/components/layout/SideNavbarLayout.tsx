import { ReactNode } from 'react';
import { cn } from '@/shared';
import { useIsMobile } from '@/shared';
import { Navigation } from '@/components/navigation/Navigation';
import { Footer } from '@/components/navigation/Footer';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';
import {
  FmCommonSideNav,
  FmCommonSideNavGroup,
} from '@/components/common/navigation/FmCommonSideNav';
import { SidebarProvider } from '@/components/common/shadcn/sidebar';
import { FmBackButton } from '@/components/common/buttons/FmBackButton';
import { FmContentContainer } from '@/components/common/layout/FmContentContainer';
import type { ContentWidth } from '@/shared/constants/designSystem';

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
  /**
   * Default content width for children (default: undefined = full width for backwards compatibility)
   * When set, wraps children in FmContentContainer with the specified width.
   * Use 'READABLE' for forms, 'WIDE' for data grids with scrollable content.
   */
  contentWidth?: ContentWidth;
  /** Enable horizontal scrolling when contentWidth is set (default: false) */
  contentScrollable?: boolean;
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
  contentWidth,
  contentScrollable = false,
}: SideNavbarLayoutProps<T>) => {
  const isMobile = useIsMobile();

  return (
    <div className='h-screen bg-background flex flex-col overflow-hidden'>
      {/* Fixed Navigation */}
      <Navigation />

      {/* Spacer for fixed nav */}
      <div className='h-16 flex-shrink-0' />

      {/* Mobile horizontal tabs - rendered at layout level for full width */}
      {mobileHorizontalTabs}

      {/* Content area - flex row with sidebar and main content, both independently scrollable */}
      <SidebarProvider defaultOpen={defaultOpen} className='flex-1 flex min-h-0'>
        {/* Desktop sidebar - hidden on mobile when mobile tab bar is provided */}
        {/* z-20 ensures sidebar appears above the fixed TopographicBackground */}
        <div className={cn('relative z-20', mobileTabBar && isMobile ? 'hidden' : 'flex')}>
          <FmCommonSideNav
            groups={navigationGroups}
            activeItem={activeItem}
            onItemChange={onItemChange}
            showDividers={showDividers}
          />
        </div>

        <main
          className={cn(
            'flex-1 relative overflow-y-auto overflow-x-hidden',
            className
          )}
        >
          <TopographicBackground opacity={backgroundOpacity} />
          <div className='absolute inset-0 bg-gradient-monochrome opacity-10 pointer-events-none' />
          <div
            className={cn(
              'relative z-10 p-6 pb-16', // pb-16 accounts for fixed footer height
              isMobile && 'px-4 py-4',
              isMobile && mobileTabBar && 'pb-[120px]'
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
            {contentWidth ? (
              <FmContentContainer width={contentWidth} scrollable={contentScrollable}>
                {children}
              </FmContentContainer>
            ) : (
              children
            )}
          </div>
        </main>
      </SidebarProvider>

      {/* Mobile bottom tab bar */}
      {mobileTabBar}

      {/* Full-width footer at bottom - fixed to span entire viewport */}
      <div className='fixed bottom-0 left-0 right-0 z-30'>
        <Footer />
      </div>
    </div>
  );
};

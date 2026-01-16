import { ReactNode, useEffect } from 'react';
import { cn } from '@/shared';
import { useIsMobile } from '@/shared';
import { Navigation } from '@/components/navigation/Navigation';
import { Footer } from '@/components/navigation/Footer';
import { FmBackgroundLayer } from '@/components/common/layout/FmBackgroundLayer';
import {
  FmCommonSideNav,
  FmCommonSideNavGroup,
} from '@/components/common/navigation/FmCommonSideNav';
import { SidebarProvider } from '@/components/common/shadcn/sidebar';
import { FmContentContainer } from '@/components/common/layout/FmContentContainer';
import { useNavigation } from '@/contexts/NavigationContext';
import type { ContentWidth } from '@/shared/constants/designSystem';

interface SidebarLayoutProps<T extends string> {
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
  /** Optional additional classes for the root layout container (e.g., 'test-mode') */
  rootClassName?: string;
  /** Optional header content for the sidebar (e.g., tenant/organization selector) */
  sidebarHeader?: ReactNode;
}

/**
 * SidebarLayout - Layout for pages with a collapsible sidebar navigation
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
export const SidebarLayout = <T extends string>({
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
  rootClassName = '',
  sidebarHeader,
}: SidebarLayoutProps<T>) => {
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
    <div className={cn('h-screen bg-background flex flex-col overflow-hidden', rootClassName)}>
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
            sidebarHeader={sidebarHeader}
          />
        </div>

        <main
          className={cn(
            'flex-1 relative overflow-y-auto overflow-x-hidden',
            className
          )}
        >
          <FmBackgroundLayer opacity={backgroundOpacity} showGradient={false} />
          <div
            className={cn(
              'relative z-10 p-6 pb-16', // pb-16 accounts for fixed footer height
              isMobile && 'px-4 py-4',
              isMobile && mobileTabBar && 'pb-[120px]'
            )}
          >
            {backButtonActions && (
              <div className='mb-[20px] flex items-center justify-end'>
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

/** @deprecated Use SidebarLayout instead */
export const SideNavbarLayout = SidebarLayout;

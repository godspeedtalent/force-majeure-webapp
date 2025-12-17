import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { useIsMobile } from '@/shared';
import { ROLES } from '@/shared';
import { FmMobileDevFAB } from './FmMobileDevFAB';
import { FmMobileDevDrawer } from './FmMobileDevDrawer';
import { FmMobileDevToolContent } from './FmMobileDevToolContent';
import { useMobileDevTools } from './useMobileDevTools';

/**
 * Mobile Developer Toolbar
 *
 * Provides on-the-fly access to developer tools on mobile devices.
 * Consists of:
 * - Floating Action Button (FAB) in bottom-right corner
 * - Bottom sheet drawer with tool grid
 * - Nested drawers for individual tool content
 *
 * Only visible on mobile (< 768px) and to users with ADMIN or DEVELOPER roles.
 *
 * @example
 * ```tsx
 * // Add to your root layout
 * <FmMobileDevToolbar />
 * ```
 */
export function FmMobileDevToolbar() {
  const isMobile = useIsMobile();
  const { hasRole, isAdmin } = useUserPermissions();

  const {
    isMainDrawerOpen,
    openMainDrawer,
    closeMainDrawer,
    activeTool,
    openTool,
    closeTool,
    badges,
    totalBadges,
  } = useMobileDevTools();

  // Only show to admin/developer roles
  const canAccessDevTools =
    hasRole(ROLES.ADMIN) || hasRole(ROLES.DEVELOPER);

  // Don't render if not mobile or user doesn't have access
  if (!isMobile || !canAccessDevTools) {
    return null;
  }

  const handleMainDrawerChange = (open: boolean) => {
    if (open) {
      openMainDrawer();
    } else {
      closeMainDrawer();
    }
  };

  const handleToolDrawerClose = () => {
    closeTool();
    // Keep main drawer open when closing tool drawer
  };

  return (
    <>
      {/* Floating Action Button */}
      <FmMobileDevFAB
        onClick={openMainDrawer}
        badgeCount={totalBadges}
      />

      {/* Main Tool Selection Drawer */}
      <FmMobileDevDrawer
        open={isMainDrawerOpen}
        onOpenChange={handleMainDrawerChange}
        onToolSelect={openTool}
        badges={badges}
      />

      {/* Nested Tool Content Drawer */}
      <FmMobileDevToolContent
        toolId={activeTool}
        open={activeTool !== null}
        onClose={handleToolDrawerClose}
        isAdmin={isAdmin()}
      />
    </>
  );
}

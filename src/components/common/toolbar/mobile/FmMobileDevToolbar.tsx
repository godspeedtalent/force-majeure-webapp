import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { useIsMobile, ROLES, useShoppingCart } from '@/shared';
import { useAuth } from '@/features/auth/services/AuthContext';
import { FmMobileToolbarHandle } from './FmMobileToolbarHandle';
import { FmMobileDevDrawer } from './FmMobileDevDrawer';
import { FmMobileDevToolContent } from './FmMobileDevToolContent';
import { useMobileDevTools } from './useMobileDevTools';

/**
 * Mobile Developer Toolbar
 *
 * Provides on-the-fly access to developer tools on mobile devices.
 * Consists of:
 * - Floating Action Button (FAB) in bottom-right corner
 * - Bottom sheet drawer with tool grid (organized in collapsible groups)
 * - Nested drawers for individual tool content
 *
 * Tool groups:
 * - User: Cart (visible with cart items)
 * - Admin: Admin Messages (admin only)
 * - Organization: Org Dashboard, Scan Tickets (org access required)
 * - Staff: Navigation, Notes (staff+ roles)
 * - Developer: Page Info, Mock Roles (dev/admin only)
 * - Data & Config: Database, Features, Error Logs (dev/admin only)
 *
 * Only visible on mobile (< 768px) and to users with appropriate roles.
 *
 * @example
 * ```tsx
 * // Add to your root layout
 * <FmMobileDevToolbar />
 * ```
 */
export function FmMobileDevToolbar() {
  const isMobile = useIsMobile();
  const { hasRole, hasAnyRole, isAdmin: checkIsAdmin } = useUserPermissions();
  const { user, profile } = useAuth();
  const { getTotalItems } = useShoppingCart();

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

  const location = useLocation();
  const prevLocationRef = useRef(location.pathname);

  // Close drawer on navigation
  useEffect(() => {
    if (prevLocationRef.current !== location.pathname) {
      closeMainDrawer();
      prevLocationRef.current = location.pathname;
    }
  }, [location.pathname, closeMainDrawer]);

  // Role checks
  const isAdmin = checkIsAdmin();
  const canAccessDevTools = hasRole(ROLES.ADMIN) || hasRole(ROLES.DEVELOPER);
  const canAccessStaffTools = hasRole(ROLES.FM_STAFF) || canAccessDevTools;

  // Organization access: Admins/Developers always have access, org staff need organization_id
  const hasOrgAccess =
    hasAnyRole(ROLES.ADMIN, ROLES.DEVELOPER) ||
    (profile?.organization_id &&
      hasAnyRole(ROLES.ORG_ADMIN, ROLES.ORG_STAFF));

  // Cart items check
  const hasCartItems = Boolean(user) && getTotalItems() > 0;

  // Don't render if not mobile or user doesn't have any toolbar access
  if (!isMobile || !canAccessStaffTools) {
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
      {/* Bottom Handle Bar */}
      <FmMobileToolbarHandle
        onClick={openMainDrawer}
        badgeCount={totalBadges}
      />

      {/* Main Tool Selection Drawer */}
      <FmMobileDevDrawer
        open={isMainDrawerOpen}
        onOpenChange={handleMainDrawerChange}
        onToolSelect={openTool}
        badges={badges}
        canAccessDevTools={canAccessDevTools}
        isAdmin={isAdmin}
        hasOrgAccess={Boolean(hasOrgAccess)}
        hasCartItems={hasCartItems}
      />

      {/* Nested Tool Content Drawer */}
      <FmMobileDevToolContent
        toolId={activeTool}
        open={activeTool !== null}
        onClose={handleToolDrawerClose}
        isAdmin={isAdmin}
      />
    </>
  );
}

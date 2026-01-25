import { useState, useCallback } from 'react';

export type MobileDevToolId =
  // Staff tools
  | 'navigation'
  | 'notes'
  | 'demoMode'
  // Developer tools
  | 'pageInfo'
  | 'roles'
  // Data & Config tools
  | 'database'
  | 'features'
  | 'errorLogs'
  // Admin tools
  | 'adminMessages'
  // User tools
  | 'cart'
  // Organization tools
  | 'orgDashboard'
  | 'scanTickets';

export interface MobileDevTool {
  id: MobileDevToolId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface UseMobileDevToolsReturn {
  // Main drawer state
  isMainDrawerOpen: boolean;
  openMainDrawer: () => void;
  closeMainDrawer: () => void;
  toggleMainDrawer: () => void;

  // Tool drawer state
  activeTool: MobileDevToolId | null;
  openTool: (toolId: MobileDevToolId) => void;
  closeTool: () => void;

  // Badge management
  badges: Record<MobileDevToolId, number>;
  setBadge: (toolId: MobileDevToolId, count: number) => void;
  clearBadge: (toolId: MobileDevToolId) => void;
  totalBadges: number;
}

/**
 * Shared state management hook for mobile developer toolbar
 * Manages drawer open/close state, active tool selection, and notification badges
 */
export function useMobileDevTools(): UseMobileDevToolsReturn {
  const [isMainDrawerOpen, setIsMainDrawerOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<MobileDevToolId | null>(null);
  const [badges, setBadges] = useState<Record<MobileDevToolId, number>>({
    // Staff tools
    navigation: 0,
    notes: 0,
    demoMode: 0,
    // Developer tools
    pageInfo: 0,
    roles: 0,
    // Data & Config tools
    database: 0,
    features: 0,
    errorLogs: 0,
    // Admin tools
    adminMessages: 0,
    // User tools
    cart: 0,
    // Organization tools
    orgDashboard: 0,
    scanTickets: 0,
  });

  const openMainDrawer = useCallback(() => {
    setIsMainDrawerOpen(true);
  }, []);

  const closeMainDrawer = useCallback(() => {
    setIsMainDrawerOpen(false);
    // Also close active tool when main drawer closes
    setActiveTool(null);
  }, []);

  const toggleMainDrawer = useCallback(() => {
    setIsMainDrawerOpen(prev => !prev);
    if (isMainDrawerOpen) {
      setActiveTool(null);
    }
  }, [isMainDrawerOpen]);

  const openTool = useCallback((toolId: MobileDevToolId) => {
    setActiveTool(toolId);
    // Clear badge when opening tool
    setBadges(prev => ({ ...prev, [toolId]: 0 }));
  }, []);

  const closeTool = useCallback(() => {
    setActiveTool(null);
  }, []);

  const setBadge = useCallback((toolId: MobileDevToolId, count: number) => {
    setBadges(prev => ({ ...prev, [toolId]: Math.max(0, count) }));
  }, []);

  const clearBadge = useCallback((toolId: MobileDevToolId) => {
    setBadges(prev => ({ ...prev, [toolId]: 0 }));
  }, []);

  const totalBadges = Object.values(badges).reduce(
    (sum, count) => sum + count,
    0
  );

  return {
    isMainDrawerOpen,
    openMainDrawer,
    closeMainDrawer,
    toggleMainDrawer,
    activeTool,
    openTool,
    closeTool,
    badges,
    setBadge,
    clearBadge,
    totalBadges,
  };
}

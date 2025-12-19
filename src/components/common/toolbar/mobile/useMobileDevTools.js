import { useState, useCallback } from 'react';
/**
 * Shared state management hook for mobile developer toolbar
 * Manages drawer open/close state, active tool selection, and notification badges
 */
export function useMobileDevTools() {
    const [isMainDrawerOpen, setIsMainDrawerOpen] = useState(false);
    const [activeTool, setActiveTool] = useState(null);
    const [badges, setBadges] = useState({
        navigation: 0,
        database: 0,
        features: 0,
        session: 0,
        notes: 0,
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
    const openTool = useCallback((toolId) => {
        setActiveTool(toolId);
        // Clear badge when opening tool
        setBadges(prev => ({ ...prev, [toolId]: 0 }));
    }, []);
    const closeTool = useCallback(() => {
        setActiveTool(null);
    }, []);
    const setBadge = useCallback((toolId, count) => {
        setBadges(prev => ({ ...prev, [toolId]: Math.max(0, count) }));
    }, []);
    const clearBadge = useCallback((toolId) => {
        setBadges(prev => ({ ...prev, [toolId]: 0 }));
    }, []);
    const totalBadges = Object.values(badges).reduce((sum, count) => sum + count, 0);
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

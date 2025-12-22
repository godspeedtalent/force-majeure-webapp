import { useEffect, useState } from 'react';
import { logger } from '@/shared';
import { useLocation } from 'react-router-dom';
import { findRouteConfig } from '@/config/routes';
/**
 * Custom hook for generating breadcrumbs from the current route
 * Supports nested routes, dynamic segments, and async label resolution
 */
export const useBreadcrumbs = () => {
    const location = useLocation();
    const [breadcrumbs, setBreadcrumbs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    useEffect(() => {
        const generateBreadcrumbs = async () => {
            const pathSegments = location.pathname.split('/').filter(Boolean);
            if (pathSegments.length === 0) {
                setBreadcrumbs([]);
                return;
            }
            setIsLoading(true);
            const items = [];
            // Check if the full path has skipParentInBreadcrumb set
            const fullPath = location.pathname;
            const fullRouteMatch = findRouteConfig(fullPath);
            const skipParents = fullRouteMatch?.config.skipParentInBreadcrumb === true;
            // Build breadcrumbs by walking through path segments
            for (let i = 0; i < pathSegments.length; i++) {
                const currentPath = '/' + pathSegments.slice(0, i + 1).join('/');
                const isLast = i === pathSegments.length - 1;
                // Skip parent segments if the final route has skipParentInBreadcrumb
                if (skipParents && !isLast) {
                    continue;
                }
                // Find route config for this path
                const routeMatch = findRouteConfig(currentPath);
                if (routeMatch) {
                    const { config, params } = routeMatch;
                    // Skip if explicitly hidden
                    if (config.showInBreadcrumb === false) {
                        continue;
                    }
                    let label = config.label;
                    // Resolve async labels
                    if (config.async && config.resolver) {
                        try {
                            label = await config.resolver(params);
                        }
                        catch (error) {
                            logger.error('Failed to resolve breadcrumb label:', { error });
                            label = config.label; // Fallback to default label
                        }
                    }
                    items.push({
                        label,
                        path: currentPath,
                        isLast,
                    });
                }
                else {
                    // No config found - use capitalized segment name
                    const label = pathSegments[i]
                        .split('-')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ');
                    // Skip the leading "Event" breadcrumb on event detail/admin pages
                    if (currentPath === '/event') {
                        continue;
                    }
                    items.push({
                        label,
                        path: currentPath,
                        isLast,
                    });
                }
            }
            setBreadcrumbs(items);
            setIsLoading(false);
        };
        generateBreadcrumbs();
    }, [location.pathname]);
    return { breadcrumbs, isLoading };
};

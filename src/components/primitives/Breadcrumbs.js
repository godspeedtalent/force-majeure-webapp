import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, } from '@/components/common/shadcn/breadcrumb';
import { useBreadcrumbs } from '@/shared/hooks/useBreadcrumbs';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { ROLES } from '@/shared';
import { cn } from '@/shared';
/**
 * Comprehensive breadcrumb navigation component
 * Automatically generates breadcrumbs based on current route
 * Supports nested routes, dynamic segments, and async data resolution
 */
export const Breadcrumbs = () => {
    const { breadcrumbs, isLoading } = useBreadcrumbs();
    const navigate = useNavigate();
    const { hasRole } = useUserPermissions();
    const [animatingAfter, setAnimatingAfter] = useState(null);
    const isAdminOrDeveloper = hasRole(ROLES.ADMIN) || hasRole(ROLES.DEVELOPER);
    // Don't render anything if no breadcrumbs (including the separator)
    if (breadcrumbs.length === 0) {
        return null;
    }
    const handleBreadcrumbClick = (path, index, label) => {
        // Trigger animation for all breadcrumbs after this one
        setAnimatingAfter(index);
        // Navigate after animation starts
        setTimeout(() => {
            let targetPath = path;
            // If user is admin/developer, redirect Artists/Events breadcrumbs to database
            if (isAdminOrDeveloper) {
                // Check if this is an event detail page or artists page
                if (path.startsWith('/event/') || label.toLowerCase() === 'events') {
                    targetPath = '/developer/database?table=events';
                }
                else if (path.startsWith('/artist/') || label.toLowerCase() === 'artists') {
                    targetPath = '/developer/database?table=artists';
                }
            }
            navigate(targetPath);
            setAnimatingAfter(null);
        }, 300);
    };
    return (_jsxs(_Fragment, { children: [_jsx("span", { className: 'mx-3 text-muted-foreground', children: ">" }), _jsx(Breadcrumb, { children: _jsx(BreadcrumbList, { children: breadcrumbs.map((item, index) => {
                        const shouldAnimate = animatingAfter !== null && index > animatingAfter;
                        return (_jsxs("div", { className: cn('flex items-center gap-1.5 transition-all duration-300', shouldAnimate && 'opacity-0 -translate-y-2'), children: [index > 0 && _jsx(BreadcrumbSeparator, {}), _jsx(BreadcrumbItem, { children: item.isLast ? (_jsx(BreadcrumbPage, { children: isLoading ? (_jsxs("span", { className: 'flex items-center gap-1', children: [_jsx("div", { className: 'h-3 w-3 animate-spin rounded-full border-2 border-fm-gold border-b-transparent' }), item.label] })) : (item.label) })) : (_jsx(BreadcrumbLink, { asChild: true, children: _jsx("button", { onClick: e => {
                                                e.preventDefault();
                                                handleBreadcrumbClick(item.path, index, item.label);
                                            }, className: 'hover:underline cursor-pointer', children: item.label }) })) })] }, item.path));
                    }) }) })] }));
};

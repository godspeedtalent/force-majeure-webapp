import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect } from 'react';
import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { FmCommonLoadingState } from '@/components/common/feedback/FmCommonLoadingState';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { useAuth } from '@/features/auth/services/AuthContext';
/**
 * Route-level protection based on permissions/roles
 * Redirects unauthorized users to a specified route
 *
 * NOTE: Users with the 'admin' role automatically pass ALL permission and role checks
 * without needing to be assigned individual permissions or roles.
 *
 * @example
 * // Protect route by permission (admins bypass this check)
 * <Route
 *   path="/organization/tools"
 *   element={
 *     <ProtectedRoute permission={PERMISSIONS.MANAGE_ORGANIZATION}>
 *       <OrganizationTools />
 *     </ProtectedRoute>
 *   }
 * />
 *
 * @example
 * // Protect route by role (admins bypass this check)
 * <Route
 *   path="/dev/controls"
 *   element={
 *     <ProtectedRoute role={ROLES.DEVELOPER}>
 *       <DevControls />
 *     </ProtectedRoute>
 *   }
 * />
 *
 * @example
 * // Require multiple permissions (admins bypass this check)
 * <Route
 *   path="/advanced-tools"
 *   element={
 *     <ProtectedRoute
 *       permission={[PERMISSIONS.MANAGE_EVENTS, PERMISSIONS.SCAN_TICKETS]}
 *       requireAll
 *     >
 *       <AdvancedTools />
 *     </ProtectedRoute>
 *   }
 * />
 */
export const ProtectedRoute = ({ children, permission, role, requireAll = false, redirectTo, }) => {
    const { user, loading: authLoading } = useAuth();
    const { hasAllPermissions, hasAnyPermission, hasAnyRole, roles } = useUserPermissions();
    const navigate = useNavigate();
    const location = useLocation();
    const isLoading = authLoading || (user && !roles);
    useEffect(() => {
        if (isLoading)
            return;
        // Not authenticated - redirect to auth page
        if (!user) {
            navigate(redirectTo || '/auth', {
                replace: true,
                state: { from: location },
            });
            return;
        }
        // If no permission/role requirements, just need to be authenticated
        if (!permission && !role) {
            return;
        }
        // Check permissions
        let hasAccess = true;
        if (permission) {
            const permissions = Array.isArray(permission) ? permission : [permission];
            hasAccess = requireAll
                ? hasAllPermissions(...permissions)
                : hasAnyPermission(...permissions);
        }
        // Check roles
        if (hasAccess && role) {
            const rolesList = Array.isArray(role) ? role : [role];
            hasAccess = hasAnyRole(...rolesList);
        }
        // Unauthorized - redirect to home or specified route
        if (!hasAccess) {
            navigate(redirectTo || '/', { replace: true });
        }
    }, [
        isLoading,
        user,
        navigate,
        redirectTo,
        permission,
        role,
        requireAll,
        hasAllPermissions,
        hasAnyPermission,
        hasAnyRole,
        location,
    ]);
    if (isLoading) {
        return _jsx(FmCommonLoadingState, {});
    }
    if (!user) {
        return (_jsx(Navigate, { to: redirectTo || '/auth', state: { from: location }, replace: true }));
    }
    // If no permission/role requirements, just need to be authenticated
    if (!permission && !role) {
        return _jsx(_Fragment, { children: children });
    }
    // Final access check before rendering
    let hasAccess = true;
    if (permission) {
        const permissions = Array.isArray(permission) ? permission : [permission];
        hasAccess = requireAll
            ? hasAllPermissions(...permissions)
            : hasAnyPermission(...permissions);
    }
    if (hasAccess && role) {
        const rolesList = Array.isArray(role) ? role : [role];
        hasAccess = hasAnyRole(...rolesList);
    }
    if (!hasAccess) {
        return _jsx(Navigate, { to: redirectTo || '/', replace: true });
    }
    return _jsx(_Fragment, { children: children });
};

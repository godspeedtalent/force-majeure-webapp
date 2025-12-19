import { jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Navigate } from 'react-router-dom';
import { FmCommonLoadingState } from '@/components/common/feedback/FmCommonLoadingState';
import { useAuth } from '@/features/auth/services/AuthContext';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { ROLES } from '@/shared';
/**
 * Protects demo routes by requiring:
 * 1. User to be authenticated
 * 2. User to have either 'developer' or 'admin' role
 */
export const DemoProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    const { hasAnyRole, roles } = useUserPermissions();
    // Still loading
    if (loading || roles === undefined) {
        return _jsx(FmCommonLoadingState, {});
    }
    // Check if user is authenticated
    if (!user) {
        return _jsx(Navigate, { to: '/', replace: true });
    }
    // Check if user has developer or admin role
    const hasDeveloperAccess = hasAnyRole(ROLES.DEVELOPER, ROLES.ADMIN);
    // Access denied
    if (!hasDeveloperAccess) {
        return _jsx(Navigate, { to: '/', replace: true });
    }
    // Access granted
    return _jsx(_Fragment, { children: children });
};

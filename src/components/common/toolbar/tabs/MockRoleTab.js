import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { User, UserCog, Shield, Building2, Users, Home, X, AlertTriangle, Loader2, } from 'lucide-react';
import { useMockRole } from '@/shared/contexts/MockRoleContext';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { useRoles } from '@/shared/hooks/useRoles';
import { cn } from '@/shared';
import { Button } from '@/components/common/shadcn/button';
/**
 * Icon mapping for known role types
 * Falls back to User icon for unknown roles
 */
const roleIconMap = {
    admin: Shield,
    developer: UserCog,
    org_admin: Building2,
    org_staff: Users,
    venue_admin: Home,
    user: User,
};
const getIconForRole = (roleName) => {
    return roleIconMap[roleName] || User;
};
export const MockRoleTabContent = () => {
    const { t } = useTranslation('common');
    const { mockRole, setMockRole, isMockActive, clearMockRole } = useMockRole();
    const { actualRoles } = useUserPermissions();
    const { roles: availableRoles, loading: rolesLoading, loaded: rolesLoaded } = useRoles();
    const handleRoleSelect = (roleName) => {
        if (roleName === mockRole) {
            clearMockRole();
        }
        else {
            setMockRole(roleName);
        }
    };
    const getPermissionCount = (role) => {
        const permissions = role.permissions || [];
        return permissions.includes('*') ? Infinity : permissions.length;
    };
    // Get the display name for the current mock role
    const getMockRoleDisplayName = () => {
        if (mockRole === 'disabled')
            return '';
        const role = availableRoles.find(r => r.name === mockRole);
        return role?.display_name || mockRole;
    };
    return (_jsxs("div", { className: 'space-y-6', children: [isMockActive && (_jsxs("div", { className: 'bg-fm-gold/20 border border-fm-gold/50 p-3 flex items-start gap-3', children: [_jsx(AlertTriangle, { className: 'h-5 w-5 text-fm-gold flex-shrink-0 mt-0.5' }), _jsxs("div", { className: 'flex-1', children: [_jsx("p", { className: 'text-sm font-medium text-fm-gold', children: t('mockRole.activeWarning') }), _jsx("p", { className: 'text-xs text-white/70 mt-1', children: t('mockRole.activeDescription', {
                                    role: getMockRoleDisplayName(),
                                }) })] }), _jsx(Button, { variant: 'ghost', size: 'icon', className: 'h-6 w-6 text-fm-gold hover:bg-fm-gold/20', onClick: clearMockRole, children: _jsx(X, { className: 'h-4 w-4' }) })] })), _jsx("div", { children: _jsx("p", { className: 'text-xs text-white/50', children: t('mockRole.description') }) }), _jsxs("div", { className: 'bg-white/5 border border-white/10 p-3', children: [_jsx("p", { className: 'text-xs text-white/50 uppercase tracking-wider mb-2', children: t('mockRole.yourActualRoles') }), _jsx("div", { className: 'flex flex-wrap gap-2', children: actualRoles && actualRoles.length > 0 ? (actualRoles.map(role => (_jsx("span", { className: 'px-2 py-1 bg-white/10 text-xs text-white/80', children: role.display_name || role.role_name }, role.role_name)))) : (_jsx("span", { className: 'text-xs text-white/50 italic', children: t('mockRole.noRoles') })) })] }), _jsxs("div", { className: 'space-y-2', children: [_jsx("p", { className: 'text-xs text-white/50 uppercase tracking-wider', children: t('mockRole.simulateRole') }), rolesLoading && !rolesLoaded ? (_jsx("div", { className: 'flex items-center justify-center py-8', children: _jsx(Loader2, { className: 'h-6 w-6 text-white/50 animate-spin' }) })) : availableRoles.length === 0 ? (_jsx("div", { className: 'text-center py-8', children: _jsx("p", { className: 'text-xs text-white/50', children: t('mockRole.noRolesAvailable') }) })) : (_jsx("div", { className: 'space-y-2', children: availableRoles.map(role => {
                            const Icon = getIconForRole(role.name);
                            const isSelected = mockRole === role.name;
                            const permissionCount = getPermissionCount(role);
                            return (_jsxs("button", { onClick: () => handleRoleSelect(role.name), className: cn('w-full flex items-start gap-3 p-3 text-left transition-all duration-200', 'border hover:scale-[1.01]', isSelected
                                    ? 'bg-fm-gold/20 border-fm-gold/50 shadow-[0_0_12px_rgba(223,186,125,0.2)]'
                                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'), children: [_jsx("div", { className: cn('p-2 flex-shrink-0 transition-colors', isSelected ? 'bg-fm-gold/30' : 'bg-white/10'), children: _jsx(Icon, { className: cn('h-4 w-4', isSelected ? 'text-fm-gold' : 'text-white/70') }) }), _jsxs("div", { className: 'flex-1 min-w-0', children: [_jsxs("div", { className: 'flex items-center justify-between gap-2', children: [_jsx("span", { className: cn('font-medium text-sm', isSelected ? 'text-fm-gold' : 'text-white'), children: role.display_name }), _jsx("span", { className: 'text-[10px] text-white/40', children: permissionCount === Infinity
                                                            ? t('mockRole.allPermissions')
                                                            : t('mockRole.permissionCount', { count: permissionCount }) })] }), role.description && (_jsx("p", { className: 'text-xs text-white/50 mt-0.5', children: role.description }))] })] }, role.id));
                        }) }))] }), isMockActive && (_jsxs(Button, { variant: 'outline', className: 'w-full border-white/20 hover:bg-white/10', onClick: clearMockRole, children: [_jsx(X, { className: 'h-4 w-4 mr-2' }), t('mockRole.clearSimulation')] }))] }));
};

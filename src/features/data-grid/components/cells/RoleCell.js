import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Shield, User, Building2, Code } from 'lucide-react';
import { Badge } from '@/components/common/shadcn/badge';
const ROLE_ICONS = {
    admin: Shield,
    developer: Code,
    org_admin: Building2,
    org_staff: User,
    user: User,
};
const ROLE_COLORS = {
    admin: 'text-fm-danger',
    developer: 'text-fm-gold',
    org_admin: 'text-fm-navy',
    org_staff: 'text-muted-foreground',
    user: 'text-muted-foreground',
};
/**
 * RoleCell - Displays user roles as badges
 *
 * Features:
 * - Role-specific icons and colors
 * - Click to manage roles (if onClick provided)
 * - Graceful handling of empty roles
 */
export function RoleCell({ roles, onClick, emptyText = 'No roles' }) {
    if (!roles || roles.length === 0) {
        return _jsx("span", { className: 'text-muted-foreground text-sm', children: emptyText });
    }
    return (_jsx("div", { className: `flex flex-wrap gap-1 ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`, onClick: onClick, children: roles.map(role => {
            const roleName = role.role_name.toLowerCase();
            const Icon = ROLE_ICONS[roleName] || User;
            const colorClass = ROLE_COLORS[roleName] ||
                'text-muted-foreground';
            return (_jsxs(Badge, { variant: 'outline', className: 'gap-1', children: [_jsx(Icon, { className: `h-3 w-3 ${colorClass}` }), _jsx("span", { className: 'text-xs', children: role.display_name || role.role_name })] }, role.role_name));
        }) }));
}

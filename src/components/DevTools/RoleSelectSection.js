import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { User, UserCog, Shield, UserX, BarChart3, Settings, FlaskConical, Package, } from 'lucide-react';
import { FmCommonDropdown, } from '@/components/common/forms/FmCommonDropdown';
import { Button } from '@/components/common/shadcn/button';
import { FmCommonToggleHeader } from '@/components/common/forms/FmCommonToggleHeader';
import { FmCommonNavigationButton } from '@/components/common/buttons/FmCommonNavigationButton';
const roleConfig = {
    unauthenticated: { label: 'Unauthenticated', icon: UserX },
    fan: { label: 'Fan (User)', icon: User },
    developer: { label: 'Developer', icon: UserCog },
    admin: { label: 'Admin', icon: Shield },
};
export const RoleSelectSection = ({ currentRole, onRoleChange, }) => {
    const roleItems = Object.keys(roleConfig).map(role => ({
        label: roleConfig[role].label,
        onClick: () => onRoleChange(role),
        icon: roleConfig[role].icon,
    }));
    const effectiveRole = currentRole || 'fan';
    const CurrentIcon = roleConfig[effectiveRole].icon;
    return (_jsxs("div", { className: 'space-y-6', children: [_jsx(FmCommonToggleHeader, { title: 'Quick Navigation', defaultOpen: true, children: _jsxs("div", { className: 'space-y-2', children: [_jsx("p", { className: 'text-xs text-white/50 mb-3', children: "Quick navigation to developer-only pages and tools" }), _jsx(FmCommonNavigationButton, { to: '/developer', label: 'Developer Tools', icon: Package, description: 'Component catalog and developer resources', variant: 'outline' }), _jsx(FmCommonNavigationButton, { to: '/testing', label: 'Testing Dashboard', icon: FlaskConical, description: 'Run smoke tests and validations', variant: 'outline' }), _jsx(FmCommonNavigationButton, { to: '/admin/statistics', label: 'Statistics', icon: BarChart3, description: 'View application metrics', variant: 'outline' }), _jsx(FmCommonNavigationButton, { to: '/admin/controls', label: 'Admin Controls', icon: Settings, description: 'Manage users and settings', variant: 'outline' })] }) }), _jsx(FmCommonToggleHeader, { title: 'Role Select', defaultOpen: true, children: _jsxs("div", { children: [_jsx("p", { className: 'text-xs text-white/50 mb-3', children: "Simulate different user roles to test permissions and access control" }), _jsx(FmCommonDropdown, { trigger: _jsx(Button, { variant: 'outline', className: 'w-full justify-between bg-white/5 border-white/30 hover:bg-white/10 text-white pr-10', children: _jsxs("span", { className: 'flex items-center gap-2', children: [_jsx(CurrentIcon, { className: 'h-4 w-4' }), roleConfig[effectiveRole].label] }) }), items: roleItems, align: 'start' })] }) })] }));
};

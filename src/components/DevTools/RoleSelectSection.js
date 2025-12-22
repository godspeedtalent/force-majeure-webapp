import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { User, UserCog, Shield, UserX, BarChart3, Settings, FlaskConical, Package, } from 'lucide-react';
import { FmCommonDropdown, } from '@/components/common/forms/FmCommonDropdown';
import { Button } from '@/components/common/shadcn/button';
import { FmCommonToggleHeader } from '@/components/common/forms/FmCommonToggleHeader';
import { FmCommonNavigationButton } from '@/components/common/buttons/FmCommonNavigationButton';
const roleIcons = {
    unauthenticated: UserX,
    fan: User,
    developer: UserCog,
    admin: Shield,
};
export const RoleSelectSection = ({ currentRole, onRoleChange, }) => {
    const { t } = useTranslation('common');
    const getRoleLabel = (role) => t(`roleSelect.roles.${role}`);
    const roleItems = Object.keys(roleIcons).map(role => ({
        label: getRoleLabel(role),
        onClick: () => onRoleChange(role),
        icon: roleIcons[role],
    }));
    const effectiveRole = currentRole || 'fan';
    const CurrentIcon = roleIcons[effectiveRole];
    return (_jsxs("div", { className: 'space-y-6', children: [_jsx(FmCommonToggleHeader, { title: t('roleSelect.quickNavigation'), defaultOpen: true, children: _jsxs("div", { className: 'space-y-2', children: [_jsx("p", { className: 'text-xs text-white/50 mb-3', children: t('roleSelect.quickNavigationDescription') }), _jsx(FmCommonNavigationButton, { to: '/developer', label: t('roleSelect.nav.developerTools'), icon: Package, description: t('roleSelect.nav.developerToolsDescription'), variant: 'outline' }), _jsx(FmCommonNavigationButton, { to: '/testing', label: t('roleSelect.nav.testingDashboard'), icon: FlaskConical, description: t('roleSelect.nav.testingDashboardDescription'), variant: 'outline' }), _jsx(FmCommonNavigationButton, { to: '/admin/statistics', label: t('roleSelect.nav.statistics'), icon: BarChart3, description: t('roleSelect.nav.statisticsDescription'), variant: 'outline' }), _jsx(FmCommonNavigationButton, { to: '/admin/controls', label: t('roleSelect.nav.adminControls'), icon: Settings, description: t('roleSelect.nav.adminControlsDescription'), variant: 'outline' })] }) }), _jsx(FmCommonToggleHeader, { title: t('roleSelect.title'), defaultOpen: true, children: _jsxs("div", { children: [_jsx("p", { className: 'text-xs text-white/50 mb-3', children: t('roleSelect.description') }), _jsx(FmCommonDropdown, { trigger: _jsx(Button, { variant: 'outline', className: 'w-full justify-between bg-white/5 border-white/30 hover:bg-white/10 text-white pr-10', children: _jsxs("span", { className: 'flex items-center gap-2', children: [_jsx(CurrentIcon, { className: 'h-4 w-4' }), getRoleLabel(effectiveRole)] }) }), items: roleItems, align: 'start' })] }) })] }));
};

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, TrendingUp, Settings } from 'lucide-react';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonPageLayout } from '@/components/common/layout';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { PERMISSIONS } from '@/shared';
/**
 * OrganizationTools - Main dashboard for organization admins
 *
 * Features:
 * - Sales reports
 * - Venue management
 * - Staff management
 * - Organization profile
 */
const OrganizationTools = () => {
    const { t } = useTranslation('common');
    const { hasAnyPermission, roles } = useUserPermissions();
    const navigate = useNavigate();
    const isLoading = !roles;
    // Check for organization access permission
    const hasAccess = hasAnyPermission(PERMISSIONS.MANAGE_ORGANIZATION, PERMISSIONS.VIEW_ORGANIZATION);
    useEffect(() => {
        if (!isLoading && !hasAccess) {
            navigate('/');
        }
    }, [isLoading, navigate, hasAccess]);
    if (isLoading) {
        return (_jsx(FmCommonPageLayout, { title: t('organization.dashboard.title'), children: _jsx("div", { className: 'flex items-center justify-center min-h-[400px]', children: _jsx("p", { className: 'text-muted-foreground', children: t('status.loading') }) }) }));
    }
    if (!hasAccess) {
        return null;
    }
    return (_jsx(FmCommonPageLayout, { title: t('organization.dashboard.title'), subtitle: t('organization.dashboard.subtitle'), children: _jsxs("div", { className: 'grid grid-cols-1 md:grid-cols-2 gap-6', children: [_jsx(FmCommonCard, { variant: 'outline', className: 'p-6', children: _jsxs("div", { className: 'flex items-start gap-4', children: [_jsx("div", { className: 'p-3 rounded-none bg-fm-gold/10 border border-fm-gold/20', children: _jsx(TrendingUp, { className: 'h-6 w-6 text-fm-gold' }) }), _jsxs("div", { className: 'flex-1', children: [_jsx("h3", { className: 'text-lg font-canela mb-2', children: t('organization.dashboard.salesReports') }), _jsx("p", { className: 'text-sm text-muted-foreground mb-4', children: t('organization.dashboard.salesReportsDescription') }), _jsx(FmCommonButton, { variant: 'secondary', size: 'sm', onClick: () => navigate('/organization/sales'), children: t('organization.dashboard.viewReports') })] })] }) }), _jsx(FmCommonCard, { variant: 'outline', className: 'p-6', children: _jsxs("div", { className: 'flex items-start gap-4', children: [_jsx("div", { className: 'p-3 rounded-none bg-fm-gold/10 border border-fm-gold/20', children: _jsx(Building2, { className: 'h-6 w-6 text-fm-gold' }) }), _jsxs("div", { className: 'flex-1', children: [_jsx("h3", { className: 'text-lg font-canela mb-2', children: t('organization.dashboard.venueInfo') }), _jsx("p", { className: 'text-sm text-muted-foreground mb-4', children: t('organization.dashboard.venueInfoDescription') }), _jsx(FmCommonButton, { variant: 'secondary', size: 'sm', onClick: () => navigate('/organization/venue'), children: t('organization.dashboard.manageVenue') })] })] }) }), _jsx(FmCommonCard, { variant: 'outline', className: 'p-6', children: _jsxs("div", { className: 'flex items-start gap-4', children: [_jsx("div", { className: 'p-3 rounded-none bg-fm-gold/10 border border-fm-gold/20', children: _jsx(Users, { className: 'h-6 w-6 text-fm-gold' }) }), _jsxs("div", { className: 'flex-1', children: [_jsx("h3", { className: 'text-lg font-canela mb-2', children: t('organization.dashboard.staffManagement') }), _jsx("p", { className: 'text-sm text-muted-foreground mb-4', children: t('organization.dashboard.staffManagementDescription') }), _jsx(FmCommonButton, { variant: 'secondary', size: 'sm', onClick: () => navigate('/organization/staff'), children: t('organization.dashboard.manageStaff') })] })] }) }), _jsx(FmCommonCard, { variant: 'outline', className: 'p-6', children: _jsxs("div", { className: 'flex items-start gap-4', children: [_jsx("div", { className: 'p-3 rounded-none bg-fm-gold/10 border border-fm-gold/20', children: _jsx(Settings, { className: 'h-6 w-6 text-fm-gold' }) }), _jsxs("div", { className: 'flex-1', children: [_jsx("h3", { className: 'text-lg font-canela mb-2', children: t('organization.dashboard.organizationProfile') }), _jsx("p", { className: 'text-sm text-muted-foreground mb-4', children: t('organization.dashboard.organizationProfileDescription') }), _jsx(FmCommonButton, { variant: 'secondary', size: 'sm', onClick: () => navigate('/organization/profile'), children: t('organization.dashboard.editProfile') })] })] }) })] }) }));
};
export default OrganizationTools;

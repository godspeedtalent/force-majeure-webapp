import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { FmOrganizationDataGrid } from '@/features/data-grid';
export const OrganizationsManagement = () => {
    const { t } = useTranslation('common');
    return (_jsxs("div", { className: 'space-y-6', children: [_jsxs("div", { children: [_jsx("h1", { className: 'text-3xl font-canela font-bold text-foreground mb-2', children: t('organizationsManagement.title') }), _jsx("p", { className: 'text-muted-foreground', children: t('organizationsManagement.description') })] }), _jsx(FmOrganizationDataGrid, {})] }));
};

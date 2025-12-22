import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { Database } from 'lucide-react';
import { Separator } from '@/components/common/shadcn/separator';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { DatabaseNavigatorSearch } from '@/components/admin/DatabaseNavigatorSearch';
export function DatabaseTabContent() {
    return (_jsxs("div", { className: 'space-y-4', children: [_jsx(Separator, { className: 'bg-white/10' }), _jsx("div", { className: 'px-4 py-2 space-y-4', children: _jsx(DatabaseNavigatorSearch, {}) })] }));
}
export function DatabaseTabFooter({ onNavigate }) {
    const { t } = useTranslation('common');
    return (_jsx("div", { className: 'pb-4', children: _jsx(FmCommonButton, { variant: 'default', icon: Database, iconPosition: 'left', onClick: () => onNavigate('/developer/database'), className: 'w-full justify-start', children: t('databaseTab.goToManager') }) }));
}

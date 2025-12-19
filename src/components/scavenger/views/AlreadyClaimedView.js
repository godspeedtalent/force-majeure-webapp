import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { MessagePanel } from '@/components/feedback/MessagePanel';
import { FmI18nCommon } from '@/components/common/i18n';
export function AlreadyClaimedView({ locationName }) {
    const { t } = useTranslation('common');
    return (_jsxs(_Fragment, { children: [_jsx(MessagePanel, { title: t('scavenger.views.alreadyClaimed'), description: t('scavenger.views.alreadyClaimedDescription', { locationName }), className: 'mb-4' }), _jsx("div", { className: 'text-center', children: _jsx(FmI18nCommon, { i18nKey: 'scavenger.views.shareWithFriends', as: 'p', className: 'text-foreground font-canela text-sm lg:text-lg' }) })] }));
}

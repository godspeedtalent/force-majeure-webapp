import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { MessagePanel } from '@/components/feedback/MessagePanel';
import { FmI18nCommon } from '@/components/common/i18n';
import { Button } from '@/components/common/shadcn/button';
import { ExternalLink } from 'lucide-react';
import { LF_SYSTEM_TICKET_URL } from '@/shared';
export function InvalidTokenView() {
    const { t } = useTranslation('common');
    return (_jsx(_Fragment, { children: _jsx(MessagePanel, { title: t('scavenger.views.invalidCode'), description: t('scavenger.views.invalidCodeDescription'), className: 'mb-4', action: _jsxs(_Fragment, { children: [_jsx(DecorativeDivider, {}), _jsx(FmI18nCommon, { i18nKey: 'scavenger.views.photoInstructions', as: 'p', className: 'text-muted-foreground font-canela' }), _jsxs("p", { className: 'text-foreground font-canela', children: [t('scavenger.views.sendPhotoTo'), ' ', _jsx("a", { href: 'https://www.instagram.com/force.majeure.events/', target: '_blank', rel: 'noopener noreferrer', className: 'text-fm-gold hover:underline', children: "@force.majeure.events" }), ' ', t('scavenger.views.onInstagram')] }), _jsx(DecorativeDivider, {}), _jsx(FmI18nCommon, { i18nKey: 'scavenger.views.jumpToTickets', as: 'p', className: 'text-white font-canela' }), _jsxs(Button, { size: 'lg', className: 'w-full max-w-xs mx-auto bg-gradient-gold hover:opacity-90 font-semibold text-black transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]', onClick: () => window.open(LF_SYSTEM_TICKET_URL, '_blank'), children: [_jsx(ExternalLink, { className: 'mr-2 h-4 w-4' }), t('buttons.buyTickets')] })] }) }) }));
}

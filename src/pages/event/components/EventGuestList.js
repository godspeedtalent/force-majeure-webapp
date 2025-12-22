import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Eye, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
/**
 * EventGuestList - Displays the guest list card with attendee previews
 *
 * Extracted from EventDetailsContent.tsx for better component organization.
 */
export const EventGuestList = ({ attendeePreview, ticketCount, viewCount, showViewCount, isLoggedIn, onCardClick, onPromptLogin, }) => {
    const { t } = useTranslation('common');
    return (_jsxs(FmCommonCard, { variant: 'outline', onClick: isLoggedIn ? onCardClick : undefined, className: 'relative overflow-hidden', children: [_jsx("h3", { className: 'text-lg mb-4 font-canela', children: t('guestList.guestListTitle') }), _jsxs("div", { className: 'flex items-center gap-3 mb-4', children: [_jsx("div", { className: 'flex -space-x-2', children: attendeePreview.map((attendee, index) => (_jsx("div", { className: 'w-8 h-8 rounded-full bg-gradient-to-br from-fm-gold/20 to-fm-gold/40 border-2 border-card flex items-center justify-center transition-all duration-200 hover:scale-110 hover:border-fm-gold cursor-pointer', title: attendee.name, children: _jsx("span", { className: 'text-[10px] font-semibold text-fm-gold', children: attendee.avatar }) }, `${attendee.avatar}-${index}`))) }), _jsxs("div", { className: 'flex items-center gap-2', children: [_jsx(Users, { className: 'w-4 h-4 text-fm-gold' }), _jsx("span", { className: 'text-xs font-normal text-muted-foreground', children: t('guestList.othersCount', { count: ticketCount }) })] })] }), _jsx("div", { className: 'mt-4 border-t border-border pt-3', children: _jsxs("div", { className: 'flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground', children: [isLoggedIn ? (_jsx("span", { className: 'font-normal text-muted-foreground', children: t('guestList.clickToSeeFullList') })) : (_jsx("button", { type: 'button', onClick: event => {
                                event.stopPropagation();
                                onPromptLogin();
                            }, className: 'text-xs font-semibold text-fm-gold hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-fm-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background', children: t('guestList.logInToSeeFullList') })), showViewCount && (_jsxs("div", { className: 'flex items-center gap-2', children: [_jsx(Eye, { className: 'w-4 h-4' }), _jsx("span", { children: t('guestList.pageViews', { count: viewCount }) })] }))] }) })] }));
};

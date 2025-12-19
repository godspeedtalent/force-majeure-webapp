import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Clock, MapPin, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLinkDialog } from '@/components/business/ExternalLinkDialog';
import { FmBadge } from '@/components/common/display/FmBadge';
import { FmDateBox } from '@/components/common/display/FmDateBox';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { formatTimeDisplay, parseTimeToMinutes, } from '@/shared';
export const EventRow = ({ event }) => {
    const { t } = useTranslation('common');
    const [showTicketDialog, setShowTicketDialog] = useState(false);
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return {
            weekday: date
                .toLocaleDateString('en-US', { weekday: 'short' })
                .toUpperCase(),
            month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
            day: date.getDate().toString(),
            fullDate: date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
            }),
        };
    };
    const isAfterHours = (() => {
        const minutes = parseTimeToMinutes(event.time);
        return minutes !== null && minutes >= 120; // 2:00 AM = 120 minutes
    })();
    const handleTicketsClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowTicketDialog(true);
    };
    const dateObj = formatDate(event.date);
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: 'group event-hover-invert flex items-stretch bg-card border-b border-border transition-all duration-300 cursor-pointer', children: [_jsx("div", { className: 'flex-shrink-0 w-20 overflow-hidden', children: _jsx("img", { src: event.heroImage, alt: event.title, className: 'w-full h-full object-contain group-hover:scale-105 transition-transform duration-300' }) }), _jsxs("div", { className: 'flex-1 min-w-0 p-4 flex items-center', children: [_jsxs("div", { className: 'flex-1 min-w-0', children: [_jsxs("div", { className: 'flex items-start justify-between mb-2', children: [_jsxs("div", { className: 'min-w-0 flex-1', children: [event.title && (_jsx("h3", { className: 'font-canela font-medium text-lg truncate mb-1', children: event.title })), _jsx("p", { className: 'invert-text text-foreground font-medium', children: event.headliner.name }), event.undercard.length > 0 && (_jsx("div", { className: 'flex flex-wrap gap-1 mt-2', children: event.undercard.map((artist, index) => (_jsx(FmBadge, { label: artist.name, variant: 'secondary', className: 'text-xs opacity-80' }, artist.id || `${artist.name}-${index}`))) }))] }), isAfterHours && (_jsx(FmBadge, { label: t('eventCard.afterHours'), variant: 'primary', className: 'ml-2 flex-shrink-0' }))] }), _jsxs("div", { className: 'flex items-center gap-4 text-sm text-muted-foreground', children: [_jsxs("div", { className: 'flex items-center gap-1', children: [_jsx(Clock, { className: 'w-3 h-3' }), _jsx("span", { className: 'invert-text', children: formatTimeDisplay(event.time) })] }), _jsxs("div", { className: 'flex items-center gap-1', children: [_jsx(MapPin, { className: 'w-3 h-3' }), _jsx("span", { className: 'invert-text', children: event.venue })] })] })] }), event.ticketUrl && (_jsx("div", { className: 'flex flex-col gap-2 ml-4', children: _jsx(FmCommonButton, { variant: 'default', size: 'sm', onClick: handleTicketsClick, className: 'shimmer-on-hover bg-accent hover:bg-accent/90 text-accent-foreground font-medium', icon: ExternalLink, children: t('eventCard.getTickets') }) }))] }), _jsx(FmDateBox, { weekday: dateObj.weekday, month: dateObj.month, day: dateObj.day, size: 'sm', className: 'border-l rounded-none' })] }), event.ticketUrl && (_jsx(ExternalLinkDialog, { open: showTicketDialog, onOpenChange: setShowTicketDialog, url: event.ticketUrl, title: t('eventCard.externalLink'), description: t('eventCard.externalLinkDescription'), continueText: t('eventCard.continueToTickets') }))] }));
};

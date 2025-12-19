import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { MapPin, ExternalLink, Settings, X, Users, } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ExternalLinkDialog } from '@/components/business/ExternalLinkDialog';
import { FmDateBox } from '@/components/common/display/FmDateBox';
import { FmUndercardList } from '@/components/common/display/FmUndercardList';
import { Button } from '@/components/common/shadcn/button';
import { FmCommonContextMenu, } from '@/components/common/modals/FmCommonContextMenu';
import { ImageWithSkeleton } from '@/components/primitives/ImageWithSkeleton';
import { cn } from '@/shared';
import { parseTimeToMinutes } from '@/shared';
export const EventCard = ({ event, isSingleRow = false, isPastEvent = false }) => {
    const { t } = useTranslation('common');
    const navigate = useNavigate();
    const [showTicketDialog, setShowTicketDialog] = useState(false);
    const [contextMenuOpen, setContextMenuOpen] = useState(false);
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return {
            weekday: date
                .toLocaleDateString('en-US', { weekday: 'short' })
                .toUpperCase(),
            month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
            day: date.getDate().toString(),
            year: date.getFullYear().toString(),
        };
    };
    const isAfterHours = (() => {
        const minutes = parseTimeToMinutes(event.time);
        return minutes !== null && minutes > 120; // strictly past 2:00 AM
    })();
    const handleTicketsClick = (e) => {
        e.stopPropagation();
        setShowTicketDialog(true);
    };
    const dateObj = formatDate(event.date);
    // Determine the display title - use event title if available, otherwise headliner name
    const displayTitle = event.title || event.headliner.name;
    // Context menu actions for admin/developer
    const contextMenuActions = [
        {
            label: t('table.manageEvent'),
            icon: _jsx(Settings, { className: 'w-4 h-4' }),
            onClick: eventData => {
                navigate(`/events/edit/${eventData.id}`);
            },
        },
        {
            label: t('buttons.cancel'),
            icon: _jsx(X, { className: 'w-4 h-4' }),
            onClick: () => {
                // Just closes the menu, no action needed
            },
        },
    ];
    const handleCardClick = () => {
        if ('startViewTransition' in document) {
            document.startViewTransition(() => {
                navigate(`/event/${event.id}`);
            });
        }
        else {
            navigate(`/event/${event.id}`);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsx(FmCommonContextMenu, { actions: contextMenuActions, data: event, onOpenChange: setContextMenuOpen, children: _jsxs("div", { className: cn('group relative overflow-hidden rounded-none border border-border bg-card', 'transition-all duration-300 cursor-pointer', isSingleRow
                        ? 'w-full max-w-[40vw] min-w-[320px]'
                        : 'w-full max-w-[25vw] min-w-[280px]', 
                    // Apply hover state when actually hovering OR when context menu is open
                    contextMenuOpen && 'border-fm-gold/50 shadow-lg shadow-fm-gold/10', 'hover:border-fm-gold/50 hover:shadow-lg hover:shadow-fm-gold/10'), onClick: handleCardClick, children: [_jsxs("div", { className: 'relative w-full overflow-hidden bg-muted aspect-[4/5]', style: { viewTransitionName: `magazine-hero-${event.id}` }, children: [_jsx(ImageWithSkeleton, { src: event.heroImage, alt: displayTitle, className: cn('h-full w-full object-cover transition-all duration-500', 'group-hover:scale-105', 
                                    // Keep scaled when context menu is open
                                    contextMenuOpen && 'scale-105'), skeletonClassName: 'rounded-none' // Sharp corners per design system
                                 }), _jsx("div", { className: 'absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent' })] }), _jsxs("div", { className: 'relative flex flex-col', children: [_jsxs("div", { className: 'flex flex-1', children: [_jsxs("div", { className: 'flex-1 p-6 flex flex-col min-w-0', children: [_jsxs("div", { className: 'mb-4', children: [_jsx("h3", { className: 'font-canela text-2xl font-medium text-foreground line-clamp-2 mb-0.5', children: displayTitle }), (event.display_subtitle ?? true) && (_jsx("p", { className: 'text-sm text-muted-foreground/90 truncate', children: event.venue }))] }), _jsx(FmUndercardList, { artists: event.undercard, size: 'sm', className: 'mb-4' }), _jsxs("div", { className: 'space-y-2 mb-4', children: [event.undercard.length > 0 && (_jsxs("div", { className: 'flex items-start gap-2 text-sm text-muted-foreground', children: [_jsx(Users, { className: 'w-4 h-4 text-fm-gold flex-shrink-0 mt-0.5' }), _jsx("div", { className: 'flex flex-col', children: event.undercard.map((artist, index) => (_jsx("span", { className: 'truncate', children: artist.name }, index))) })] })), _jsxs("div", { className: 'flex items-center gap-2 text-sm text-muted-foreground', children: [_jsx(MapPin, { className: 'w-4 h-4 text-fm-gold flex-shrink-0' }), _jsx("span", { className: 'truncate', children: event.venue })] })] }), !isPastEvent && event.ticketUrl && (_jsx("div", { className: 'flex gap-2 mt-auto', children: _jsxs(Button, { size: 'sm', onClick: handleTicketsClick, className: 'flex-1 bg-fm-gold hover:bg-fm-gold/90 text-background font-medium transition-all duration-200', children: [_jsx(ExternalLink, { className: 'w-4 h-4 mr-2' }), t('eventCard.getTickets')] }) }))] }), _jsx(FmDateBox, { weekday: dateObj.weekday, month: dateObj.month, day: dateObj.day, year: parseInt(dateObj.year, 10), size: 'md', className: 'border-l rounded-none' })] }), isAfterHours && (_jsx("div", { className: 'w-full border-t border-border bg-transparent py-0.5 text-center transition-all duration-200 group-hover:bg-fm-gold group-hover:text-background mb-0', children: _jsx("span", { className: 'text-[8px] font-bold tracking-wider uppercase leading-none text-fm-gold group-hover:text-background', children: t('eventCard.afterHours') }) }))] })] }) }), event.ticketUrl && (_jsx(ExternalLinkDialog, { open: showTicketDialog, onOpenChange: setShowTicketDialog, url: event.ticketUrl, title: t('dialogs.leavingSite'), description: t('eventCard.redirectDescription'), onStopPropagation: true }))] }));
};

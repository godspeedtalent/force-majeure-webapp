import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FmCommonLoadingState } from '@/components/common/feedback/FmCommonLoadingState';
import { FmInfoCard } from '@/components/common/data/FmInfoCard';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { ForceMajeureLogo } from '@/components/navigation/ForceMajeureLogo';
import { EventCard } from '@/features/events/components/EventCard';
import { EventCardSkeleton } from '@/features/events/components/EventCardSkeleton';
import { FmTbaEventCard } from '@/features/events/components/FmTbaEventCard';
export function IndexDesktop({ upcomingEvents, pastEvents, loading, showPastEvents, setShowPastEvents, heroRef, eventsRef, isSingleRow, parallaxOffset, fadeOpacity, contentReady, }) {
    const navigate = useNavigate();
    const { t } = useTranslation('pages');
    if (!contentReady) {
        return (_jsx("div", { className: 'flex items-center justify-center min-h-screen relative z-10', children: _jsx(FmCommonLoadingState, { message: t('home.loading') }) }));
    }
    // Single row layout (3 or fewer events) - combined hero + events on one screen
    if (isSingleRow) {
        return (_jsxs("div", { className: 'flex flex-col justify-between py-8 pb-[100px] px-4 relative z-10', children: [_jsx("div", { className: 'flex items-center justify-center', children: _jsx("div", { className: 'max-w-7xl mx-auto', children: _jsxs("div", { className: 'flex flex-col items-center text-center', children: [_jsx(ForceMajeureLogo, { size: 'lg', className: 'mb-4 h-32 w-32' }), _jsxs("h1", { className: 'text-2xl lg:text-4xl font-screamer leading-none mb-8', style: { fontWeight: 475 }, children: [_jsx("span", { className: 'text-foreground', children: "FORCE " }), _jsx("span", { className: 'bg-gradient-gold bg-clip-text text-transparent', children: "MAJEURE" })] }), _jsx(DecorativeDivider, {})] }) }) }), _jsx("div", { ref: eventsRef, className: 'flex items-center justify-center', "data-section-id": 'events', children: _jsx("div", { className: 'max-w-7xl mx-auto animate-fade-in w-full', children: _jsx("div", { className: 'flex justify-center items-center gap-8', children: loading ? (Array.from({ length: 6 }).map((_, idx) => (_jsx(EventCardSkeleton, {}, `skeleton-${idx}`)))) : upcomingEvents.length > 0 ? (upcomingEvents.map(event => event.is_tba ? (_jsx(FmTbaEventCard, { event: {
                                    id: event.id,
                                    date: event.date,
                                    time: event.time,
                                    venue: event.venue !== 'TBA' ? event.venue : undefined,
                                    is_tba: true,
                                }, isSingleRow: isSingleRow }, event.id)) : (_jsx(EventCard, { event: event, isSingleRow: isSingleRow }, event.id)))) : (_jsx("div", { className: 'flex justify-center', children: _jsxs(FmInfoCard, { className: 'max-w-2xl text-center', children: [_jsx("h2", { className: 'text-lg lg:text-xl text-fm-gold mb-[20px]', children: t('home.lineupComingSoon') }), _jsx("p", { className: 'text-sm text-muted-foreground mb-[10px]', children: t('home.artistQuestion') }), _jsx("p", { className: 'text-sm text-muted-foreground mb-[20px]', children: t('home.registerBelow') }), _jsx(FmCommonButton, { onClick: () => navigate('/artists/signup'), children: t('home.artistRegistration') })] }) })) }) }) })] }));
    }
    // Multi-row layout (more than 3 events) - scrollable hero + events sections
    const heroContent = (_jsx("section", { ref: heroRef, className: 'min-h-screen pt-24 pb-32 flex items-center justify-center px-4', "data-section-id": 'hero', children: _jsxs("div", { className: 'max-w-7xl mx-auto', style: {
                transform: `translateY(${parallaxOffset}px)`,
                opacity: fadeOpacity,
                transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
                willChange: 'transform, opacity',
            }, children: [_jsxs("div", { className: 'flex flex-col items-center text-center', children: [_jsx(ForceMajeureLogo, { size: 'xl', className: 'mb-8 h-40 w-40' }), _jsxs("h1", { className: 'text-3xl lg:text-5xl font-screamer leading-none mb-10', style: { fontWeight: 475 }, children: [_jsx("span", { className: 'text-foreground', children: "FORCE " }), _jsx("span", { className: 'bg-gradient-gold bg-clip-text text-transparent', children: "MAJEURE" })] })] }), _jsx(DecorativeDivider, {})] }) }));
    const eventsContent = (_jsx("section", { ref: eventsRef, className: 'min-h-screen py-24 px-4', "data-section-id": 'events', children: _jsxs("div", { className: 'max-w-7xl mx-auto animate-fade-in w-full', children: [_jsx("div", { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 justify-items-center', children: loading ? (Array.from({ length: 6 }).map((_, idx) => (_jsx(EventCardSkeleton, {}, `skeleton-${idx}`)))) : upcomingEvents.length > 0 ? (upcomingEvents.map(event => event.is_tba ? (_jsx(FmTbaEventCard, { event: {
                            id: event.id,
                            date: event.date,
                            time: event.time,
                            venue: event.venue !== 'TBA' ? event.venue : undefined,
                            is_tba: true,
                        }, isSingleRow: false }, event.id)) : (_jsx(EventCard, { event: event, isSingleRow: false }, event.id)))) : (_jsx("div", { className: 'col-span-full flex justify-center', children: _jsxs(FmInfoCard, { className: 'max-w-2xl text-center', children: [_jsx("h2", { className: 'text-lg lg:text-xl text-fm-gold mb-[20px]', children: t('home.lineupComingSoon') }), _jsx("p", { className: 'text-sm text-muted-foreground mb-[10px]', children: t('home.artistQuestion') }), _jsx("p", { className: 'text-sm text-muted-foreground mb-[20px]', children: t('home.registerBelow') }), _jsx(FmCommonButton, { onClick: () => navigate('/artists/signup'), children: t('home.artistRegistration') })] }) })) }), !loading && pastEvents.length > 0 && (_jsx("div", { className: 'flex justify-center mt-[40px]', children: _jsx(FmCommonButton, { onClick: () => setShowPastEvents(!showPastEvents), variant: 'secondary', children: showPastEvents ? t('home.hidePastEvents') : t('home.showPastEvents') }) })), !loading && showPastEvents && pastEvents.length > 0 && (_jsxs("div", { className: 'mt-[60px]', children: [_jsx("h2", { className: 'text-2xl lg:text-3xl font-canela text-fm-gold mb-[40px] text-center', children: t('home.pastEventsTitle') }), _jsx("div", { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 justify-items-center', children: pastEvents.map(event => event.is_tba ? (_jsx(FmTbaEventCard, { event: {
                                    id: event.id,
                                    date: event.date,
                                    time: event.time,
                                    venue: event.venue !== 'TBA' ? event.venue : undefined,
                                    is_tba: true,
                                }, isSingleRow: false }, event.id)) : (_jsx(EventCard, { event: event, isSingleRow: false, isPastEvent: true }, event.id))) })] }))] }) }));
    return (_jsxs("div", { className: 'relative z-10', children: [heroContent, eventsContent] }));
}

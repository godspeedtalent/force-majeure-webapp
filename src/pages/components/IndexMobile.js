import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FmCommonLoadingState } from '@/components/common/feedback/FmCommonLoadingState';
import { FmInfoCard } from '@/components/common/data/FmInfoCard';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { DecorativeDivider } from '@/components/primitives/DecorativeDivider';
import { ForceMajeureLogo } from '@/components/navigation/ForceMajeureLogo';
import { ParallaxLayerManager } from '@/components/layout/ParallaxLayerManager';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';
import { EventCard } from '@/features/events/components/EventCard';
import { EventCardSkeleton } from '@/features/events/components/EventCardSkeleton';
import { FmTbaEventCard } from '@/features/events/components/FmTbaEventCard';
import { MobileSectionIndicator, MobileScrollCue } from '@/components/mobile';
import { MobileScrollSnapWrapper } from '@/components/mobile/MobileScrollSnapWrapper';
export function IndexMobile({ upcomingEvents, pastEvents, loading, showPastEvents, setShowPastEvents, heroRef, eventsRef, activeSection, scrollToSection, contentReady, }) {
    const navigate = useNavigate();
    const { t } = useTranslation('pages');
    if (!contentReady) {
        return (_jsx("div", { className: 'flex items-center justify-center min-h-screen relative z-10', children: _jsx(FmCommonLoadingState, { message: t('home.loading') }) }));
    }
    const heroContent = (_jsxs("section", { ref: heroRef, className: 'h-screen snap-start snap-always flex items-center justify-center px-4', "data-section-id": 'hero', children: [_jsxs("div", { className: 'max-w-7xl mx-auto', children: [_jsxs("div", { className: 'flex flex-col items-center text-center', children: [_jsx(ForceMajeureLogo, { size: 'lg', className: 'mb-6 h-32 w-32' }), _jsxs("h1", { className: 'text-2xl font-screamer leading-none mb-8', style: { fontWeight: 475 }, children: [_jsx("span", { className: 'text-foreground', children: "FORCE " }), _jsx("span", { className: 'bg-gradient-gold bg-clip-text text-transparent', children: "MAJEURE" })] })] }), _jsx(DecorativeDivider, {})] }), _jsx(MobileScrollCue, {})] }));
    const eventsContent = (_jsx("section", { ref: eventsRef, className: 'h-screen snap-start snap-always flex items-center px-4', "data-section-id": 'events', children: _jsxs("div", { className: 'max-w-7xl mx-auto animate-fade-in w-full', children: [_jsx("div", { className: 'space-y-4 overflow-y-auto max-h-[80vh]', children: loading ? (Array.from({ length: 6 }).map((_, idx) => (_jsx(EventCardSkeleton, {}, `skeleton-${idx}`)))) : upcomingEvents.length > 0 ? (upcomingEvents.map(event => event.is_tba ? (_jsx(FmTbaEventCard, { event: {
                            id: event.id,
                            date: event.date,
                            time: event.time,
                            venue: event.venue !== 'TBA' ? event.venue : undefined,
                            is_tba: true,
                        }, isSingleRow: false }, event.id)) : (_jsx(EventCard, { event: event, isSingleRow: false }, event.id)))) : (_jsxs(FmInfoCard, { className: 'max-w-2xl text-center', children: [_jsx("h2", { className: 'text-lg lg:text-xl text-fm-gold mb-[20px]', children: t('home.lineupComingSoon') }), _jsx("p", { className: 'text-sm text-muted-foreground mb-[10px]', children: t('home.artistQuestion') }), _jsx("p", { className: 'text-sm text-muted-foreground mb-[20px]', children: t('home.registerBelow') }), _jsx(FmCommonButton, { onClick: () => navigate('/artists/signup'), children: t('home.artistRegistration') })] })) }), !loading && pastEvents.length > 0 && (_jsx("div", { className: 'flex justify-center mt-[40px]', children: _jsx(FmCommonButton, { onClick: () => setShowPastEvents(!showPastEvents), variant: 'secondary', children: showPastEvents ? t('home.hidePastEvents') : t('home.showPastEvents') }) })), !loading && showPastEvents && pastEvents.length > 0 && (_jsxs("div", { className: 'mt-[60px]', children: [_jsx("h2", { className: 'text-2xl lg:text-3xl font-canela text-fm-gold mb-[40px] text-center', children: t('home.pastEventsTitle') }), _jsx("div", { className: 'space-y-4', children: pastEvents.map(event => event.is_tba ? (_jsx(FmTbaEventCard, { event: {
                                    id: event.id,
                                    date: event.date,
                                    time: event.time,
                                    venue: event.venue !== 'TBA' ? event.venue : undefined,
                                    is_tba: true,
                                }, isSingleRow: false }, event.id)) : (_jsx(EventCard, { event: event, isSingleRow: false, isPastEvent: true }, event.id))) })] }))] }) }));
    return (_jsx(ParallaxLayerManager, { layers: [
            {
                id: 'topography',
                content: _jsx(TopographicBackground, { opacity: 0.35, parallax: false }),
                speed: 0.3,
                zIndex: 1,
            },
            {
                id: 'gradient',
                content: _jsx("div", { className: 'absolute inset-0 bg-gradient-monochrome opacity-10' }),
                speed: 0.5,
                zIndex: 2,
            },
        ], children: _jsxs(MobileScrollSnapWrapper, { enabled: true, children: [heroContent, eventsContent, _jsx(MobileSectionIndicator, { sections: [
                        { id: 'hero', label: t('home.welcome') },
                        { id: 'events', label: t('events.title') },
                    ], activeSection: activeSection, onSectionClick: scrollToSection })] }) }));
}

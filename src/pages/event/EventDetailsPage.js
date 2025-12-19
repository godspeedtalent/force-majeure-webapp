import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Navigation } from '@/components/navigation/Navigation';
import { PageTransition } from '@/components/primitives/PageTransition';
import { EventDetailsLayout } from '@/components/layout/EventDetailsLayout';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { TopographicBackground } from '@/components/common/misc/TopographicBackground';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { ROLES, PERMISSIONS } from '@/shared';
import { EventHero } from './EventHero';
import { EventDetailsContent } from './EventDetailsContent';
import { useEventDetails } from './hooks/useEventDetails';
export const EventDetailsPage = () => {
    const { t } = useTranslation('pages');
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: event, isLoading, error } = useEventDetails(id);
    const { hasAnyRole, hasPermission } = useUserPermissions();
    // Check if user can view non-published events
    const canViewDraft = hasAnyRole(ROLES.ADMIN, ROLES.DEVELOPER);
    const eventStatus = event?.status || 'published';
    const isPublished = eventStatus === 'published';
    // Check if user can manage events
    const canManage = hasAnyRole(ROLES.ADMIN, ROLES.DEVELOPER) || hasPermission(PERMISSIONS.MANAGE_EVENTS);
    if (!id) {
        return (_jsxs("div", { className: 'min-h-screen flex items-center justify-center bg-background relative overflow-hidden', children: [_jsx(TopographicBackground, { opacity: 0.25 }), _jsx("div", { className: 'absolute inset-0 bg-gradient-monochrome opacity-10' }), _jsxs("div", { className: 'text-center relative z-10', children: [_jsx("h1", { className: 'text-6xl font-canela mb-4 text-fm-gold', children: t('eventDetails.error') }), _jsx("p", { className: 'text-xl text-foreground mb-8', children: t('eventDetails.eventIdRequired') }), _jsx(FmCommonButton, { asChild: true, variant: 'default', children: _jsxs(Link, { to: '/', children: [_jsx(ArrowLeft, { className: 'mr-2 h-4 w-4' }), t('eventDetails.backToEvents')] }) })] })] }));
    }
    if (isLoading) {
        return (_jsxs("div", { className: 'min-h-screen flex items-center justify-center bg-background relative overflow-hidden', children: [_jsx(TopographicBackground, { opacity: 0.25 }), _jsx("div", { className: 'absolute inset-0 bg-gradient-monochrome opacity-10' }), _jsxs("div", { className: 'flex flex-col items-center gap-6 relative z-10', children: [_jsx(FmCommonLoadingSpinner, { size: 'lg' }), _jsx("p", { className: 'text-foreground text-lg font-medium', children: t('eventDetails.loading') })] })] }));
    }
    if (error || !event) {
        return (_jsxs("div", { className: 'min-h-screen flex items-center justify-center bg-background relative overflow-hidden', children: [_jsx(TopographicBackground, { opacity: 0.25 }), _jsx("div", { className: 'absolute inset-0 bg-gradient-monochrome opacity-10' }), _jsxs("div", { className: 'text-center relative z-10', children: [_jsx("h1", { className: 'text-6xl font-canela mb-4 text-fm-gold', children: t('eventDetails.error') }), _jsx("p", { className: 'text-xl text-foreground mb-4', children: error?.message || t('eventDetails.eventNotFound') }), _jsx("p", { className: 'text-sm text-muted-foreground mb-8', children: t('eventDetails.eventRemoved') }), _jsx(FmCommonButton, { asChild: true, variant: 'default', children: _jsxs(Link, { to: '/', children: [_jsx(ArrowLeft, { className: 'mr-2 h-4 w-4' }), t('eventDetails.backToEvents')] }) })] })] }));
    }
    // Check access control: non-published events require privileged access
    if (!isPublished && !canViewDraft) {
        return (_jsxs("div", { className: 'min-h-screen flex items-center justify-center bg-background relative overflow-hidden', children: [_jsx(TopographicBackground, { opacity: 0.25 }), _jsx("div", { className: 'absolute inset-0 bg-gradient-monochrome opacity-10' }), _jsxs("div", { className: 'text-center relative z-10', children: [_jsx("h1", { className: 'text-6xl font-canela mb-4 text-fm-gold', children: t('eventDetails.notFound') }), _jsx("p", { className: 'text-xl text-foreground mb-4', children: t('eventDetails.eventNotFound') }), _jsx("p", { className: 'text-sm text-muted-foreground mb-8', children: t('eventDetails.eventNotAvailable') }), _jsx(FmCommonButton, { asChild: true, variant: 'default', children: _jsxs(Link, { to: '/', children: [_jsx(ArrowLeft, { className: 'mr-2 h-4 w-4' }), t('eventDetails.backToEvents')] }) })] })] }));
    }
    const displayTitle = event.headliner.name;
    return (_jsxs(_Fragment, { children: [_jsx(Navigation, {}), _jsx(PageTransition, { children: _jsx(EventDetailsLayout, { leftColumn: _jsx(EventHero, { event: event, canManage: canManage, onBack: () => navigate('/'), onManage: canManage ? () => navigate(`/event/${id}/manage`) : undefined }), rightColumn: _jsx(EventDetailsContent, { event: event, displayTitle: displayTitle }) }) })] }));
};
export default EventDetailsPage;

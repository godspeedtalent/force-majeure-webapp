import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Calendar, Settings, Users, ArrowLeft } from 'lucide-react';
import { supabase, ROLES, PERMISSIONS } from '@/shared';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { Layout } from '@/components/layout/Layout';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmEventRow } from '@/components/common/display/FmEventRow';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { ImageWithSkeleton } from '@/components/primitives/ImageWithSkeleton';
import { useVenueById } from '@/shared/api/queries/venueQueries';
// Default placeholder image for venues without an image
const VENUE_PLACEHOLDER_IMAGE = '/images/artist-showcase/_KAK4846.jpg';
export default function VenueDetails() {
    const { t } = useTranslation('common');
    const { id } = useParams();
    const navigate = useNavigate();
    const { hasAnyRole, hasPermission } = useUserPermissions();
    const { data: venue, isLoading } = useVenueById(id);
    const { data: upcomingEvents } = useQuery({
        queryKey: ['venue-events', id],
        queryFn: async () => {
            if (!id)
                return [];
            const { data, error } = await supabase
                .from('events')
                .select(`
          id,
          title,
          start_time,
          hero_image,
          artists!events_headliner_id_fkey(name)
        `)
                .eq('venue_id', id)
                .gte('start_time', new Date().toISOString())
                .order('start_time', { ascending: true })
                .limit(10);
            if (error)
                throw error;
            return data;
        },
        enabled: !!id,
    });
    // Check if user can manage venue
    const canManageVenue = hasAnyRole(ROLES.ADMIN, ROLES.DEVELOPER) ||
        hasPermission(PERMISSIONS.MANAGE_VENUES);
    if (isLoading) {
        return (_jsx(Layout, { children: _jsx("div", { className: 'flex items-center justify-center min-h-[400px]', children: _jsx(FmCommonLoadingSpinner, { size: 'lg' }) }) }));
    }
    if (!venue) {
        return (_jsx(Layout, { children: _jsxs("div", { className: 'text-center py-12', children: [_jsx("h1", { className: 'text-2xl font-canela mb-4', children: t('venueDetails.notFound') }), _jsx(FmCommonButton, { onClick: () => navigate('/'), children: t('venueDetails.goHome') })] }) }));
    }
    return (_jsx(Layout, { children: _jsxs("div", { className: 'w-full lg:w-[70%] mx-auto px-4 py-8', children: [_jsxs("div", { className: 'flex items-center justify-between mb-4', children: [_jsx(FmCommonButton, { variant: 'secondary', size: 'sm', icon: ArrowLeft, onClick: () => navigate(-1), className: 'bg-white/10 text-white hover:bg-white/20 border border-white/30', children: t('buttons.back') }), canManageVenue && (_jsx(FmCommonButton, { variant: 'secondary', size: 'sm', icon: Settings, onClick: () => navigate(`/venues/${id}/manage`), className: 'bg-white/10 text-white hover:bg-white/20 border border-white/30', children: t('venueDetails.manage') }))] }), _jsxs("div", { className: 'relative h-[50vh] mb-8 overflow-hidden rounded-none border border-border', children: [_jsx(ImageWithSkeleton, { src: venue.image_url || VENUE_PLACEHOLDER_IMAGE, alt: venue.name, className: 'w-full h-full object-cover', skeletonClassName: 'rounded-none' }), _jsx("div", { className: 'absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent' }), _jsx("div", { className: 'absolute bottom-0 left-0 right-0 p-8', children: _jsx("h1", { className: 'text-5xl font-canela font-medium text-foreground mb-2', children: venue.name }) })] }), _jsxs("div", { children: [_jsxs("div", { className: 'mb-8 space-y-3', children: [venue.address_line_1 && (_jsxs("div", { className: 'flex items-start gap-3 text-muted-foreground', children: [_jsx(MapPin, { className: 'h-5 w-5 text-fm-gold flex-shrink-0 mt-0.5' }), _jsxs("span", { className: 'text-lg', children: [venue.address_line_1, venue.address_line_2 && `, ${venue.address_line_2}`, venue.city && `, ${venue.city}`, venue.state && `, ${venue.state}`] })] })), venue.capacity && (_jsxs("div", { className: 'flex items-center gap-3 text-muted-foreground', children: [_jsx(Users, { className: 'h-5 w-5 text-fm-gold flex-shrink-0' }), _jsx("span", { className: 'text-lg', children: t('venueDetails.capacity', { count: venue.capacity }) })] }))] }), upcomingEvents && upcomingEvents.length > 0 && (_jsxs("div", { children: [_jsxs("h2", { className: 'text-3xl font-canela font-medium mb-6 flex items-center gap-3', children: [_jsx(Calendar, { className: 'h-7 w-7 text-fm-gold' }), t('venueDetails.upcomingEvents')] }), _jsx("div", { className: 'grid gap-4', children: upcomingEvents.map((event) => (_jsx(FmEventRow, { id: event.id, title: event.title, artistName: event.artists?.name, heroImage: event.hero_image, startTime: event.start_time, venueName: venue.name }, event.id))) })] }))] })] }) }));
}

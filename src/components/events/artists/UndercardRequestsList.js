import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * UndercardRequestsList Component
 *
 * Displays artist undercard requests for an event.
 * Shows pending requests from artists who signed up via the "Looking for Artists" link.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Music, MapPin, ExternalLink, Check, X, Clock, User, } from 'lucide-react';
import { FaSpotify, FaSoundcloud, FaInstagram } from 'react-icons/fa6';
import { supabase } from '@/shared';
import { FormSection } from '@/components/common/forms/FormSection';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { cn } from '@/shared';
import { toast } from 'sonner';
import { logger } from '@/shared';
export function UndercardRequestsList({ eventId, className, }) {
    const { t } = useTranslation('common');
    const queryClient = useQueryClient();
    const [expandedId, setExpandedId] = useState(null);
    // Fetch undercard requests for this event
    const { data: requests, isLoading, error } = useQuery({
        queryKey: ['undercard-requests', eventId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('undercard_requests')
                .select(`
          id,
          event_id,
          artist_registration_id,
          status,
          reviewer_notes,
          created_at,
          artist_registration:artist_registrations (
            id,
            artist_name,
            bio,
            city,
            profile_image_url,
            instagram_handle,
            soundcloud_url,
            spotify_url,
            genres,
            tracks
          )
        `)
                .eq('event_id', eventId)
                .order('created_at', { ascending: false });
            if (error) {
                logger.error('Failed to fetch undercard requests', { error, eventId });
                throw error;
            }
            return data;
        },
    });
    // Mutation to update request status
    const updateStatusMutation = useMutation({
        mutationFn: async ({ requestId, status, }) => {
            const { error } = await supabase
                .from('undercard_requests')
                .update({
                status,
                reviewed_at: new Date().toISOString(),
            })
                .eq('id', requestId);
            if (error)
                throw error;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['undercard-requests', eventId] });
            toast.success(variables.status === 'approved'
                ? t('undercardRequests.requestApproved')
                : t('undercardRequests.requestRejected'));
        },
        onError: (error) => {
            logger.error('Failed to update undercard request', { error });
            toast.error(t('undercardRequests.updateFailed'));
        },
    });
    if (isLoading) {
        return (_jsx(FormSection, { title: t('undercardRequests.sectionTitle'), children: _jsxs("div", { className: 'flex items-center justify-center py-8', children: [_jsx(FmCommonLoadingSpinner, { size: 'md' }), _jsx("span", { className: 'ml-3 text-muted-foreground', children: t('undercardRequests.loading') })] }) }));
    }
    if (error) {
        return (_jsx(FormSection, { title: t('undercardRequests.sectionTitle'), children: _jsx("div", { className: 'text-center py-8 text-red-400', children: t('undercardRequests.loadFailed') }) }));
    }
    const pendingRequests = requests?.filter(r => r.status === 'pending') || [];
    const reviewedRequests = requests?.filter(r => r.status !== 'pending') || [];
    return (_jsxs("div", { className: cn('space-y-6', className), children: [_jsx(FormSection, { title: t('undercardRequests.pendingTitle', { count: pendingRequests.length }), children: _jsx("div", { className: 'space-y-3', children: pendingRequests.length === 0 ? (_jsxs("div", { className: 'text-center py-8 text-muted-foreground border-2 border-dashed border-white/10 rounded-lg', children: [_jsx(Music, { className: 'h-12 w-12 mx-auto mb-2 opacity-30' }), _jsx("p", { children: t('undercardRequests.noPending') }), _jsx("p", { className: 'text-xs mt-1 opacity-70', children: t('undercardRequests.noPendingDescription') })] })) : (pendingRequests.map(request => (_jsx(RequestCard, { request: request, isExpanded: expandedId === request.id, onToggleExpand: () => setExpandedId(expandedId === request.id ? null : request.id), onApprove: () => updateStatusMutation.mutate({
                            requestId: request.id,
                            status: 'approved',
                        }), onReject: () => updateStatusMutation.mutate({
                            requestId: request.id,
                            status: 'rejected',
                        }), isUpdating: updateStatusMutation.isPending }, request.id)))) }) }), reviewedRequests.length > 0 && (_jsx(FormSection, { title: t('undercardRequests.reviewedTitle', { count: reviewedRequests.length }), children: _jsx("div", { className: 'space-y-3', children: reviewedRequests.map(request => (_jsx(RequestCard, { request: request, isExpanded: expandedId === request.id, onToggleExpand: () => setExpandedId(expandedId === request.id ? null : request.id), isReviewed: true }, request.id))) }) }))] }));
}
function RequestCard({ request, isExpanded, onToggleExpand, onApprove, onReject, isUpdating, isReviewed, }) {
    const { t } = useTranslation('common');
    const registration = request.artist_registration;
    const djSets = registration.tracks?.filter(track => track.recording_type === 'dj_set') || [];
    return (_jsxs("div", { className: cn('border rounded-lg overflow-hidden transition-all duration-300', request.status === 'pending'
            ? 'border-fm-gold/30 bg-fm-gold/5'
            : request.status === 'approved'
                ? 'border-green-500/30 bg-green-500/5'
                : 'border-red-500/30 bg-red-500/5'), children: [_jsxs("button", { onClick: onToggleExpand, className: 'w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-colors', children: [_jsx("div", { className: 'w-12 h-12 flex-shrink-0 rounded-full overflow-hidden bg-white/10', children: registration.profile_image_url ? (_jsx("img", { src: registration.profile_image_url, alt: registration.artist_name, className: 'w-full h-full object-cover' })) : (_jsx("div", { className: 'w-full h-full flex items-center justify-center', children: _jsx(User, { className: 'h-6 w-6 text-muted-foreground' }) })) }), _jsxs("div", { className: 'flex-1 text-left', children: [_jsx("h4", { className: 'font-semibold', children: registration.artist_name }), _jsxs("div", { className: 'flex items-center gap-3 text-sm text-muted-foreground', children: [registration.city && (_jsxs("span", { className: 'flex items-center gap-1', children: [_jsx(MapPin, { className: 'h-3 w-3' }), registration.city] })), _jsxs("span", { className: 'flex items-center gap-1', children: [_jsx(Clock, { className: 'h-3 w-3' }), new Date(request.created_at).toLocaleDateString()] })] })] }), _jsx("div", { className: cn('px-3 py-1 text-xs font-medium rounded-full', request.status === 'pending'
                            ? 'bg-fm-gold/20 text-fm-gold'
                            : request.status === 'approved'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'), children: request.status.charAt(0).toUpperCase() + request.status.slice(1) })] }), isExpanded && (_jsxs("div", { className: 'px-4 pb-4 space-y-4 border-t border-white/10', children: [_jsx("div", { className: 'pt-4', children: _jsx("p", { className: 'text-sm text-muted-foreground line-clamp-3', children: registration.bio }) }), _jsxs("div", { className: 'flex items-center gap-3', children: [registration.instagram_handle && (_jsxs("a", { href: `https://instagram.com/${registration.instagram_handle}`, target: '_blank', rel: 'noopener noreferrer', className: 'flex items-center gap-1 text-sm text-muted-foreground hover:text-white transition-colors', children: [_jsx(FaInstagram, { className: 'h-4 w-4' }), "@", registration.instagram_handle] })), registration.spotify_url && (_jsx("a", { href: registration.spotify_url, target: '_blank', rel: 'noopener noreferrer', className: 'text-[#1DB954] hover:opacity-80 transition-opacity', children: _jsx(FaSpotify, { className: 'h-5 w-5' }) })), registration.soundcloud_url && (_jsx("a", { href: registration.soundcloud_url, target: '_blank', rel: 'noopener noreferrer', className: 'text-[#FF5500] hover:opacity-80 transition-opacity', children: _jsx(FaSoundcloud, { className: 'h-5 w-5' }) }))] }), djSets.length > 0 && (_jsxs("div", { className: 'space-y-2', children: [_jsx("h5", { className: 'text-xs uppercase text-muted-foreground', children: t('undercardRequests.djSets', { count: djSets.length }) }), _jsx("div", { className: 'space-y-2', children: djSets.map((track, idx) => (_jsxs("a", { href: track.url, target: '_blank', rel: 'noopener noreferrer', className: 'flex items-center gap-3 p-2 bg-white/5 hover:bg-white/10 transition-colors', children: [track.cover_art && (_jsx("img", { src: track.cover_art, alt: track.name, className: 'w-10 h-10 object-cover' })), _jsx("span", { className: 'flex-1 text-sm truncate', children: track.name }), _jsx(ExternalLink, { className: 'h-4 w-4 text-muted-foreground' })] }, idx))) })] })), !isReviewed && onApprove && onReject && (_jsxs("div", { className: 'flex gap-3 pt-2', children: [_jsx(FmCommonButton, { onClick: onApprove, variant: 'default', icon: Check, disabled: isUpdating, className: 'flex-1 bg-green-600 hover:bg-green-700', children: t('undercardRequests.approve') }), _jsx(FmCommonButton, { onClick: onReject, variant: 'secondary', icon: X, disabled: isUpdating, className: 'flex-1', children: t('undercardRequests.reject') })] }))] }))] }));
}

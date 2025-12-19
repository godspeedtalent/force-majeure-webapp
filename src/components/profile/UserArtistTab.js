import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Music2, ExternalLink, Settings, Link2, Unlink, Trash2, Clock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/shared';
import { useAuth } from '@/features/auth/services/AuthContext';
import { logger } from '@/shared';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmI18nCommon } from '@/components/common/i18n';
import { Card, CardContent } from '@/components/common/shadcn/card';
import { Button } from '@/components/common/shadcn/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, } from '@/components/common/shadcn/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from '@/components/common/shadcn/alert-dialog';
import { FmArtistSearchDropdown } from '@/components/common/search/FmArtistSearchDropdown';
export function UserArtistTab() {
    const { t } = useTranslation('common');
    const { t: tToast } = useTranslation('toasts');
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user } = useAuth();
    // Modal states
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedArtistToLink, setSelectedArtistToLink] = useState(null);
    // Fetch linked artist
    const { data: linkedArtist, isLoading: loadingArtist } = useQuery({
        queryKey: ['user-linked-artist', user?.id],
        queryFn: async () => {
            if (!user?.id)
                return null;
            const { data, error } = await supabase
                .from('artists')
                .select('id, name, image_url, bio, genre')
                .eq('user_id', user.id)
                .maybeSingle();
            if (error) {
                logger.error('Failed to fetch linked artist', { error: error.message, userId: user.id });
                throw error;
            }
            return data;
        },
        enabled: !!user?.id,
    });
    // Fetch pending requests
    const { data: pendingRequests = [], isLoading: loadingRequests } = useQuery({
        queryKey: ['user-requests', user?.id],
        queryFn: async () => {
            if (!user?.id)
                return [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await supabase
                .from('user_requests')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            if (error) {
                logger.error('Failed to fetch user requests', { error: error.message, userId: user.id });
                throw error;
            }
            return (data || []);
        },
        enabled: !!user?.id,
    });
    // Check for pending delete request
    const pendingDeleteRequest = pendingRequests.find(r => r.request_type === 'delete_data' && r.status === 'pending');
    // Check for pending link request
    const pendingLinkRequest = pendingRequests.find(r => r.request_type === 'link_artist' && r.status === 'pending');
    // Create link artist request mutation
    const linkArtistMutation = useMutation({
        mutationFn: async (artistId) => {
            if (!user?.id)
                throw new Error('Not authenticated');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await supabase
                .from('user_requests')
                .insert({
                user_id: user.id,
                request_type: 'link_artist',
                status: 'pending',
                parameters: { artist_id: artistId },
            });
            if (error)
                throw error;
        },
        onSuccess: () => {
            toast.success(tToast('userArtist.linkRequestSubmitted'));
            queryClient.invalidateQueries({ queryKey: ['user-requests', user?.id] });
            setShowLinkModal(false);
            setSelectedArtistToLink(null);
        },
        onError: (error) => {
            logger.error('Failed to create link request', { error });
            toast.error(tToast('userArtist.linkRequestFailed'));
        },
    });
    // Create unlink artist request mutation
    const unlinkArtistMutation = useMutation({
        mutationFn: async () => {
            if (!user?.id || !linkedArtist?.id)
                throw new Error('No linked artist');
            // Direct unlink - no admin approval needed
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await supabase
                .from('artists')
                .update({ user_id: null })
                .eq('id', linkedArtist.id)
                .eq('user_id', user.id);
            if (error)
                throw error;
        },
        onSuccess: () => {
            toast.success(tToast('userArtist.unlinkSuccess'));
            queryClient.invalidateQueries({ queryKey: ['user-linked-artist', user?.id] });
            setShowUnlinkConfirm(false);
        },
        onError: (error) => {
            logger.error('Failed to unlink artist', { error });
            toast.error(tToast('userArtist.unlinkFailed'));
        },
    });
    // Create delete data request mutation
    const deleteDataMutation = useMutation({
        mutationFn: async () => {
            if (!user?.id)
                throw new Error('Not authenticated');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await supabase
                .from('user_requests')
                .insert({
                user_id: user.id,
                request_type: 'delete_data',
                status: 'pending',
                parameters: { artist_id: linkedArtist?.id || null },
            });
            if (error)
                throw error;
        },
        onSuccess: () => {
            toast.success(tToast('userArtist.deleteRequestSubmitted'));
            queryClient.invalidateQueries({ queryKey: ['user-requests', user?.id] });
            setShowDeleteConfirm(false);
        },
        onError: (error) => {
            logger.error('Failed to create delete request', { error });
            toast.error(tToast('userArtist.deleteRequestFailed'));
        },
    });
    const isLoading = loadingArtist || loadingRequests;
    if (isLoading) {
        return (_jsxs("div", { className: 'flex items-center justify-center gap-3 py-12', children: [_jsx(Loader2, { className: 'h-5 w-5 animate-spin text-fm-gold' }), _jsx("span", { className: 'text-muted-foreground', children: t('userArtist.loading') })] }));
    }
    // Show pending deletion state
    if (pendingDeleteRequest) {
        return (_jsx("div", { className: 'space-y-6', children: _jsx(Card, { className: 'border-fm-danger/30 bg-fm-danger/5', children: _jsx(CardContent, { className: 'p-6', children: _jsxs("div", { className: 'flex items-start gap-4', children: [_jsx("div", { className: 'p-3 bg-fm-danger/10 rounded-none', children: _jsx(Clock, { className: 'h-6 w-6 text-fm-danger' }) }), _jsxs("div", { className: 'flex-1', children: [_jsx(FmI18nCommon, { i18nKey: 'userArtist.pendingDeletion', as: 'h3', className: 'font-canela text-lg font-medium text-fm-danger mb-2' }), _jsx(FmI18nCommon, { i18nKey: 'userArtist.pendingDeletionDescription', as: 'p', className: 'text-muted-foreground text-sm mb-4' }), _jsx("p", { className: 'text-xs text-muted-foreground', children: t('userArtist.requestedOn', { date: new Date(pendingDeleteRequest.created_at).toLocaleDateString() }) })] })] }) }) }) }));
    }
    // Show linked artist
    if (linkedArtist) {
        return (_jsxs("div", { className: 'space-y-6', children: [_jsx(Card, { className: 'border-border/30 bg-card/10 backdrop-blur-sm overflow-hidden', children: _jsx(CardContent, { className: 'p-0', children: _jsxs("div", { className: 'flex gap-6', children: [_jsx("div", { className: 'w-32 h-32 flex-shrink-0', children: linkedArtist.image_url ? (_jsx("img", { src: linkedArtist.image_url, alt: linkedArtist.name, className: 'w-full h-full object-cover' })) : (_jsx("div", { className: 'w-full h-full bg-gradient-gold flex items-center justify-center', children: _jsx(Music2, { className: 'h-12 w-12 text-black' }) })) }), _jsxs("div", { className: 'flex-1 py-4 pr-4', children: [_jsx("h3", { className: 'font-canela text-xl font-medium mb-1', children: linkedArtist.name }), linkedArtist.genre && (_jsx("p", { className: 'text-sm text-muted-foreground mb-2', children: linkedArtist.genre })), linkedArtist.bio && (_jsx("p", { className: 'text-sm text-muted-foreground line-clamp-2', children: linkedArtist.bio }))] })] }) }) }), _jsxs("div", { className: 'flex flex-wrap gap-3', children: [_jsx(FmCommonButton, { variant: 'default', size: 'sm', icon: ExternalLink, onClick: () => navigate(`/artists/${linkedArtist.id}`), children: t('userArtist.viewArtistPage') }), _jsx(FmCommonButton, { variant: 'secondary', size: 'sm', icon: Settings, onClick: () => navigate(`/artists/${linkedArtist.id}/manage`), children: t('userArtist.manageArtist') }), _jsx(FmCommonButton, { variant: 'secondary', size: 'sm', icon: Unlink, onClick: () => setShowUnlinkConfirm(true), children: t('userArtist.unlinkAccount') }), _jsx(FmCommonButton, { variant: 'destructive', size: 'sm', icon: Trash2, onClick: () => setShowDeleteConfirm(true), children: t('userArtist.requestDataDeletion') })] }), _jsx(AlertDialog, { open: showUnlinkConfirm, onOpenChange: setShowUnlinkConfirm, children: _jsxs(AlertDialogContent, { children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: t('userArtist.unlinkConfirmTitle') }), _jsx(AlertDialogDescription, { children: t('userArtist.unlinkConfirmDescription', { name: linkedArtist.name }) })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { children: t('buttons.cancel') }), _jsx(AlertDialogAction, { onClick: () => unlinkArtistMutation.mutate(), disabled: unlinkArtistMutation.isPending, children: unlinkArtistMutation.isPending ? t('userArtist.unlinking') : t('userArtist.unlink') })] })] }) }), _jsx(AlertDialog, { open: showDeleteConfirm, onOpenChange: setShowDeleteConfirm, children: _jsxs(AlertDialogContent, { children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { className: 'text-fm-danger', children: t('userArtist.deleteConfirmTitle') }), _jsxs(AlertDialogDescription, { className: 'space-y-2', children: [_jsx("p", { children: t('userArtist.deleteConfirmDescription') }), _jsx("p", { className: 'text-muted-foreground', children: t('userArtist.deleteConfirmNote') })] })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { children: t('buttons.cancel') }), _jsx(AlertDialogAction, { onClick: () => deleteDataMutation.mutate(), disabled: deleteDataMutation.isPending, className: 'bg-fm-danger hover:bg-fm-danger/90', children: deleteDataMutation.isPending ? t('status.submitting') : t('userArtist.requestDeletion') })] })] }) })] }));
    }
    // No linked artist - show link option
    return (_jsxs("div", { className: 'space-y-6', children: [pendingLinkRequest && (_jsx(Card, { className: 'border-fm-gold/30 bg-fm-gold/5', children: _jsx(CardContent, { className: 'p-4', children: _jsxs("div", { className: 'flex items-center gap-3', children: [_jsx(Clock, { className: 'h-5 w-5 text-fm-gold' }), _jsxs("div", { children: [_jsx("p", { className: 'text-sm font-medium', children: t('userArtist.linkRequestPending') }), _jsx("p", { className: 'text-xs text-muted-foreground', children: t('userArtist.linkRequestPendingDescription') })] })] }) }) })), pendingRequests.filter(r => r.status !== 'pending').length > 0 && (_jsxs("div", { className: 'space-y-2', children: [_jsx(FmI18nCommon, { i18nKey: 'userArtist.recentRequests', as: 'h4', className: 'text-sm font-medium text-muted-foreground' }), pendingRequests
                        .filter(r => r.status !== 'pending')
                        .slice(0, 3)
                        .map(request => (_jsx(Card, { className: 'border-border/20 bg-card/5', children: _jsxs(CardContent, { className: 'p-3', children: [_jsxs("div", { className: 'flex items-center justify-between', children: [_jsxs("div", { className: 'flex items-center gap-2', children: [request.status === 'approved' ? (_jsx(CheckCircle2, { className: 'h-4 w-4 text-green-500' })) : (_jsx(AlertCircle, { className: 'h-4 w-4 text-fm-danger' })), _jsxs("span", { className: 'text-sm', children: [request.request_type === 'link_artist' && t('userArtist.requestTypes.linkArtist'), request.request_type === 'unlink_artist' && t('userArtist.requestTypes.unlinkArtist'), request.request_type === 'delete_data' && t('userArtist.requestTypes.deleteData')] })] }), _jsx("span", { className: `text-xs ${request.status === 'approved' ? 'text-green-500' : 'text-fm-danger'}`, children: request.status === 'approved' ? t('status.approved') : t('status.denied') })] }), request.denial_reason && (_jsxs("p", { className: 'text-xs text-muted-foreground mt-1 ml-6', children: [t('userArtist.reason'), ": ", request.denial_reason] }))] }) }, request.id)))] })), _jsx(Card, { className: 'border-border/30 bg-card/10 backdrop-blur-sm', children: _jsxs(CardContent, { className: 'p-12 text-center', children: [_jsx(Music2, { className: 'h-12 w-12 text-muted-foreground mx-auto mb-4' }), _jsx(FmI18nCommon, { i18nKey: 'userArtist.noLinkedArtist', as: 'h3', className: 'font-canela text-xl font-medium mb-2' }), _jsx(FmI18nCommon, { i18nKey: 'userArtist.noLinkedArtistDescription', as: 'p', className: 'text-muted-foreground text-sm mb-6 max-w-md mx-auto' }), _jsx(FmCommonButton, { variant: 'secondary', icon: Link2, onClick: () => setShowLinkModal(true), disabled: !!pendingLinkRequest, children: pendingLinkRequest ? t('userArtist.requestPending') : t('userArtist.linkArtistAccount') })] }) }), _jsx(Dialog, { open: showLinkModal, onOpenChange: setShowLinkModal, children: _jsxs(DialogContent, { className: 'max-w-md', children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: t('userArtist.linkArtistModalTitle') }), _jsx(DialogDescription, { children: t('userArtist.linkArtistModalDescription') })] }), _jsxs("div", { className: 'py-4', children: [_jsx(FmArtistSearchDropdown, { value: selectedArtistToLink?.id || null, onChange: (_id, artist) => {
                                        if (artist) {
                                            setSelectedArtistToLink({ id: artist.id, name: artist.name });
                                        }
                                        else {
                                            setSelectedArtistToLink(null);
                                        }
                                    }, placeholder: t('userArtist.searchArtistPlaceholder'), 
                                    // Filter to only show artists without a user_id
                                    additionalFilters: [{ column: 'user_id', operator: 'is', value: null }] }), selectedArtistToLink && (_jsx("div", { className: 'mt-4 p-3 bg-fm-gold/10 border border-fm-gold/20 rounded-none', children: _jsxs("p", { className: 'text-sm', children: [t('userArtist.requestingToLink'), ": ", _jsx("strong", { children: selectedArtistToLink.name })] }) }))] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: 'outline', onClick: () => setShowLinkModal(false), children: t('buttons.cancel') }), _jsx(Button, { variant: 'outline', onClick: () => selectedArtistToLink && linkArtistMutation.mutate(selectedArtistToLink.id), disabled: !selectedArtistToLink || linkArtistMutation.isPending, children: linkArtistMutation.isPending ? t('status.submitting') : t('buttons.submitRequest') })] })] }) })] }));
}

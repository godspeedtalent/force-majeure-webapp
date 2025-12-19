import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link2, Trash2, Unlink, Clock, CheckCircle2, XCircle, User, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/shared';
import { useAuth } from '@/features/auth/services/AuthContext';
import { logger } from '@/shared';
import { Card, CardContent } from '@/components/common/shadcn/card';
import { Button } from '@/components/common/shadcn/button';
import { Badge } from '@/components/common/shadcn/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, } from '@/components/common/shadcn/dialog';
import { Textarea } from '@/components/common/shadcn/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger, } from '@/components/common/shadcn/tabs';
// Request type labels are dynamically generated using translation keys
const REQUEST_TYPE_ICONS = {
    link_artist: _jsx(Link2, { className: 'h-4 w-4' }),
    delete_data: _jsx(Trash2, { className: 'h-4 w-4' }),
    unlink_artist: _jsx(Unlink, { className: 'h-4 w-4' }),
};
export function UserRequestsAdmin() {
    const { t } = useTranslation('common');
    const { t: tToast } = useTranslation('toasts');
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuth();
    // Request type labels using translations
    const REQUEST_TYPE_LABELS = {
        link_artist: t('admin.requests.linkArtist'),
        delete_data: t('admin.requests.deleteData'),
        unlink_artist: t('admin.requests.unlinkArtist'),
    };
    // Modal states
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showDenyModal, setShowDenyModal] = useState(false);
    const [denialReason, setDenialReason] = useState('');
    // Fetch all requests
    const { data: requests = [], isLoading } = useQuery({
        queryKey: ['admin-user-requests'],
        queryFn: async () => {
            // Fetch requests with user info
            // Note: user_requests table may not be in generated types yet
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: requestsData, error: requestsError } = await supabase
                .from('user_requests')
                .select('*')
                .order('created_at', { ascending: false });
            if (requestsError) {
                logger.error('Failed to fetch user requests', { error: requestsError.message });
                throw requestsError;
            }
            // Fetch user profiles for each request
            const userIds = [...new Set(requestsData?.map((r) => r.user_id) || [])];
            const resolverIds = [...new Set(requestsData?.filter((r) => r.resolved_by).map((r) => r.resolved_by) || [])];
            const allUserIds = [...new Set([...userIds, ...resolverIds])];
            const { data: profiles } = await supabase
                .from('profiles')
                .select('user_id, display_name, email')
                .in('user_id', allUserIds);
            const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
            // Fetch artist info for link requests
            const artistIds = requestsData
                ?.filter((r) => r.parameters?.artist_id)
                .map((r) => r.parameters?.artist_id) || [];
            let artistMap = new Map();
            if (artistIds.length > 0) {
                const { data: artists } = await supabase
                    .from('artists')
                    .select('id, name, image_url')
                    .in('id', artistIds);
                artistMap = new Map(artists?.map(a => [a.id, a]) || []);
            }
            // Combine data
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (requestsData || []).map((request) => ({
                ...request,
                user: profileMap.get(request.user_id),
                resolver: request.resolved_by ? profileMap.get(request.resolved_by) : null,
                artist: request.parameters?.artist_id ? artistMap.get(request.parameters.artist_id) : null,
            }));
        },
    });
    // Approve mutation
    const approveMutation = useMutation({
        mutationFn: async (request) => {
            if (!currentUser?.id)
                throw new Error('Not authenticated');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await supabase
                .from('user_requests')
                .update({
                status: 'approved',
                resolved_by: currentUser.id,
                resolved_at: new Date().toISOString(),
            })
                .eq('id', request.id)
                .eq('status', 'pending'); // Only update if still pending
            if (error)
                throw error;
        },
        onSuccess: () => {
            toast.success(tToast('admin.requestApproved'));
            queryClient.invalidateQueries({ queryKey: ['admin-user-requests'] });
            setShowApproveModal(false);
            setSelectedRequest(null);
        },
        onError: (error) => {
            logger.error('Failed to approve request', { error });
            toast.error(tToast('admin.requestApproveFailed'));
        },
    });
    // Deny mutation
    const denyMutation = useMutation({
        mutationFn: async ({ request, reason }) => {
            if (!currentUser?.id)
                throw new Error('Not authenticated');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await supabase
                .from('user_requests')
                .update({
                status: 'denied',
                denial_reason: reason,
                resolved_by: currentUser.id,
                resolved_at: new Date().toISOString(),
            })
                .eq('id', request.id)
                .eq('status', 'pending'); // Only update if still pending
            if (error)
                throw error;
        },
        onSuccess: () => {
            toast.success(tToast('admin.requestDenied'));
            queryClient.invalidateQueries({ queryKey: ['admin-user-requests'] });
            setShowDenyModal(false);
            setSelectedRequest(null);
            setDenialReason('');
        },
        onError: (error) => {
            logger.error('Failed to deny request', { error });
            toast.error(tToast('admin.requestDenyFailed'));
        },
    });
    const pendingRequests = requests.filter(r => r.status === 'pending');
    const resolvedRequests = requests.filter(r => r.status !== 'pending');
    const handleApproveClick = (request) => {
        setSelectedRequest(request);
        setShowApproveModal(true);
    };
    const handleDenyClick = (request) => {
        setSelectedRequest(request);
        setShowDenyModal(true);
    };
    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };
    const renderRequestCard = (request, showActions = true) => (_jsx(Card, { className: 'border-border/30 bg-card/10 backdrop-blur-sm', children: _jsx(CardContent, { className: 'p-4', children: _jsxs("div", { className: 'flex items-start justify-between', children: [_jsxs("div", { className: 'flex items-start gap-4', children: [_jsx("div", { className: `p-2 rounded-none ${request.request_type === 'delete_data'
                                    ? 'bg-fm-danger/10 text-fm-danger'
                                    : 'bg-fm-gold/10 text-fm-gold'}`, children: REQUEST_TYPE_ICONS[request.request_type] }), _jsxs("div", { className: 'space-y-1', children: [_jsxs("div", { className: 'flex items-center gap-2', children: [_jsx("span", { className: 'font-medium', children: REQUEST_TYPE_LABELS[request.request_type] }), _jsxs(Badge, { variant: request.status === 'pending' ? 'outline' :
                                                    request.status === 'approved' ? 'default' : 'destructive', children: [request.status === 'pending' && _jsx(Clock, { className: 'h-3 w-3 mr-1' }), request.status === 'approved' && _jsx(CheckCircle2, { className: 'h-3 w-3 mr-1' }), request.status === 'denied' && _jsx(XCircle, { className: 'h-3 w-3 mr-1' }), request.status] })] }), _jsxs("div", { className: 'flex items-center gap-2 text-sm text-muted-foreground', children: [_jsx(User, { className: 'h-3 w-3' }), _jsx("span", { children: request.user?.display_name || request.user?.email || 'Unknown User' })] }), request.artist && (_jsxs("div", { className: 'flex items-center gap-2 mt-2', children: [request.artist.image_url ? (_jsx("img", { src: request.artist.image_url, alt: request.artist.name, className: 'h-8 w-8 rounded-full object-cover' })) : (_jsx("div", { className: 'h-8 w-8 rounded-full bg-fm-gold/20 flex items-center justify-center', children: _jsx(User, { className: 'h-4 w-4 text-fm-gold' }) })), _jsxs("span", { className: 'text-sm', children: [t('labels.artist'), ": ", _jsx("strong", { children: request.artist.name })] })] })), _jsxs("div", { className: 'flex items-center gap-4 text-xs text-muted-foreground mt-2', children: [_jsxs("div", { className: 'flex items-center gap-1', children: [_jsx(Calendar, { className: 'h-3 w-3' }), _jsxs("span", { children: [t('admin.requests.requested'), ": ", formatDate(request.created_at)] })] }), request.resolved_at && (_jsx("div", { className: 'flex items-center gap-1', children: _jsxs("span", { children: [t('admin.requests.resolved'), ": ", formatDate(request.resolved_at)] }) }))] }), request.resolver && (_jsxs("div", { className: 'text-xs text-muted-foreground', children: [t('admin.requests.by'), ": ", request.resolver.display_name || request.resolver.email] })), request.denial_reason && (_jsx("div", { className: 'mt-2 p-2 bg-fm-danger/10 border border-fm-danger/20 rounded-none', children: _jsxs("p", { className: 'text-xs text-fm-danger', children: [_jsxs("strong", { children: [t('admin.requests.denialReason'), ":"] }), " ", request.denial_reason] }) }))] })] }), showActions && request.status === 'pending' && (_jsxs("div", { className: 'flex gap-2', children: [_jsxs(Button, { size: 'sm', variant: 'outline', className: 'border-green-500/50 text-green-500 hover:bg-green-500/10', onClick: () => handleApproveClick(request), children: [_jsx(CheckCircle2, { className: 'h-4 w-4 mr-1' }), t('buttons.approve')] }), _jsxs(Button, { size: 'sm', variant: 'outline', className: 'border-fm-danger/50 text-fm-danger hover:bg-fm-danger/10', onClick: () => handleDenyClick(request), children: [_jsx(XCircle, { className: 'h-4 w-4 mr-1' }), t('buttons.deny')] })] }))] }) }) }, request.id));
    if (isLoading) {
        return (_jsx("div", { className: 'flex items-center justify-center py-12', children: _jsx("div", { className: 'text-muted-foreground', children: t('status.loadingRequests') }) }));
    }
    return (_jsxs("div", { className: 'space-y-6', children: [_jsxs("div", { children: [_jsx("h2", { className: 'text-2xl font-canela font-medium mb-2', children: t('admin.requests.title') }), _jsx("p", { className: 'text-muted-foreground text-sm', children: t('admin.requests.description') })] }), _jsxs(Tabs, { defaultValue: 'pending', children: [_jsxs(TabsList, { children: [_jsxs(TabsTrigger, { value: 'pending', className: 'relative', children: [t('status.pending'), pendingRequests.length > 0 && (_jsx(Badge, { variant: 'destructive', className: 'ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs', children: pendingRequests.length }))] }), _jsx(TabsTrigger, { value: 'resolved', children: t('status.resolved') })] }), _jsx(TabsContent, { value: 'pending', className: 'space-y-4 mt-4', children: pendingRequests.length === 0 ? (_jsx(Card, { className: 'border-border/30 bg-card/10', children: _jsxs(CardContent, { className: 'p-8 text-center', children: [_jsx(CheckCircle2, { className: 'h-12 w-12 text-green-500 mx-auto mb-4' }), _jsx("p", { className: 'text-muted-foreground', children: t('admin.requests.noPendingRequests') })] }) })) : (pendingRequests.map(request => renderRequestCard(request))) }), _jsx(TabsContent, { value: 'resolved', className: 'space-y-4 mt-4', children: resolvedRequests.length === 0 ? (_jsx(Card, { className: 'border-border/30 bg-card/10', children: _jsxs(CardContent, { className: 'p-8 text-center', children: [_jsx(AlertCircle, { className: 'h-12 w-12 text-muted-foreground mx-auto mb-4' }), _jsx("p", { className: 'text-muted-foreground', children: t('admin.requests.noResolvedRequests') })] }) })) : (resolvedRequests.map(request => renderRequestCard(request, false))) })] }), _jsx(Dialog, { open: showApproveModal, onOpenChange: setShowApproveModal, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: t('admin.requests.approveRequest') }), _jsxs(DialogDescription, { children: [selectedRequest?.request_type === 'link_artist' && (_jsx(_Fragment, { children: t('admin.requests.approveDescLinkArtist', { artistName: selectedRequest?.artist?.name }) })), selectedRequest?.request_type === 'delete_data' && (_jsx(_Fragment, { children: t('admin.requests.approveDescDeleteData') })), selectedRequest?.request_type === 'unlink_artist' && (_jsx(_Fragment, { children: t('admin.requests.approveDescUnlinkArtist') }))] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: 'outline', onClick: () => setShowApproveModal(false), children: t('buttons.cancel') }), _jsx(Button, { onClick: () => selectedRequest && approveMutation.mutate(selectedRequest), disabled: approveMutation.isPending, className: 'bg-green-600 hover:bg-green-700', children: approveMutation.isPending ? t('status.approving') : t('buttons.approve') })] })] }) }), _jsx(Dialog, { open: showDenyModal, onOpenChange: setShowDenyModal, children: _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: t('admin.requests.denyRequest') }), _jsx(DialogDescription, { children: t('admin.requests.denyDescription') })] }), _jsx("div", { className: 'py-4', children: _jsx(Textarea, { placeholder: t('placeholders.enterDenialReason'), value: denialReason, onChange: (e) => setDenialReason(e.target.value), rows: 4 }) }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: 'outline', onClick: () => {
                                        setShowDenyModal(false);
                                        setDenialReason('');
                                    }, children: t('buttons.cancel') }), _jsx(Button, { variant: 'destructive', onClick: () => selectedRequest && denyMutation.mutate({ request: selectedRequest, reason: denialReason }), disabled: !denialReason.trim() || denyMutation.isPending, children: denyMutation.isPending ? t('status.denying') : t('admin.requests.denyRequest') })] })] }) })] }));
}

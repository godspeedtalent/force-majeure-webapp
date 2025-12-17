import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link2, Trash2, Unlink, Clock, CheckCircle2, XCircle, User, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@force-majeure/shared';
import { useAuth } from '@/features/auth/services/AuthContext';
import { logger } from '@force-majeure/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/shadcn/card';
import { Button } from '@/components/common/shadcn/button';
import { Badge } from '@/components/common/shadcn/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/common/shadcn/dialog';
import { Textarea } from '@/components/common/shadcn/textarea';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/common/shadcn/tabs';

interface UserRequest {
  id: string;
  request_type: 'link_artist' | 'delete_data' | 'unlink_artist';
  status: 'pending' | 'approved' | 'denied';
  user_id: string;
  parameters: Record<string, unknown> | null;
  denial_reason: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  user?: {
    email: string;
    display_name: string | null;
  };
  resolver?: {
    email: string;
    display_name: string | null;
  };
  artist?: {
    id: string;
    name: string;
    image_url: string | null;
  };
}

// Request type labels are dynamically generated using translation keys

const REQUEST_TYPE_ICONS: Record<string, React.ReactNode> = {
  link_artist: <Link2 className='h-4 w-4' />,
  delete_data: <Trash2 className='h-4 w-4' />,
  unlink_artist: <Unlink className='h-4 w-4' />,
};

export function UserRequestsAdmin() {
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  // Request type labels using translations
  const REQUEST_TYPE_LABELS: Record<string, string> = {
    link_artist: t('admin.requests.linkArtist'),
    delete_data: t('admin.requests.deleteData'),
    unlink_artist: t('admin.requests.unlinkArtist'),
  };

  // Modal states
  const [selectedRequest, setSelectedRequest] = useState<UserRequest | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showDenyModal, setShowDenyModal] = useState(false);
  const [denialReason, setDenialReason] = useState('');

  // Fetch all requests
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['admin-user-requests'],
    queryFn: async () => {
      // Fetch requests with user info
      const { data: requestsData, error: requestsError } = await supabase
        .from('user_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestsError) {
        logger.error('Failed to fetch user requests', { error: requestsError.message });
        throw requestsError;
      }

      // Fetch user profiles for each request
      const userIds = [...new Set(requestsData?.map(r => r.user_id) || [])];
      const resolverIds = [...new Set(requestsData?.filter(r => r.resolved_by).map(r => r.resolved_by) || [])];
      const allUserIds = [...new Set([...userIds, ...resolverIds])];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .in('user_id', allUserIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Fetch artist info for link requests
      const artistIds = requestsData
        ?.filter(r => r.parameters?.artist_id)
        .map(r => r.parameters?.artist_id as string) || [];

      let artistMap = new Map();
      if (artistIds.length > 0) {
        const { data: artists } = await supabase
          .from('artists')
          .select('id, name, image_url')
          .in('id', artistIds);
        artistMap = new Map(artists?.map(a => [a.id, a]) || []);
      }

      // Combine data
      return (requestsData || []).map(request => ({
        ...request,
        user: profileMap.get(request.user_id),
        resolver: request.resolved_by ? profileMap.get(request.resolved_by) : null,
        artist: request.parameters?.artist_id ? artistMap.get(request.parameters.artist_id) : null,
      })) as UserRequest[];
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (request: UserRequest) => {
      if (!currentUser?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_requests')
        .update({
          status: 'approved',
          resolved_by: currentUser.id,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', request.id)
        .eq('status', 'pending'); // Only update if still pending

      if (error) throw error;
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
    mutationFn: async ({ request, reason }: { request: UserRequest; reason: string }) => {
      if (!currentUser?.id) throw new Error('Not authenticated');

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

      if (error) throw error;
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

  const handleApproveClick = (request: UserRequest) => {
    setSelectedRequest(request);
    setShowApproveModal(true);
  };

  const handleDenyClick = (request: UserRequest) => {
    setSelectedRequest(request);
    setShowDenyModal(true);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderRequestCard = (request: UserRequest, showActions: boolean = true) => (
    <Card key={request.id} className='border-border/30 bg-card/10 backdrop-blur-sm'>
      <CardContent className='p-4'>
        <div className='flex items-start justify-between'>
          <div className='flex items-start gap-4'>
            {/* Type Icon */}
            <div className={`p-2 rounded-none ${
              request.request_type === 'delete_data'
                ? 'bg-fm-danger/10 text-fm-danger'
                : 'bg-fm-gold/10 text-fm-gold'
            }`}>
              {REQUEST_TYPE_ICONS[request.request_type]}
            </div>

            {/* Request Info */}
            <div className='space-y-1'>
              <div className='flex items-center gap-2'>
                <span className='font-medium'>
                  {REQUEST_TYPE_LABELS[request.request_type]}
                </span>
                <Badge variant={
                  request.status === 'pending' ? 'outline' :
                  request.status === 'approved' ? 'default' : 'destructive'
                }>
                  {request.status === 'pending' && <Clock className='h-3 w-3 mr-1' />}
                  {request.status === 'approved' && <CheckCircle2 className='h-3 w-3 mr-1' />}
                  {request.status === 'denied' && <XCircle className='h-3 w-3 mr-1' />}
                  {request.status}
                </Badge>
              </div>

              {/* User Info */}
              <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                <User className='h-3 w-3' />
                <span>{request.user?.display_name || request.user?.email || 'Unknown User'}</span>
              </div>

              {/* Artist Info (for link requests) */}
              {request.artist && (
                <div className='flex items-center gap-2 mt-2'>
                  {request.artist.image_url ? (
                    <img
                      src={request.artist.image_url}
                      alt={request.artist.name}
                      className='h-8 w-8 rounded-full object-cover'
                    />
                  ) : (
                    <div className='h-8 w-8 rounded-full bg-fm-gold/20 flex items-center justify-center'>
                      <User className='h-4 w-4 text-fm-gold' />
                    </div>
                  )}
                  <span className='text-sm'>
                    {t('labels.artist')}: <strong>{request.artist.name}</strong>
                  </span>
                </div>
              )}

              {/* Dates */}
              <div className='flex items-center gap-4 text-xs text-muted-foreground mt-2'>
                <div className='flex items-center gap-1'>
                  <Calendar className='h-3 w-3' />
                  <span>{t('admin.requests.requested')}: {formatDate(request.created_at)}</span>
                </div>
                {request.resolved_at && (
                  <div className='flex items-center gap-1'>
                    <span>{t('admin.requests.resolved')}: {formatDate(request.resolved_at)}</span>
                  </div>
                )}
              </div>

              {/* Resolver Info */}
              {request.resolver && (
                <div className='text-xs text-muted-foreground'>
                  {t('admin.requests.by')}: {request.resolver.display_name || request.resolver.email}
                </div>
              )}

              {/* Denial Reason */}
              {request.denial_reason && (
                <div className='mt-2 p-2 bg-fm-danger/10 border border-fm-danger/20 rounded-none'>
                  <p className='text-xs text-fm-danger'>
                    <strong>{t('admin.requests.denialReason')}:</strong> {request.denial_reason}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {showActions && request.status === 'pending' && (
            <div className='flex gap-2'>
              <Button
                size='sm'
                variant='outline'
                className='border-green-500/50 text-green-500 hover:bg-green-500/10'
                onClick={() => handleApproveClick(request)}
              >
                <CheckCircle2 className='h-4 w-4 mr-1' />
                {t('buttons.approve')}
              </Button>
              <Button
                size='sm'
                variant='outline'
                className='border-fm-danger/50 text-fm-danger hover:bg-fm-danger/10'
                onClick={() => handleDenyClick(request)}
              >
                <XCircle className='h-4 w-4 mr-1' />
                {t('buttons.deny')}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='text-muted-foreground'>{t('status.loadingRequests')}</div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-2xl font-canela font-medium mb-2'>{t('admin.requests.title')}</h2>
        <p className='text-muted-foreground text-sm'>
          {t('admin.requests.description')}
        </p>
      </div>

      <Tabs defaultValue='pending'>
        <TabsList>
          <TabsTrigger value='pending' className='relative'>
            {t('status.pending')}
            {pendingRequests.length > 0 && (
              <Badge variant='destructive' className='ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs'>
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value='resolved'>{t('status.resolved')}</TabsTrigger>
        </TabsList>

        <TabsContent value='pending' className='space-y-4 mt-4'>
          {pendingRequests.length === 0 ? (
            <Card className='border-border/30 bg-card/10'>
              <CardContent className='p-8 text-center'>
                <CheckCircle2 className='h-12 w-12 text-green-500 mx-auto mb-4' />
                <p className='text-muted-foreground'>{t('admin.requests.noPendingRequests')}</p>
              </CardContent>
            </Card>
          ) : (
            pendingRequests.map(request => renderRequestCard(request))
          )}
        </TabsContent>

        <TabsContent value='resolved' className='space-y-4 mt-4'>
          {resolvedRequests.length === 0 ? (
            <Card className='border-border/30 bg-card/10'>
              <CardContent className='p-8 text-center'>
                <AlertCircle className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                <p className='text-muted-foreground'>{t('admin.requests.noResolvedRequests')}</p>
              </CardContent>
            </Card>
          ) : (
            resolvedRequests.map(request => renderRequestCard(request, false))
          )}
        </TabsContent>
      </Tabs>

      {/* Approve Confirmation Modal */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.requests.approveRequest')}</DialogTitle>
            <DialogDescription>
              {selectedRequest?.request_type === 'link_artist' && (
                <>
                  {t('admin.requests.approveDescLinkArtist', { artistName: selectedRequest?.artist?.name })}
                </>
              )}
              {selectedRequest?.request_type === 'delete_data' && (
                <>
                  {t('admin.requests.approveDescDeleteData')}
                </>
              )}
              {selectedRequest?.request_type === 'unlink_artist' && (
                <>
                  {t('admin.requests.approveDescUnlinkArtist')}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant='outline' onClick={() => setShowApproveModal(false)}>
              {t('buttons.cancel')}
            </Button>
            <Button
              onClick={() => selectedRequest && approveMutation.mutate(selectedRequest)}
              disabled={approveMutation.isPending}
              className='bg-green-600 hover:bg-green-700'
            >
              {approveMutation.isPending ? t('status.approving') : t('buttons.approve')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deny Modal with Reason */}
      <Dialog open={showDenyModal} onOpenChange={setShowDenyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.requests.denyRequest')}</DialogTitle>
            <DialogDescription>
              {t('admin.requests.denyDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className='py-4'>
            <Textarea
              placeholder={t('placeholders.enterDenialReason')}
              value={denialReason}
              onChange={(e) => setDenialReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => {
              setShowDenyModal(false);
              setDenialReason('');
            }}>
              {t('buttons.cancel')}
            </Button>
            <Button
              variant='destructive'
              onClick={() => selectedRequest && denyMutation.mutate({ request: selectedRequest, reason: denialReason })}
              disabled={!denialReason.trim() || denyMutation.isPending}
            >
              {denyMutation.isPending ? t('status.denying') : t('admin.requests.denyRequest')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

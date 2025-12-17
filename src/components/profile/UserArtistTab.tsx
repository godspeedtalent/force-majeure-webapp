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
import { Card, CardContent } from '@/components/common/shadcn/card';
import { Button } from '@/components/common/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/common/shadcn/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/common/shadcn/alert-dialog';
import { FmArtistSearchDropdown } from '@/components/common/search/FmArtistSearchDropdown';

interface LinkedArtist {
  id: string;
  name: string;
  image_url: string | null;
  bio: string | null;
  genre: string | null;
}

interface UserRequest {
  id: string;
  request_type: 'link_artist' | 'delete_data' | 'unlink_artist';
  status: 'pending' | 'approved' | 'denied';
  parameters: Record<string, unknown> | null;
  denial_reason: string | null;
  created_at: string;
  resolved_at: string | null;
}

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
  const [selectedArtistToLink, setSelectedArtistToLink] = useState<{ id: string; name: string } | null>(null);

  // Fetch linked artist
  const { data: linkedArtist, isLoading: loadingArtist } = useQuery({
    queryKey: ['user-linked-artist', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('artists')
        .select('id, name, image_url, bio, genre')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        logger.error('Failed to fetch linked artist', { error: error.message, userId: user.id });
        throw error;
      }

      return data as LinkedArtist | null;
    },
    enabled: !!user?.id,
  });

  // Fetch pending requests
  const { data: pendingRequests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ['user-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('user_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch user requests', { error: error.message, userId: user.id });
        throw error;
      }

      return (data || []) as UserRequest[];
    },
    enabled: !!user?.id,
  });

  // Check for pending delete request
  const pendingDeleteRequest = pendingRequests.find(
    r => r.request_type === 'delete_data' && r.status === 'pending'
  );

  // Check for pending link request
  const pendingLinkRequest = pendingRequests.find(
    r => r.request_type === 'link_artist' && r.status === 'pending'
  );

  // Create link artist request mutation
  const linkArtistMutation = useMutation({
    mutationFn: async (artistId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('user_requests')
        .insert({
          user_id: user.id,
          request_type: 'link_artist',
          status: 'pending',
          parameters: { artist_id: artistId },
        });

      if (error) throw error;
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
      if (!user?.id || !linkedArtist?.id) throw new Error('No linked artist');

      // Direct unlink - no admin approval needed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('artists')
        .update({ user_id: null })
        .eq('id', linkedArtist.id)
        .eq('user_id', user.id);

      if (error) throw error;
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
      if (!user?.id) throw new Error('Not authenticated');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('user_requests')
        .insert({
          user_id: user.id,
          request_type: 'delete_data',
          status: 'pending',
          parameters: { artist_id: linkedArtist?.id || null },
        });

      if (error) throw error;
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
    return (
      <div className='flex items-center justify-center gap-3 py-12'>
        <Loader2 className='h-5 w-5 animate-spin text-fm-gold' />
        <span className='text-muted-foreground'>{t('userArtist.loading')}</span>
      </div>
    );
  }

  // Show pending deletion state
  if (pendingDeleteRequest) {
    return (
      <div className='space-y-6'>
        <Card className='border-fm-danger/30 bg-fm-danger/5'>
          <CardContent className='p-6'>
            <div className='flex items-start gap-4'>
              <div className='p-3 bg-fm-danger/10 rounded-none'>
                <Clock className='h-6 w-6 text-fm-danger' />
              </div>
              <div className='flex-1'>
                <h3 className='font-canela text-lg font-medium text-fm-danger mb-2'>
                  {t('userArtist.pendingDeletion')}
                </h3>
                <p className='text-muted-foreground text-sm mb-4'>
                  {t('userArtist.pendingDeletionDescription')}
                </p>
                <p className='text-xs text-muted-foreground'>
                  {t('userArtist.requestedOn', { date: new Date(pendingDeleteRequest.created_at).toLocaleDateString() })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show linked artist
  if (linkedArtist) {
    return (
      <div className='space-y-6'>
        {/* Artist Card */}
        <Card className='border-border/30 bg-card/10 backdrop-blur-sm overflow-hidden'>
          <CardContent className='p-0'>
            <div className='flex gap-6'>
              {/* Artist Image */}
              <div className='w-32 h-32 flex-shrink-0'>
                {linkedArtist.image_url ? (
                  <img
                    src={linkedArtist.image_url}
                    alt={linkedArtist.name}
                    className='w-full h-full object-cover'
                  />
                ) : (
                  <div className='w-full h-full bg-gradient-gold flex items-center justify-center'>
                    <Music2 className='h-12 w-12 text-black' />
                  </div>
                )}
              </div>

              {/* Artist Info */}
              <div className='flex-1 py-4 pr-4'>
                <h3 className='font-canela text-xl font-medium mb-1'>{linkedArtist.name}</h3>
                {linkedArtist.genre && (
                  <p className='text-sm text-muted-foreground mb-2'>{linkedArtist.genre}</p>
                )}
                {linkedArtist.bio && (
                  <p className='text-sm text-muted-foreground line-clamp-2'>{linkedArtist.bio}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className='flex flex-wrap gap-3'>
          <FmCommonButton
            variant='default'
            size='sm'
            icon={ExternalLink}
            onClick={() => navigate(`/artists/${linkedArtist.id}`)}
          >
            {t('userArtist.viewArtistPage')}
          </FmCommonButton>

          <FmCommonButton
            variant='secondary'
            size='sm'
            icon={Settings}
            onClick={() => navigate(`/artists/${linkedArtist.id}/manage`)}
          >
            {t('userArtist.manageArtist')}
          </FmCommonButton>

          <FmCommonButton
            variant='secondary'
            size='sm'
            icon={Unlink}
            onClick={() => setShowUnlinkConfirm(true)}
          >
            {t('userArtist.unlinkAccount')}
          </FmCommonButton>

          <FmCommonButton
            variant='destructive'
            size='sm'
            icon={Trash2}
            onClick={() => setShowDeleteConfirm(true)}
          >
            {t('userArtist.requestDataDeletion')}
          </FmCommonButton>
        </div>

        {/* Unlink Confirmation Dialog */}
        <AlertDialog open={showUnlinkConfirm} onOpenChange={setShowUnlinkConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('userArtist.unlinkConfirmTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('userArtist.unlinkConfirmDescription', { name: linkedArtist.name })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('buttons.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => unlinkArtistMutation.mutate()}
                disabled={unlinkArtistMutation.isPending}
              >
                {unlinkArtistMutation.isPending ? t('userArtist.unlinking') : t('userArtist.unlink')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Data Confirmation Dialog */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className='text-fm-danger'>{t('userArtist.deleteConfirmTitle')}</AlertDialogTitle>
              <AlertDialogDescription className='space-y-2'>
                <p>
                  {t('userArtist.deleteConfirmDescription')}
                </p>
                <p className='text-muted-foreground'>
                  {t('userArtist.deleteConfirmNote')}
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('buttons.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteDataMutation.mutate()}
                disabled={deleteDataMutation.isPending}
                className='bg-fm-danger hover:bg-fm-danger/90'
              >
                {deleteDataMutation.isPending ? t('status.submitting') : t('userArtist.requestDeletion')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // No linked artist - show link option
  return (
    <div className='space-y-6'>
      {/* Pending Link Request Banner */}
      {pendingLinkRequest && (
        <Card className='border-fm-gold/30 bg-fm-gold/5'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3'>
              <Clock className='h-5 w-5 text-fm-gold' />
              <div>
                <p className='text-sm font-medium'>{t('userArtist.linkRequestPending')}</p>
                <p className='text-xs text-muted-foreground'>
                  {t('userArtist.linkRequestPendingDescription')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Request History */}
      {pendingRequests.filter(r => r.status !== 'pending').length > 0 && (
        <div className='space-y-2'>
          <h4 className='text-sm font-medium text-muted-foreground'>{t('userArtist.recentRequests')}</h4>
          {pendingRequests
            .filter(r => r.status !== 'pending')
            .slice(0, 3)
            .map(request => (
              <Card key={request.id} className='border-border/20 bg-card/5'>
                <CardContent className='p-3'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      {request.status === 'approved' ? (
                        <CheckCircle2 className='h-4 w-4 text-green-500' />
                      ) : (
                        <AlertCircle className='h-4 w-4 text-fm-danger' />
                      )}
                      <span className='text-sm'>
                        {request.request_type === 'link_artist' && t('userArtist.requestTypes.linkArtist')}
                        {request.request_type === 'unlink_artist' && t('userArtist.requestTypes.unlinkArtist')}
                        {request.request_type === 'delete_data' && t('userArtist.requestTypes.deleteData')}
                      </span>
                    </div>
                    <span className={`text-xs ${request.status === 'approved' ? 'text-green-500' : 'text-fm-danger'}`}>
                      {request.status === 'approved' ? t('status.approved') : t('status.denied')}
                    </span>
                  </div>
                  {request.denial_reason && (
                    <p className='text-xs text-muted-foreground mt-1 ml-6'>
                      {t('userArtist.reason')}: {request.denial_reason}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Empty State */}
      <Card className='border-border/30 bg-card/10 backdrop-blur-sm'>
        <CardContent className='p-12 text-center'>
          <Music2 className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
          <h3 className='font-canela text-xl font-medium mb-2'>{t('userArtist.noLinkedArtist')}</h3>
          <p className='text-muted-foreground text-sm mb-6 max-w-md mx-auto'>
            {t('userArtist.noLinkedArtistDescription')}
          </p>

          <FmCommonButton
            variant='secondary'
            icon={Link2}
            onClick={() => setShowLinkModal(true)}
            disabled={!!pendingLinkRequest}
          >
            {pendingLinkRequest ? t('userArtist.requestPending') : t('userArtist.linkArtistAccount')}
          </FmCommonButton>
        </CardContent>
      </Card>

      {/* Link Artist Modal */}
      <Dialog open={showLinkModal} onOpenChange={setShowLinkModal}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>{t('userArtist.linkArtistModalTitle')}</DialogTitle>
            <DialogDescription>
              {t('userArtist.linkArtistModalDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className='py-4'>
            <FmArtistSearchDropdown
              value={selectedArtistToLink?.id || null}
              onChange={(_id, artist) => {
                if (artist) {
                  setSelectedArtistToLink({ id: artist.id, name: artist.name });
                } else {
                  setSelectedArtistToLink(null);
                }
              }}
              placeholder={t('userArtist.searchArtistPlaceholder')}
              // Filter to only show artists without a user_id
              additionalFilters={[{ column: 'user_id', operator: 'is', value: null }]}
            />

            {selectedArtistToLink && (
              <div className='mt-4 p-3 bg-fm-gold/10 border border-fm-gold/20 rounded-none'>
                <p className='text-sm'>
                  {t('userArtist.requestingToLink')}: <strong>{selectedArtistToLink.name}</strong>
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setShowLinkModal(false)}>
              {t('buttons.cancel')}
            </Button>
            <Button
              variant='outline'
              onClick={() => selectedArtistToLink && linkArtistMutation.mutate(selectedArtistToLink.id)}
              disabled={!selectedArtistToLink || linkArtistMutation.isPending}
            >
              {linkArtistMutation.isPending ? t('status.submitting') : t('buttons.submitRequest')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

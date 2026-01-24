import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Link2,
  Trash2,
  Unlink,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  Calendar,
  MapPin,
  Music,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase, logger, cn, isDeletionRequest, getEntityTypeFromRequestType } from '@/shared';
import { useAuth } from '@/features/auth/services/AuthContext';
import { FmCommonModal } from '@/components/common/modals/FmCommonModal';
import { Button } from '@/components/common/shadcn/button';
import { Badge } from '@/components/common/shadcn/badge';
import { Textarea } from '@/components/common/shadcn/textarea';
import { Separator } from '@/components/common/shadcn/separator';
import type { DeletionRequestParameters } from '@/shared/types/deletionRequests';

interface UserRequest {
  id: string;
  request_type:
    | 'link_artist'
    | 'delete_data'
    | 'unlink_artist'
    | 'delete_venue'
    | 'delete_artist'
    | 'delete_organization';
  status: 'pending' | 'approved' | 'denied';
  user_id: string;
  parameters: Record<string, unknown> | null;
  denial_reason?: string | null;
  resolved_by?: string | null;
  resolved_at?: string | null;
  created_at: string;
  updated_at?: string;
  user?: {
    email: string;
    display_name: string | null;
  };
  artist?: {
    id: string;
    name: string;
    image_url: string | null;
  };
}

interface UserRequestDetailsModalProps {
  request: UserRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActionComplete?: () => void;
}

const REQUEST_TYPE_ICONS: Record<string, React.ReactNode> = {
  link_artist: <Link2 className='h-5 w-5' />,
  delete_data: <Trash2 className='h-5 w-5' />,
  unlink_artist: <Unlink className='h-5 w-5' />,
  delete_venue: <MapPin className='h-5 w-5' />,
  delete_artist: <Music className='h-5 w-5' />,
  delete_organization: <Building2 className='h-5 w-5' />,
};

export function UserRequestDetailsModal({
  request,
  open,
  onOpenChange,
  onActionComplete,
}: UserRequestDetailsModalProps) {
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const [showDenyForm, setShowDenyForm] = useState(false);
  const [denialReason, setDenialReason] = useState('');

  const REQUEST_TYPE_LABELS: Record<string, string> = {
    link_artist: t('admin.requests.linkArtist'),
    delete_data: t('admin.requests.deleteData'),
    unlink_artist: t('admin.requests.unlinkArtist'),
    delete_venue: t('admin.requests.deleteVenue'),
    delete_artist: t('admin.requests.deleteArtist'),
    delete_organization: t('admin.requests.deleteOrganization'),
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

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (req: UserRequest) => {
      if (!currentUser?.id) throw new Error('Not authenticated');

      // Handle entity deletion requests - delete the entity first
      if (isDeletionRequest(req.request_type)) {
        const params = req.parameters as DeletionRequestParameters | null;
        if (params?.entity_id) {
          const entityType = getEntityTypeFromRequestType(req.request_type);
          if (entityType) {
            const tableName =
              entityType === 'venue'
                ? 'venues'
                : entityType === 'artist'
                  ? 'artists'
                  : 'organizations';

            const { error: deleteError } = await supabase
              .from(tableName)
              .delete()
              .eq('id', params.entity_id);

            if (deleteError) {
              logger.error(`Failed to delete ${entityType}`, {
                error: deleteError.message,
                entityId: params.entity_id,
              });
              throw new Error(`Failed to delete ${entityType}: ${deleteError.message}`);
            }
          }
        }
      }

      const { error } = await supabase
        .from('user_requests')
        .update({
          status: 'approved',
          resolved_by: currentUser.id,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', req.id)
        .eq('status', 'pending');

      if (error) throw error;
    },
    onSuccess: (_, req) => {
      toast.success(tToast('admin.requestApproved'));
      queryClient.invalidateQueries({ queryKey: ['admin-user-requests'] });

      if (isDeletionRequest(req.request_type)) {
        const entityType = getEntityTypeFromRequestType(req.request_type);
        if (entityType) {
          queryClient.invalidateQueries({
            queryKey: [entityType === 'venue' ? 'venues' : entityType === 'artist' ? 'artists' : 'organizations'],
          });
        }
      }

      onOpenChange(false);
      onActionComplete?.();
    },
    onError: (error) => {
      logger.error('Failed to approve request', { error });
      toast.error(tToast('admin.requestApproveFailed'));
    },
  });

  // Deny mutation
  const denyMutation = useMutation({
    mutationFn: async ({ req, reason }: { req: UserRequest; reason: string }) => {
      if (!currentUser?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_requests')
        .update({
          status: 'denied',
          denial_reason: reason,
          resolved_by: currentUser.id,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', req.id)
        .eq('status', 'pending');

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(tToast('admin.requestDenied'));
      queryClient.invalidateQueries({ queryKey: ['admin-user-requests'] });
      onOpenChange(false);
      setShowDenyForm(false);
      setDenialReason('');
      onActionComplete?.();
    },
    onError: (error) => {
      logger.error('Failed to deny request', { error });
      toast.error(tToast('admin.requestDenyFailed'));
    },
  });

  const handleClose = () => {
    setShowDenyForm(false);
    setDenialReason('');
    onOpenChange(false);
  };

  const getApprovalDescription = () => {
    if (!request) return '';

    switch (request.request_type) {
      case 'link_artist':
        return t('admin.requests.approveDescLinkArtist', { artistName: request.artist?.name });
      case 'delete_data':
        return t('admin.requests.approveDescDeleteData');
      case 'unlink_artist':
        return t('admin.requests.approveDescUnlinkArtist');
      case 'delete_venue':
        return t('admin.requests.approveDescDeleteVenue', {
          venueName: (request.parameters as DeletionRequestParameters)?.entity_name,
        });
      case 'delete_artist':
        return t('admin.requests.approveDescDeleteArtist', {
          artistName: (request.parameters as DeletionRequestParameters)?.entity_name,
        });
      case 'delete_organization':
        return t('admin.requests.approveDescDeleteOrganization', {
          organizationName: (request.parameters as DeletionRequestParameters)?.entity_name,
        });
      default:
        return '';
    }
  };

  if (!request) return null;

  const isDeleteRequest = request.request_type.startsWith('delete');

  return (
    <FmCommonModal
      open={open}
      onOpenChange={handleClose}
      title={REQUEST_TYPE_LABELS[request.request_type]}
      className='max-w-lg'
    >
      <div className='space-y-4'>
        {/* Request Type Header */}
        <div className='flex items-center gap-3'>
          <div
            className={cn(
              'p-3',
              isDeleteRequest
                ? 'bg-fm-danger/10 text-fm-danger'
                : 'bg-fm-gold/10 text-fm-gold'
            )}
          >
            {REQUEST_TYPE_ICONS[request.request_type]}
          </div>
          <div>
            <Badge
              variant='outline'
              className={cn(
                'border-fm-gold/50 text-fm-gold'
              )}
            >
              <Clock className='h-3 w-3 mr-1' />
              {t('status.pending')}
            </Badge>
          </div>
        </div>

        <Separator className='bg-white/10' />

        {/* User Info */}
        <div className='space-y-2'>
          <div className='flex items-center gap-2 text-sm text-muted-foreground'>
            <User className='h-4 w-4' />
            <span className='text-white/70'>{t('labels.requestedBy')}:</span>
          </div>
          <div className='pl-6 text-white'>
            {request.user?.display_name || request.user?.email || t('globalSearch.unknownUser')}
          </div>
        </div>

        {/* Artist Info (for link/unlink requests) */}
        {request.artist && (
          <div className='space-y-2'>
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              <Music className='h-4 w-4' />
              <span className='text-white/70'>{t('labels.artist')}:</span>
            </div>
            <div className='flex items-center gap-3 pl-6'>
              {request.artist.image_url ? (
                <img
                  src={request.artist.image_url}
                  alt={request.artist.name}
                  className='h-10 w-10 object-cover'
                />
              ) : (
                <div className='h-10 w-10 bg-fm-gold/20 flex items-center justify-center'>
                  <User className='h-5 w-5 text-fm-gold' />
                </div>
              )}
              <span className='text-white font-medium'>{request.artist.name}</span>
            </div>
          </div>
        )}

        {/* Entity Info (for deletion requests) */}
        {isDeletionRequest(request.request_type) && request.parameters && (
          <div className='space-y-2'>
            <div className='flex items-center gap-2 text-sm text-muted-foreground'>
              {REQUEST_TYPE_ICONS[request.request_type]}
              <span className='text-white/70'>
                {t(`entities.${(request.parameters as DeletionRequestParameters).entity_type}`)}:
              </span>
            </div>
            <div className='flex items-center gap-3 pl-6'>
              <span className='text-white font-medium'>
                {(request.parameters as DeletionRequestParameters).entity_name}
              </span>
              <Link
                to={`/admin/${(request.parameters as DeletionRequestParameters).entity_type}s/${(request.parameters as DeletionRequestParameters).entity_id}`}
                className='text-fm-gold hover:underline text-sm flex items-center gap-1'
                onClick={() => handleClose()}
              >
                {t('buttons.viewDetails')}
                <ExternalLink className='h-3 w-3' />
              </Link>
            </div>
          </div>
        )}

        {/* Date */}
        <div className='flex items-center gap-2 text-sm text-muted-foreground'>
          <Calendar className='h-4 w-4' />
          <span>{t('admin.requests.requested')}: {formatDate(request.created_at)}</span>
        </div>

        <Separator className='bg-white/10' />

        {/* What will happen */}
        <div className='p-3 bg-white/5 border border-white/10'>
          <p className='text-sm text-white/80'>
            <strong className='text-white'>{t('labels.whatWillHappen')}:</strong>
          </p>
          <p className='text-sm text-white/70 mt-1'>
            {getApprovalDescription()}
          </p>
        </div>

        {/* Deny Form */}
        {showDenyForm && (
          <div className='space-y-3 p-3 border border-fm-danger/30 bg-fm-danger/5'>
            <p className='text-sm text-white/80'>{t('admin.requests.denyDescription')}</p>
            <Textarea
              placeholder={t('placeholders.enterDenialReason')}
              value={denialReason}
              onChange={(e) => setDenialReason(e.target.value)}
              rows={3}
              className='bg-black/40 border-white/20'
            />
          </div>
        )}

        {/* Actions */}
        <div className='flex gap-3 pt-2'>
          {!showDenyForm ? (
            <>
              <Button
                variant='outline'
                className='flex-1 border-fm-danger/50 text-fm-danger hover:bg-fm-danger/10'
                onClick={() => setShowDenyForm(true)}
              >
                <XCircle className='h-4 w-4 mr-2' />
                {t('buttons.deny')}
              </Button>
              <Button
                className='flex-1 bg-fm-success hover:bg-fm-success/80 text-black'
                onClick={() => approveMutation.mutate(request)}
                disabled={approveMutation.isPending}
              >
                <CheckCircle2 className='h-4 w-4 mr-2' />
                {approveMutation.isPending ? t('status.approving') : t('buttons.approve')}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant='outline'
                className='flex-1'
                onClick={() => {
                  setShowDenyForm(false);
                  setDenialReason('');
                }}
              >
                {t('buttons.cancel')}
              </Button>
              <Button
                variant='destructive'
                className='flex-1'
                onClick={() => denyMutation.mutate({ req: request, reason: denialReason })}
                disabled={!denialReason.trim() || denyMutation.isPending}
              >
                {denyMutation.isPending ? t('status.denying') : t('admin.requests.denyRequest')}
              </Button>
            </>
          )}
        </div>
      </div>
    </FmCommonModal>
  );
}
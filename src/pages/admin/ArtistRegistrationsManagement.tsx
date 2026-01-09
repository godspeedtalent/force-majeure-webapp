/**
 * ArtistRegistrationsManagement
 *
 * Admin component for reviewing and managing artist registration requests.
 * Supports approving, denying, and viewing registration details.
 * Registrations are never deleted - status is updated for audit trail.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X, Eye, Clock, CheckCircle2, XCircle, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { cn, logger } from '@/shared';
import { FmConfigurableDataGrid, DataGridAction, DataGridColumn, DataGridColumns } from '@/features/data-grid';
import { FmSocialLinks } from '@/components/common/display/FmSocialLinks';
import {
  useArtistRegistrationsData,
  useArtistRegistrationActions,
  ArtistRegistration,
  StatusFilter,
} from './hooks/useArtistRegistrations';
import {
  ArtistRegistrationDetailsModal,
  ArtistRegistrationApproveModal,
  ArtistRegistrationDenyModal,
  ArtistRegistrationDeleteModal,
} from './components/ArtistRegistrationModals';
import { FmFormSectionHeader } from '@/components/common/display/FmSectionHeader';

export function ArtistRegistrationsManagement() {
  const { t } = useTranslation('common');

  // Filter state
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');

  // Modal states
  const [selectedRegistration, setSelectedRegistration] = useState<ArtistRegistration | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showDenyConfirm, setShowDenyConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [registrationToAction, setRegistrationToAction] = useState<ArtistRegistration | null>(null);
  const [reviewerNotes, setReviewerNotes] = useState('');

  // Data and actions
  const { registrations, isLoading, genresMap, pendingCount } = useArtistRegistrationsData(statusFilter);
  const { handleApprove, handleDeny, handleDelete } = useArtistRegistrationActions();

  // Handle approve with error handling
  const onApprove = async () => {
    if (!registrationToAction) return;

    try {
      await handleApprove(registrationToAction, reviewerNotes);
      setShowApproveConfirm(false);
      setRegistrationToAction(null);
      setReviewerNotes('');
    } catch (error) {
      const pgError = error as { message?: string; details?: string; hint?: string; code?: string };
      logger.error('Failed to approve registration', {
        error: pgError.message || 'Unknown error',
        source: 'ArtistRegistrationsManagement',
        details: {
          registrationId: registrationToAction?.id,
          pgDetails: pgError.details,
          pgHint: pgError.hint,
          pgCode: pgError.code,
        },
      });

      // Show more descriptive error message based on error type
      if (pgError.code === '23505') {
        // Unique constraint violation
        toast.error(t('artistRegistrations.duplicateSpotifyId'));
      } else if (pgError.message?.includes('Spotify ID already exists')) {
        // Custom error from duplicate check
        toast.error(pgError.message);
      } else {
        toast.error(t('artistRegistrations.approveFailed'));
      }
    }
  };

  // Handle deny with error handling
  const onDeny = async () => {
    if (!registrationToAction) return;

    try {
      await handleDeny(registrationToAction, reviewerNotes);
      setShowDenyConfirm(false);
      setRegistrationToAction(null);
      setReviewerNotes('');
    } catch (error) {
      const pgError = error as { message?: string; details?: string; hint?: string; code?: string };
      logger.error('Failed to deny registration', {
        error: pgError.message || 'Unknown error',
        source: 'ArtistRegistrationsManagement',
        details: {
          registrationId: registrationToAction?.id,
          pgDetails: pgError.details,
          pgHint: pgError.hint,
          pgCode: pgError.code,
        },
      });
      toast.error(t('artistRegistrations.denyFailed'));
    }
  };

  // Handle delete with error handling
  const onDelete = async () => {
    if (!registrationToAction) return;

    try {
      await handleDelete(registrationToAction);
      setShowDeleteConfirm(false);
      setRegistrationToAction(null);
    } catch {
      toast.error(t('artistRegistrations.deleteFailed'));
    }
  };

  // Context menu actions
  const contextMenuActions: DataGridAction<ArtistRegistration>[] = [
    {
      label: t('artistRegistrations.viewDetails'),
      icon: <Eye className='h-4 w-4' />,
      onClick: (registration) => {
        setSelectedRegistration(registration);
        setShowDetailsModal(true);
      },
    },
    {
      label: t('artistRegistrations.approve'),
      icon: <Check className='h-4 w-4' />,
      onClick: (registration) => {
        if (registration.status !== 'pending') return;
        setRegistrationToAction(registration);
        setShowApproveConfirm(true);
      },
    },
    {
      label: t('artistRegistrations.deny'),
      icon: <X className='h-4 w-4' />,
      onClick: (registration) => {
        if (registration.status !== 'pending') return;
        setRegistrationToAction(registration);
        setShowDenyConfirm(true);
      },
      variant: 'destructive',
    },
    {
      label: t('artistRegistrations.delete'),
      icon: <Trash2 className='h-4 w-4' />,
      onClick: (registration) => {
        setRegistrationToAction(registration);
        setShowDeleteConfirm(true);
      },
      variant: 'destructive',
    },
  ];

  // Column definitions
  const columns: DataGridColumn[] = [
    DataGridColumns.image({
      key: 'profile_image_url',
      label: t('adminGrid.columns.image'),
      shape: 'circle',
      entityType: 'artist',
      editable: false,
    }),
    DataGridColumns.text({
      key: 'artist_name',
      label: t('adminGrid.columns.name'),
      sortable: true,
      filterable: true,
    }),
    DataGridColumns.text({
      key: 'email',
      label: t('adminGrid.columns.email'),
      sortable: true,
      filterable: true,
    }),
    {
      key: 'genres',
      label: t('adminGrid.columns.genres'),
      render: (value: string[] | null) => {
        if (!value || value.length === 0) {
          return <span className='text-muted-foreground'>—</span>;
        }
        return (
          <div className='flex flex-wrap gap-1'>
            {value.slice(0, 3).map((genreId, i) => {
              const genreName = genresMap.get(genreId) || genreId;
              return (
                <span
                  key={i}
                  className='px-2 py-0.5 text-[10px] uppercase bg-fm-gold/10 text-fm-gold border border-fm-gold/30'
                >
                  {genreName}
                </span>
              );
            })}
            {value.length > 3 && (
              <span className='text-xs text-muted-foreground'>+{value.length - 3}</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      label: t('adminGrid.columns.status'),
      sortable: true,
      filterable: true,
      render: (value: string) => {
        const statusConfig = {
          pending: {
            icon: Clock,
            className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
          },
          approved: {
            icon: CheckCircle2,
            className: 'bg-green-500/10 text-green-500 border-green-500/30',
          },
          denied: {
            icon: XCircle,
            className: 'bg-red-500/10 text-red-500 border-red-500/30',
          },
        };
        const config = statusConfig[value as keyof typeof statusConfig] || statusConfig.pending;
        const Icon = config.icon;

        return (
          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 text-xs uppercase border', config.className)}>
            <Icon className='h-3 w-3' />
            {t(`artistRegistrations.status.${value}`)}
          </span>
        );
      },
    },
    {
      key: 'city',
      label: t('adminGrid.columns.city'),
      render: (_value: unknown, row: ArtistRegistration) => {
        if (!row.city) return <span className='text-muted-foreground'>—</span>;
        return (
          <span className='text-xs'>
            {row.city.name}, {row.city.state}
          </span>
        );
      },
    },
    DataGridColumns.date({
      key: 'submitted_at',
      label: t('artistRegistrations.submittedAt'),
      format: 'short',
      sortable: true,
    }),
    DataGridColumns.text({
      key: 'instagram_handle',
      label: 'Instagram',
      sortable: true,
      filterable: true,
    }),
    DataGridColumns.text({
      key: 'tiktok_handle',
      label: 'TikTok',
      sortable: true,
      filterable: true,
    }),
    DataGridColumns.text({
      key: 'soundcloud_url',
      label: 'SoundCloud URL',
      sortable: true,
      filterable: true,
    }),
    DataGridColumns.text({
      key: 'spotify_url',
      label: 'Spotify URL',
      sortable: true,
      filterable: true,
    }),
    DataGridColumns.text({
      key: 'soundcloud_id',
      label: 'SoundCloud ID',
      sortable: true,
      filterable: true,
    }),
    DataGridColumns.text({
      key: 'spotify_id',
      label: 'Spotify ID',
      sortable: true,
      filterable: true,
    }),
    {
      key: 'socials',
      label: t('adminGrid.columns.socials'),
      render: (_value: unknown, row: ArtistRegistration) => {
        const hasSocials = row.instagram_handle || row.soundcloud_url || row.spotify_url || row.tiktok_handle;
        if (!hasSocials) return <span className='text-muted-foreground'>—</span>;

        return (
          <FmSocialLinks
            instagram={row.instagram_handle}
            soundcloud={row.soundcloud_url}
            spotify={row.spotify_url}
            tiktok={row.tiktok_handle}
            size='sm'
            gap='sm'
          />
        );
      },
    },
  ];

  return (
    <div className='space-y-6'>
      <FmFormSectionHeader
        title={t('artistRegistrations.title')}
        description={t('artistRegistrations.description')}
        icon={UserPlus}
      />

      {/* Status Filter Tabs */}
      <div className='flex gap-2 border-b border-white/10 pb-4'>
        {(['pending', 'approved', 'denied', 'all'] as StatusFilter[]).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-all duration-200 border',
              statusFilter === status
                ? 'bg-fm-gold/10 text-fm-gold border-fm-gold/50'
                : 'bg-transparent text-muted-foreground border-white/20 hover:bg-white/5 hover:text-foreground'
            )}
          >
            {t(`artistRegistrations.filter.${status}`)}
            {status === 'pending' && pendingCount > 0 && (
              <span className='ml-2 px-1.5 py-0.5 text-[10px] bg-fm-gold text-black font-bold'>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Data Grid */}
      <FmConfigurableDataGrid
        gridId='artist-registrations'
        data={registrations}
        columns={columns}
        contextMenuActions={contextMenuActions}
        loading={isLoading}
        pageSize={15}
        resourceName='Registration'
      />

      {/* Modals */}
      <ArtistRegistrationDetailsModal
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
        registration={selectedRegistration}
        onApprove={(reg) => {
          setRegistrationToAction(reg);
          setShowApproveConfirm(true);
        }}
        onDeny={(reg) => {
          setRegistrationToAction(reg);
          setShowDenyConfirm(true);
        }}
      />

      <ArtistRegistrationApproveModal
        open={showApproveConfirm}
        onOpenChange={(open) => {
          setShowApproveConfirm(open);
          if (!open) setRegistrationToAction(null);
        }}
        registration={registrationToAction}
        reviewerNotes={reviewerNotes}
        onReviewerNotesChange={setReviewerNotes}
        onConfirm={onApprove}
      />

      <ArtistRegistrationDenyModal
        open={showDenyConfirm}
        onOpenChange={(open) => {
          setShowDenyConfirm(open);
          if (!open) setRegistrationToAction(null);
        }}
        registration={registrationToAction}
        reviewerNotes={reviewerNotes}
        onReviewerNotesChange={setReviewerNotes}
        onConfirm={onDeny}
      />

      <ArtistRegistrationDeleteModal
        open={showDeleteConfirm}
        onOpenChange={(open) => {
          setShowDeleteConfirm(open);
          if (!open) setRegistrationToAction(null);
        }}
        registration={registrationToAction}
        onConfirm={onDelete}
      />
    </div>
  );
}

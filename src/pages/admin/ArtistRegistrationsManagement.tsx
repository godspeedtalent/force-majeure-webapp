/**
 * ArtistRegistrationsManagement
 *
 * Admin component for reviewing and managing artist registration requests.
 * Supports approving, denying, and viewing registration details.
 * Registrations are never deleted - status is updated for audit trail.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, X, Eye, Clock, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase, logger, cn } from '@/shared';
import { useAuth } from '@/features/auth/services/AuthContext';
import { RoleManagementService } from '@/shared/services/roleManagementService';
import { ROLES } from '@/shared/auth/permissions';
import { FmConfigurableDataGrid, DataGridAction, DataGridColumn, DataGridColumns } from '@/features/data-grid';
import { FmCommonButton } from '@/components/common/buttons';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/common/shadcn/dialog';
import { Button } from '@/components/common/shadcn/button';
import { FmSocialLinks } from '@/components/common/display/FmSocialLinks';

interface ArtistRegistration {
  id: string;
  user_id: string | null;
  artist_name: string;
  email: string | null;
  bio: string;
  genres: string[] | null;
  instagram_handle: string | null;
  soundcloud_url: string | null;
  soundcloud_id: string | null;
  soundcloud_set_url: string | null;
  spotify_url: string | null;
  spotify_id: string | null;
  spotify_track_url: string | null;
  tiktok_handle: string | null;
  profile_image_url: string | null;
  press_images: string[] | null;
  status: 'pending' | 'approved' | 'denied';
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  reviewer_notes: string | null;
  paid_show_count_group: string | null;
  talent_differentiator: string | null;
  crowd_sources: string | null;
  city_id: string | null;
  city?: { name: string; state: string } | null;
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'denied';

export function ArtistRegistrationsManagement() {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // State
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [selectedRegistration, setSelectedRegistration] = useState<ArtistRegistration | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showDenyConfirm, setShowDenyConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [registrationToAction, setRegistrationToAction] = useState<ArtistRegistration | null>(null);
  const [reviewerNotes, setReviewerNotes] = useState('');

  // Fetch registrations
  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ['artist-registrations', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('artist_registrations')
        .select(`
          *,
          city:cities!city_id(name, state)
        `)
        .order('submitted_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to fetch artist registrations', {
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }

      return (data ?? []) as ArtistRegistration[];
    },
  });

  // Fetch all genres for name lookup
  const { data: genresMap = new Map() } = useQuery({
    queryKey: ['genres-map'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('genres')
        .select('id, name');

      if (error) {
        logger.error('Failed to fetch genres', { error: error.message });
        return new Map<string, string>();
      }

      return new Map(data.map(g => [g.id, g.name]));
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch pending count for badge
  const { data: pendingCount = 0 } = useQuery({
    queryKey: ['artist-registrations-pending-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('artist_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) throw error;
      return count ?? 0;
    },
  });

  // Handle approve - creates artist record and links to user
  const handleApprove = async () => {
    if (!registrationToAction) return;

    try {
      // Step 1: Create the artist record from registration data
      const { data: newArtist, error: artistError } = await supabase
        .from('artists')
        .insert({
          name: registrationToAction.artist_name,
          bio: registrationToAction.bio || null,
          image_url: registrationToAction.profile_image_url || null,
          city_id: registrationToAction.city_id || null,
          user_id: registrationToAction.user_id || null,
          soundcloud_id: registrationToAction.soundcloud_id || null,
          spotify_id: registrationToAction.spotify_id || null,
          instagram_handle: registrationToAction.instagram_handle || null,
          tiktok_handle: registrationToAction.tiktok_handle || null,
          // Take first genre as the legacy single genre field
          genre: registrationToAction.genres?.[0] || null,
        })
        .select('id')
        .single();

      if (artistError) {
        logger.error('Failed to create artist from registration', {
          error: artistError.message,
          source: 'ArtistRegistrationsManagement',
          details: {
            registrationId: registrationToAction.id,
            pgDetails: artistError.details,
            pgHint: artistError.hint,
            pgCode: artistError.code,
          },
        });
        throw artistError;
      }

      logger.info('Artist created from registration', {
        source: 'ArtistRegistrationsManagement',
        details: { artistId: newArtist.id, registrationId: registrationToAction.id },
      });

      // Step 2: Update the registration status to approved
      const { error: updateError } = await supabase
        .from('artist_registrations')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id || null,
          reviewer_notes: reviewerNotes || null,
        })
        .eq('id', registrationToAction.id);

      if (updateError) {
        // If registration update fails, we should ideally rollback the artist creation
        // but for now just log it - the artist was created successfully
        logger.error('Failed to update registration status after artist creation', {
          error: updateError.message,
          source: 'ArtistRegistrationsManagement',
          details: { registrationId: registrationToAction.id, artistId: newArtist.id },
        });
        throw updateError;
      }

      // Step 3: Create artist recordings from tracks_metadata (not profile URLs)
      // Only create recordings from actual track/set URLs, not profile links
      const tracksMetadata = (registrationToAction as any).tracks_metadata as Array<{
        name: string;
        url: string;
        coverArt: string | null;
        platform: string;
        recordingType: 'track' | 'dj_set';
      }> | null;

      if (tracksMetadata && tracksMetadata.length > 0) {
        const recordingsToCreate = tracksMetadata.map((track, index) => ({
          artist_id: newArtist.id,
          name: track.name || `${registrationToAction.artist_name} - Recording ${index + 1}`,
          url: track.url,
          platform: track.platform,
          cover_art: track.coverArt || null,
          is_primary_dj_set: track.recordingType === 'dj_set' && index === 0,
        }));

        const { error: recordingsError } = await supabase
          .from('artist_recordings')
          .insert(recordingsToCreate);

        if (recordingsError) {
          // Log but don't fail - artist was created successfully
          logger.warn('Failed to create artist recordings from registration', {
            error: recordingsError.message,
            source: 'ArtistRegistrationsManagement',
            details: { artistId: newArtist.id, registrationId: registrationToAction.id },
          });
        } else {
          logger.info('Artist recordings created from registration', {
            source: 'ArtistRegistrationsManagement',
            details: { artistId: newArtist.id, count: recordingsToCreate.length },
          });
        }
      } else {
        // Fallback: Use legacy URL fields if tracks_metadata is empty
        // Only use the specific track/set URLs, NOT profile URLs
        const legacyRecordings: Array<{
          artist_id: string;
          name: string;
          url: string;
          platform: string;
          is_primary_dj_set: boolean;
        }> = [];

        if (registrationToAction.soundcloud_set_url) {
          legacyRecordings.push({
            artist_id: newArtist.id,
            name: `${registrationToAction.artist_name} - DJ Set`,
            url: registrationToAction.soundcloud_set_url,
            platform: 'soundcloud',
            is_primary_dj_set: true,
          });
        }
        if (registrationToAction.spotify_track_url) {
          legacyRecordings.push({
            artist_id: newArtist.id,
            name: `${registrationToAction.artist_name} - Track`,
            url: registrationToAction.spotify_track_url,
            platform: 'spotify',
            is_primary_dj_set: false,
          });
        }

        if (legacyRecordings.length > 0) {
          const { error: recordingsError } = await supabase
            .from('artist_recordings')
            .insert(legacyRecordings);

          if (recordingsError) {
            logger.warn('Failed to create legacy artist recordings', {
              error: recordingsError.message,
              source: 'ArtistRegistrationsManagement',
            });
          } else {
            logger.info('Legacy artist recordings created', {
              source: 'ArtistRegistrationsManagement',
              details: { artistId: newArtist.id, count: legacyRecordings.length },
            });
          }
        }
      }

      // Step 4: Assign artist role to the user (if they have a user_id)
      if (registrationToAction.user_id) {
        try {
          await RoleManagementService.addRole(registrationToAction.user_id, ROLES.ARTIST);
          logger.info('Artist role assigned to user', {
            source: 'ArtistRegistrationsManagement',
            details: { userId: registrationToAction.user_id, artistId: newArtist.id },
          });
        } catch (roleError) {
          // Log but don't fail the approval - the artist was created successfully
          logger.warn('Failed to assign artist role to user', {
            error: roleError instanceof Error ? roleError.message : 'Unknown error',
            source: 'ArtistRegistrationsManagement',
            details: { userId: registrationToAction.user_id, artistId: newArtist.id },
          });
        }
      }

      toast.success(t('artistRegistrations.approveSuccess', { name: registrationToAction.artist_name }));
      queryClient.invalidateQueries({ queryKey: ['artist-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['artist-registrations-pending-count'] });
      // Refresh dev/admin data grids that show newly created artists/recordings
      queryClient.invalidateQueries({ queryKey: ['admin-artists'] });
      queryClient.invalidateQueries({ queryKey: ['admin-recordings'] });
      queryClient.invalidateQueries({ queryKey: ['recordings-count'] });
      // Keep legacy invalidation for any other consumers
      queryClient.invalidateQueries({ queryKey: ['artists'] });
      setShowApproveConfirm(false);
      setRegistrationToAction(null);
      setReviewerNotes('');
    } catch (error) {
      const pgError = error as { message?: string; details?: string; hint?: string; code?: string };
      logger.error('Failed to approve registration', {
        error: pgError.message || 'Unknown error',
        source: 'ArtistRegistrationsManagement',
        details: {
          registrationId: registrationToAction.id,
          pgDetails: pgError.details,
          pgHint: pgError.hint,
          pgCode: pgError.code,
        },
      });
      toast.error(t('artistRegistrations.approveFailed'));
    }
  };

  // Handle deny
  const handleDeny = async () => {
    if (!registrationToAction) return;

    try {
      const updatePayload = {
        status: 'denied' as const,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id || null,
        reviewer_notes: reviewerNotes || null,
      };

      logger.info('Attempting to deny registration', {
        source: 'ArtistRegistrationsManagement',
        details: {
          registrationId: registrationToAction.id,
          userId: user?.id,
          payload: updatePayload,
        },
      });

      const { error, data } = await supabase
        .from('artist_registrations')
        .update(updatePayload)
        .eq('id', registrationToAction.id)
        .select();

      if (error) {
        logger.error('Supabase returned error', {
          source: 'ArtistRegistrationsManagement',
          details: {
            errorMessage: error.message,
            errorDetails: error.details,
            errorHint: error.hint,
            errorCode: error.code,
          },
        });
        throw error;
      }

      logger.info('Deny succeeded', {
        source: 'ArtistRegistrationsManagement',
        details: { updatedData: data },
      });

      toast.success(t('artistRegistrations.denySuccess', { name: registrationToAction.artist_name }));
      queryClient.invalidateQueries({ queryKey: ['artist-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['artist-registrations-pending-count'] });
      setShowDenyConfirm(false);
      setRegistrationToAction(null);
      setReviewerNotes('');
    } catch (error) {
      // PostgrestError has message, details, hint, and code properties
      const pgError = error as { message?: string; details?: string; hint?: string; code?: string };
      logger.error('Failed to deny registration', {
        error: pgError.message || 'Unknown error',
        source: 'ArtistRegistrationsManagement',
        details: {
          registrationId: registrationToAction.id,
          pgDetails: pgError.details,
          pgHint: pgError.hint,
          pgCode: pgError.code,
        },
      });
      toast.error(t('artistRegistrations.denyFailed'));
    }
  };

  // Handle delete (permanent removal)
  const handleDelete = async () => {
    if (!registrationToAction) return;

    try {
      const { error } = await supabase
        .from('artist_registrations')
        .delete()
        .eq('id', registrationToAction.id);

      if (error) throw error;

      toast.success(t('artistRegistrations.deleteSuccess', { name: registrationToAction.artist_name }));
      queryClient.invalidateQueries({ queryKey: ['artist-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['artist-registrations-pending-count'] });
      setShowDeleteConfirm(false);
      setRegistrationToAction(null);
    } catch (error) {
      logger.error('Failed to delete registration', {
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'ArtistRegistrationsManagement',
        details: { registrationId: registrationToAction.id },
      });
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
      render: (_value: any, row: ArtistRegistration) => {
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
    {
      key: 'socials',
      label: t('adminGrid.columns.socials'),
      render: (_value: any, row: ArtistRegistration) => {
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
      <div>
        <h1 className='text-3xl font-canela font-bold text-foreground mb-2'>
          {t('artistRegistrations.title')}
        </h1>
        <p className='text-muted-foreground'>
          {t('artistRegistrations.description')}
        </p>
      </div>

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

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='font-canela text-2xl'>
              {selectedRegistration?.artist_name}
            </DialogTitle>
          </DialogHeader>

          {selectedRegistration && (
            <div className='space-y-6'>
              {/* Profile Image and Basic Info */}
              <div className='flex gap-6'>
                {selectedRegistration.profile_image_url && (
                  <img
                    src={selectedRegistration.profile_image_url}
                    alt={selectedRegistration.artist_name}
                    className='w-32 h-32 object-cover border border-white/20'
                  />
                )}
                <div className='flex-1 space-y-2'>
                  <div>
                    <span className='text-xs uppercase text-muted-foreground'>{t('labels.email')}</span>
                    <p>{selectedRegistration.email || '—'}</p>
                  </div>
                  <div>
                    <span className='text-xs uppercase text-muted-foreground'>{t('adminGrid.columns.city')}</span>
                    <p>
                      {selectedRegistration.city
                        ? `${selectedRegistration.city.name}, ${selectedRegistration.city.state}`
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <span className='text-xs uppercase text-muted-foreground'>{t('adminGrid.columns.status')}</span>
                    <p className='capitalize'>{selectedRegistration.status}</p>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <span className='text-xs uppercase text-muted-foreground'>{t('adminGrid.columns.bio')}</span>
                <p className='mt-1 text-sm'>{selectedRegistration.bio || '—'}</p>
              </div>

              {/* Genres */}
              {selectedRegistration.genres && selectedRegistration.genres.length > 0 && (
                <div>
                  <span className='text-xs uppercase text-muted-foreground'>{t('adminGrid.columns.genres')}</span>
                  <div className='flex flex-wrap gap-2 mt-1'>
                    {selectedRegistration.genres.map((genre, i) => (
                      <span
                        key={i}
                        className='px-2 py-1 text-xs bg-fm-gold/10 text-fm-gold border border-fm-gold/30'
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Links */}
              <div>
                <span className='text-xs uppercase text-muted-foreground'>{t('adminGrid.columns.socials')}</span>
                <div className='mt-2'>
                  <FmSocialLinks
                    instagram={selectedRegistration.instagram_handle}
                    soundcloud={selectedRegistration.soundcloud_url}
                    spotify={selectedRegistration.spotify_url}
                    tiktok={selectedRegistration.tiktok_handle}
                    size='md'
                    gap='md'
                  />
                </div>
              </div>

              {/* Performance History */}
              <div className='space-y-4 border-t border-white/10 pt-4'>
                <h3 className='text-sm font-medium uppercase text-muted-foreground'>
                  {t('artistRegistrations.performanceHistory')}
                </h3>

                {selectedRegistration.paid_show_count_group && (
                  <div>
                    <span className='text-xs uppercase text-muted-foreground'>
                      {t('artistRegistrations.paidShows')}
                    </span>
                    <p className='mt-1 text-sm'>{selectedRegistration.paid_show_count_group}</p>
                  </div>
                )}

                {selectedRegistration.talent_differentiator && (
                  <div>
                    <span className='text-xs uppercase text-muted-foreground'>
                      {t('artistRegistrations.talentDifferentiator')}
                    </span>
                    <p className='mt-1 text-sm'>{selectedRegistration.talent_differentiator}</p>
                  </div>
                )}

                {selectedRegistration.crowd_sources && (
                  <div>
                    <span className='text-xs uppercase text-muted-foreground'>
                      {t('artistRegistrations.crowdSources')}
                    </span>
                    <p className='mt-1 text-sm'>{selectedRegistration.crowd_sources}</p>
                  </div>
                )}
              </div>

              {/* Press Images */}
              {selectedRegistration.press_images && selectedRegistration.press_images.length > 0 && (
                <div className='border-t border-white/10 pt-4'>
                  <span className='text-xs uppercase text-muted-foreground'>
                    {t('artistRegistrations.pressImages')}
                  </span>
                  <div className='flex gap-2 mt-2'>
                    {selectedRegistration.press_images.map((url, i) => (
                      <a key={i} href={url} target='_blank' rel='noopener noreferrer'>
                        <img
                          src={url}
                          alt={`Press ${i + 1}`}
                          className='w-20 h-20 object-cover border border-white/20 hover:border-fm-gold/50 transition-colors'
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Review Notes (if reviewed) */}
              {selectedRegistration.reviewer_notes && (
                <div className='border-t border-white/10 pt-4'>
                  <span className='text-xs uppercase text-muted-foreground'>
                    {t('artistRegistrations.reviewerNotes')}
                  </span>
                  <p className='mt-1 text-sm'>{selectedRegistration.reviewer_notes}</p>
                </div>
              )}

              {/* Action Buttons for Pending */}
              {selectedRegistration.status === 'pending' && (
                <div className='flex gap-4 border-t border-white/10 pt-4'>
                  <FmCommonButton
                    onClick={() => {
                      setRegistrationToAction(selectedRegistration);
                      setShowDetailsModal(false);
                      setShowApproveConfirm(true);
                    }}
                    className='flex-1'
                    icon={Check}
                  >
                    {t('artistRegistrations.approve')}
                  </FmCommonButton>
                  <FmCommonButton
                    onClick={() => {
                      setRegistrationToAction(selectedRegistration);
                      setShowDetailsModal(false);
                      setShowDenyConfirm(true);
                    }}
                    variant='destructive'
                    className='flex-1'
                    icon={X}
                  >
                    {t('artistRegistrations.deny')}
                  </FmCommonButton>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation */}
      <Dialog
        open={showApproveConfirm}
        onOpenChange={(open) => {
          setShowApproveConfirm(open);
          if (!open) {
            setRegistrationToAction(null);
            setReviewerNotes('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('artistRegistrations.confirmApprove')}</DialogTitle>
            <DialogDescription>
              {t('artistRegistrations.confirmApproveDescription', {
                name: registrationToAction?.artist_name,
              })}
            </DialogDescription>
          </DialogHeader>
          <div className='mt-4'>
            <label className='text-xs uppercase text-muted-foreground'>
              {t('artistRegistrations.reviewerNotes')} ({t('labels.optional')})
            </label>
            <textarea
              value={reviewerNotes}
              onChange={(e) => setReviewerNotes(e.target.value)}
              className='w-full mt-1 p-3 bg-white/5 border border-white/20 text-foreground text-sm resize-none focus:border-fm-gold/50 focus:outline-none'
              rows={3}
              placeholder={t('artistRegistrations.notesPlaceholder')}
            />
          </div>
          <DialogFooter className='mt-4'>
            <Button
              variant='outline'
              onClick={() => {
                setShowApproveConfirm(false);
                setRegistrationToAction(null);
                setReviewerNotes('');
              }}
            >
              {t('buttons.cancel')}
            </Button>
            <Button onClick={handleApprove}>
              {t('artistRegistrations.approve')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deny Confirmation */}
      <Dialog
        open={showDenyConfirm}
        onOpenChange={(open) => {
          setShowDenyConfirm(open);
          if (!open) {
            setRegistrationToAction(null);
            setReviewerNotes('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('artistRegistrations.confirmDeny')}</DialogTitle>
            <DialogDescription>
              {t('artistRegistrations.confirmDenyDescription', {
                name: registrationToAction?.artist_name,
              })}
            </DialogDescription>
          </DialogHeader>
          <div className='mt-4'>
            <label className='text-xs uppercase text-muted-foreground'>
              {t('artistRegistrations.reviewerNotes')} ({t('labels.optional')})
            </label>
            <textarea
              value={reviewerNotes}
              onChange={(e) => setReviewerNotes(e.target.value)}
              className='w-full mt-1 p-3 bg-white/5 border border-white/20 text-foreground text-sm resize-none focus:border-fm-gold/50 focus:outline-none'
              rows={3}
              placeholder={t('artistRegistrations.denyNotesPlaceholder')}
            />
          </div>
          <DialogFooter className='mt-4'>
            <Button
              variant='outline'
              onClick={() => {
                setShowDenyConfirm(false);
                setRegistrationToAction(null);
                setReviewerNotes('');
              }}
            >
              {t('buttons.cancel')}
            </Button>
            <Button variant='destructive' onClick={handleDeny}>
              {t('artistRegistrations.deny')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={showDeleteConfirm}
        onOpenChange={(open) => {
          setShowDeleteConfirm(open);
          if (!open) {
            setRegistrationToAction(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('artistRegistrations.confirmDelete')}</DialogTitle>
            <DialogDescription className='space-y-3'>
              <p>
                {t('artistRegistrations.confirmDeleteDescription', {
                  name: registrationToAction?.artist_name,
                })}
              </p>
              <div className='mt-4 p-3 bg-white/5 border border-white/20 space-y-2'>
                <p className='text-sm font-medium text-foreground'>
                  {t('artistRegistrations.deleteVsDenyTitle')}
                </p>
                <ul className='text-sm space-y-1'>
                  <li>
                    <span className='text-red-400 font-medium'>{t('artistRegistrations.deny')}:</span>{' '}
                    {t('artistRegistrations.denyExplanation')}
                  </li>
                  <li>
                    <span className='text-red-400 font-medium'>{t('artistRegistrations.delete')}:</span>{' '}
                    {t('artistRegistrations.deleteExplanation')}
                  </li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='mt-4'>
            <Button
              variant='outline'
              onClick={() => {
                setShowDeleteConfirm(false);
                setRegistrationToAction(null);
              }}
            >
              {t('buttons.cancel')}
            </Button>
            <Button variant='destructive' onClick={handleDelete}>
              {t('artistRegistrations.deletePermanently')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

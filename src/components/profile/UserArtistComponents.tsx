/**
 * UserArtistComponents
 *
 * Sub-components for UserArtistTab - display states for linked artist,
 * pending registration, and empty state.
 */

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Music2,
  Link2,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileText,
  UserPlus,
  ExternalLink,
  Settings,
  Unlink,
  Trash2,
} from 'lucide-react';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmI18nCommon } from '@/components/common/i18n';
import { FmCommonCard, FmCommonCardContent } from '@/components/common/display/FmCommonCard';
import { ArtistPreviewCard } from '@/pages/artists/components/ArtistPreviewCard';
import { Button } from '@/components/common/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/common/shadcn/dialog';
import { FmArtistSearchDropdown } from '@/components/common/search/FmArtistSearchDropdown';
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
import type { ArtistRegistrationFormData } from '@/pages/artists/types/registration';
import type {
  LinkedArtist,
  UserRequest,
  ArtistRegistrationWithGenres,
} from './hooks/useUserArtist';

// ============================================================================
// Helper Functions
// ============================================================================

export function convertRegistrationToFormData(
  registration: ArtistRegistrationWithGenres
): ArtistRegistrationFormData {
  const pressImages = registration.press_images || [];

  const tracks: ArtistRegistrationFormData['tracks'] = [];
  if (registration.spotify_track_url) {
    tracks.push({
      id: 'spotify-track',
      name: 'spotifyTrack',
      url: registration.spotify_track_url,
      platform: 'spotify',
      recordingType: 'track',
      isPrimaryDjSet: false,
    });
  }
  if (registration.soundcloud_set_url) {
    tracks.push({
      id: 'soundcloud-set',
      name: 'djSet',
      url: registration.soundcloud_set_url,
      platform: 'soundcloud',
      recordingType: 'dj_set',
      isPrimaryDjSet: true,
    });
  }

  return {
    stageName: registration.artist_name,
    bio: registration.bio || '',
    genres: registration.genreNames?.map((name, i) => ({
      id: registration.genres?.[i] || name,
      name,
      parentId: null,
      createdAt: null,
      updatedAt: null,
    })) || [],
    profileImageUrl: registration.profile_image_url || '',
    pressImage1Url: pressImages[0] || '',
    pressImage2Url: pressImages[1] || '',
    pressImage3Url: pressImages[2] || '',
    instagramHandle: registration.instagram_handle || '',
    soundcloudUrl: registration.soundcloud_url || '',
    spotifyUrl: registration.spotify_url || '',
    tiktokHandle: registration.tiktok_handle || '',
    tracks,
    spotifyArtistId: null,
    soundcloudUsername: null,
    cityId: null,
    notificationsOptIn: false,
    paidShowCountGroup: '',
    talentDifferentiator: '',
    crowdSources: '',
    agreeToTerms: false,
    followOnInstagram: false,
    stageNameError: null,
  };
}

// ============================================================================
// Pending Deletion State
// ============================================================================

interface PendingDeletionDisplayProps {
  pendingDeleteRequest: UserRequest;
}

export function PendingDeletionDisplay({ pendingDeleteRequest }: PendingDeletionDisplayProps) {
  const { t } = useTranslation('common');

  return (
    <div className='space-y-6'>
      <FmCommonCard className='border-fm-danger/30 bg-fm-danger/5'>
        <FmCommonCardContent className='p-6'>
          <div className='flex items-start gap-4'>
            <div className='p-3 bg-fm-danger/10 rounded-none'>
              <Clock className='h-6 w-6 text-fm-danger' />
            </div>
            <div className='flex-1'>
              <FmI18nCommon i18nKey='userArtist.pendingDeletion' as='h3' className='font-canela text-lg font-medium text-fm-danger mb-2' />
              <FmI18nCommon i18nKey='userArtist.pendingDeletionDescription' as='p' className='text-muted-foreground text-sm mb-4' />
              <p className='text-xs text-muted-foreground'>
                {t('userArtist.requestedOn', { date: new Date(pendingDeleteRequest.created_at).toLocaleDateString() })}
              </p>
            </div>
          </div>
        </FmCommonCardContent>
      </FmCommonCard>
    </div>
  );
}

// ============================================================================
// Registration Status Display
// ============================================================================

interface RegistrationStatusDisplayProps {
  registration: ArtistRegistrationWithGenres;
}

export function RegistrationStatusDisplay({ registration }: RegistrationStatusDisplayProps) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  const isPending = registration.status === 'pending';
  const isDenied = registration.status === 'denied';

  const statusConfig = {
    pending: {
      borderClass: 'border-fm-gold/30',
      bgClass: 'bg-fm-gold/5',
      iconBgClass: 'bg-fm-gold/10',
      iconClass: 'text-fm-gold',
      Icon: Clock,
    },
    denied: {
      borderClass: 'border-fm-danger/30',
      bgClass: 'bg-fm-danger/5',
      iconBgClass: 'bg-fm-danger/10',
      iconClass: 'text-fm-danger',
      Icon: XCircle,
    },
  };

  const config = statusConfig[registration.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = config.Icon;

  // Calculate reapply eligibility for denied registrations
  const getReapplyInfo = () => {
    if (!isDenied) return null;

    const denialDate = registration.reviewed_at
      ? new Date(registration.reviewed_at)
      : new Date(registration.submitted_at);
    const threeMonthsLater = new Date(denialDate);
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
    const now = new Date();
    const canReapply = now >= threeMonthsLater;

    if (canReapply) return { canReapply: true };

    const msRemaining = threeMonthsLater.getTime() - now.getTime();
    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
    const monthsRemaining = Math.ceil(daysRemaining / 30);
    const waitTimeText = monthsRemaining > 1
      ? t('userArtist.registration.monthsRemaining', { count: monthsRemaining })
      : daysRemaining > 1
        ? t('userArtist.registration.daysRemaining', { count: daysRemaining })
        : t('userArtist.registration.dayRemaining');

    return { canReapply: false, waitTimeText };
  };

  const reapplyInfo = getReapplyInfo();

  return (
    <div className='space-y-6'>
      {/* Registration Status Card */}
      <FmCommonCard className={`${config.borderClass} ${config.bgClass}`}>
        <FmCommonCardContent className='p-6'>
          <div className='flex items-start gap-4'>
            <div className={`p-3 ${config.iconBgClass} rounded-none`}>
              <StatusIcon className={`h-6 w-6 ${config.iconClass}`} />
            </div>
            <div className='flex-1'>
              <h3 className={`font-canela text-lg font-medium mb-1 ${isPending ? 'text-fm-gold' : 'text-fm-danger'}`}>
                {isPending && t('userArtist.registration.pendingTitle')}
                {isDenied && t('userArtist.registration.deniedTitle')}
              </h3>
              <p className='text-muted-foreground text-sm mb-3'>
                {isPending && t('userArtist.registration.pendingDescription')}
                {isDenied && t('userArtist.registration.deniedDescription')}
              </p>
              {isDenied && registration.reviewer_notes && (
                <div className='p-3 bg-white/5 border border-white/10 mb-3'>
                  <p className='text-xs text-muted-foreground mb-1'>{t('userArtist.registration.reviewerNotes')}:</p>
                  <p className='text-sm'>{registration.reviewer_notes}</p>
                </div>
              )}
              <p className='text-xs text-muted-foreground'>
                {t('userArtist.registration.submittedOn', { date: new Date(registration.submitted_at).toLocaleDateString() })}
              </p>
            </div>
          </div>
        </FmCommonCardContent>
      </FmCommonCard>

      {/* Artist Preview Card */}
      <ArtistPreviewCard
        formData={convertRegistrationToFormData(registration)}
        genreBadges={registration.genreNames?.map(name => ({ label: name })) || []}
      />

      {/* Reapply section for denied registrations */}
      {isDenied && reapplyInfo && (
        reapplyInfo.canReapply ? (
          <div className='text-center'>
            <FmCommonButton
              variant='secondary'
              icon={FileText}
              onClick={() => navigate('/artists/register')}
            >
              {t('userArtist.registration.submitNewApplication')}
            </FmCommonButton>
          </div>
        ) : (
          <FmCommonCard className='border-white/10 bg-white/5'>
            <FmCommonCardContent className='p-4 text-center'>
              <Clock className='h-5 w-5 text-muted-foreground mx-auto mb-2' />
              <p className='text-sm text-muted-foreground mb-1'>
                {t('userArtist.registration.waitingPeriodMessage')}
              </p>
              <p className='text-xs text-muted-foreground'>
                {t('userArtist.registration.canReapplyIn', { time: reapplyInfo.waitTimeText })}
              </p>
            </FmCommonCardContent>
          </FmCommonCard>
        )
      )}
    </div>
  );
}

// ============================================================================
// Linked Artist Display
// ============================================================================

interface LinkedArtistDisplayProps {
  linkedArtist: LinkedArtist;
  isEditable: boolean;
  showUnlinkConfirm: boolean;
  setShowUnlinkConfirm: (show: boolean) => void;
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (show: boolean) => void;
  onUnlink: () => void;
  onDeleteRequest: () => void;
  isUnlinking: boolean;
  isDeleting: boolean;
}

export function LinkedArtistDisplay({
  linkedArtist,
  isEditable,
  showUnlinkConfirm,
  setShowUnlinkConfirm,
  showDeleteConfirm,
  setShowDeleteConfirm,
  onUnlink,
  onDeleteRequest,
  isUnlinking,
  isDeleting,
}: LinkedArtistDisplayProps) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  return (
    <div className='space-y-6'>
      {/* Artist Spotlight Card */}
      <div className='bg-black/60 backdrop-blur-md border border-white/20 rounded-none p-[30px]'>
        <div className='flex flex-col gap-6 md:flex-row md:items-stretch'>
          {/* Left: Image Column */}
          <div className='w-full md:w-48 flex-shrink-0'>
            <div className='overflow-hidden rounded-none border border-white/15 bg-white/5 shadow-inner'>
              {linkedArtist.image_url ? (
                <img
                  src={linkedArtist.image_url}
                  alt={linkedArtist.name}
                  className='aspect-[3/4] w-full object-cover'
                />
              ) : (
                <div className='aspect-[3/4] w-full bg-gradient-gold flex items-center justify-center'>
                  <Music2 className='h-12 w-12 text-black' />
                </div>
              )}
            </div>
          </div>

          {/* Right: Content Column */}
          <div className='flex-1 flex flex-col gap-4'>
            <div className='space-y-2'>
              <p className='text-[10px] uppercase tracking-[0.35em] text-white/50 font-canela'>
                {t('artistPreview.spotlight')}
              </p>
              <h2 className='text-2xl md:text-3xl font-canela font-semibold text-white leading-tight'>
                {linkedArtist.name}
              </h2>
              <div className='w-full h-[1px] bg-white/30' />
            </div>

            {(linkedArtist.artist_genres?.length || linkedArtist.genre) && (
              <div className='flex items-center gap-2'>
                <Music2 className='h-4 w-4 text-fm-gold' />
                <div className='flex flex-wrap gap-1.5'>
                  {linkedArtist.artist_genres?.length ? (
                    linkedArtist.artist_genres.map((ag) => (
                      <span key={ag.genre_id} className='text-sm text-fm-gold bg-fm-gold/10 px-2 py-0.5 border border-fm-gold/30'>
                        {ag.genres?.name}
                      </span>
                    ))
                  ) : (
                    <span className='text-sm text-fm-gold'>{linkedArtist.genre}</span>
                  )}
                </div>
              </div>
            )}

            <div className='prose prose-invert max-w-none text-sm text-white/80 leading-relaxed font-canela flex-1'>
              {linkedArtist.bio || t('artistProfile.noBioAvailable')}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons - Only shown when isEditable */}
      {isEditable && (
        <>
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
                  onClick={onUnlink}
                  disabled={isUnlinking}
                >
                  {isUnlinking ? t('userArtist.unlinking') : t('userArtist.unlink')}
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
                  onClick={onDeleteRequest}
                  disabled={isDeleting}
                  className='bg-fm-danger hover:bg-fm-danger/90'
                >
                  {isDeleting ? t('status.submitting') : t('userArtist.requestDeletion')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}

// ============================================================================
// No Linked Artist Display (Empty State)
// ============================================================================

interface NoLinkedArtistDisplayProps {
  pendingLinkRequest: UserRequest | undefined;
  pendingRequests: UserRequest[];
  showLinkModal: boolean;
  setShowLinkModal: (show: boolean) => void;
  selectedArtistToLink: { id: string; name: string } | null;
  setSelectedArtistToLink: (artist: { id: string; name: string } | null) => void;
  onLinkArtist: (artistId: string) => void;
  isLinking: boolean;
}

export function NoLinkedArtistDisplay({
  pendingLinkRequest,
  pendingRequests,
  showLinkModal,
  setShowLinkModal,
  selectedArtistToLink,
  setSelectedArtistToLink,
  onLinkArtist,
  isLinking,
}: NoLinkedArtistDisplayProps) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  // Filter requests for history display
  const historyRequests = pendingRequests
    .filter(r => r.status !== 'pending' && !(r.request_type === 'link_artist' && r.status === 'approved'))
    .slice(0, 3);

  return (
    <div className='space-y-6'>
      {/* Pending Link Request Banner */}
      {pendingLinkRequest && (
        <FmCommonCard className='border-fm-gold/30 bg-fm-gold/5'>
          <FmCommonCardContent className='p-4'>
            <div className='flex items-center gap-3'>
              <Clock className='h-5 w-5 text-fm-gold' />
              <div>
                <p className='text-sm font-medium'>{t('userArtist.linkRequestPending')}</p>
                <p className='text-xs text-muted-foreground'>
                  {t('userArtist.linkRequestPendingDescription')}
                </p>
              </div>
            </div>
          </FmCommonCardContent>
        </FmCommonCard>
      )}

      {/* Recent Request History */}
      {historyRequests.length > 0 && (
        <div className='space-y-2'>
          <FmI18nCommon i18nKey='userArtist.recentRequests' as='h4' className='text-sm font-medium text-muted-foreground' />
          {historyRequests.map(request => (
            <FmCommonCard key={request.id} className='border-border/20 bg-card/5'>
              <FmCommonCardContent className='p-3'>
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
              </FmCommonCardContent>
            </FmCommonCard>
          ))}
        </div>
      )}

      {/* Empty State */}
      <FmCommonCard className='border-border/30 backdrop-blur-sm'>
        <FmCommonCardContent className='p-12 text-center'>
          <Music2 className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
          <FmI18nCommon i18nKey='userArtist.noLinkedArtist' as='h3' className='font-canela text-xl font-medium mb-2' />
          <FmI18nCommon i18nKey='userArtist.noLinkedArtistDescription' as='p' className='text-muted-foreground text-sm mb-6 max-w-md mx-auto' />

          <div className='flex flex-col sm:flex-row items-center justify-center gap-3'>
            <FmCommonButton
              variant='gold'
              icon={UserPlus}
              onClick={() => navigate('/artists/register')}
            >
              {t('userArtist.signUpAsArtist')}
            </FmCommonButton>

            <FmCommonButton
              variant='secondary'
              icon={Link2}
              onClick={() => setShowLinkModal(true)}
              disabled={!!pendingLinkRequest}
            >
              {pendingLinkRequest ? t('userArtist.requestPending') : t('userArtist.linkArtistAccount')}
            </FmCommonButton>
          </div>
        </FmCommonCardContent>
      </FmCommonCard>

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
              onClick={() => selectedArtistToLink && onLinkArtist(selectedArtistToLink.id)}
              disabled={!selectedArtistToLink || isLinking}
            >
              {isLinking ? t('status.submitting') : t('buttons.submitRequest')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

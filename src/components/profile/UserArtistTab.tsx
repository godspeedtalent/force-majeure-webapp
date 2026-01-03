/**
 * UserArtistTab
 *
 * Tab for user profile that shows linked artist info, registration status,
 * or options to link/register as an artist.
 */

import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { useUserArtist } from './hooks';
import {
  PendingDeletionDisplay,
  RegistrationStatusDisplay,
  LinkedArtistDisplay,
  NoLinkedArtistDisplay,
} from './UserArtistComponents';

interface UserArtistTabProps {
  /** When true, shows action buttons for managing the artist */
  isEditable?: boolean;
}

export function UserArtistTab({ isEditable = false }: UserArtistTabProps) {
  const { t } = useTranslation('common');

  const {
    // Data
    linkedArtist,
    artistRegistration,
    pendingRequests,
    pendingDeleteRequest,
    pendingLinkRequest,

    // Loading states
    isLoading,

    // Modal states
    showLinkModal,
    setShowLinkModal,
    showUnlinkConfirm,
    setShowUnlinkConfirm,
    showDeleteConfirm,
    setShowDeleteConfirm,
    selectedArtistToLink,
    setSelectedArtistToLink,

    // Mutations
    linkArtistMutation,
    unlinkArtistMutation,
    deleteDataMutation,
  } = useUserArtist();

  // Loading state
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
    return <PendingDeletionDisplay pendingDeleteRequest={pendingDeleteRequest} />;
  }

  // Show artist registration status (pending or denied only - approved shows linked artist)
  if (artistRegistration && !linkedArtist) {
    const isPendingOrDenied = artistRegistration.status === 'pending' || artistRegistration.status === 'denied';

    if (isPendingOrDenied) {
      return <RegistrationStatusDisplay registration={artistRegistration} />;
    }
  }

  // Show linked artist
  if (linkedArtist) {
    return (
      <LinkedArtistDisplay
        linkedArtist={linkedArtist}
        isEditable={isEditable}
        showUnlinkConfirm={showUnlinkConfirm}
        setShowUnlinkConfirm={setShowUnlinkConfirm}
        showDeleteConfirm={showDeleteConfirm}
        setShowDeleteConfirm={setShowDeleteConfirm}
        onUnlink={() => unlinkArtistMutation.mutate()}
        onDeleteRequest={() => deleteDataMutation.mutate()}
        isUnlinking={unlinkArtistMutation.isPending}
        isDeleting={deleteDataMutation.isPending}
      />
    );
  }

  // No linked artist - show link option
  return (
    <NoLinkedArtistDisplay
      pendingLinkRequest={pendingLinkRequest}
      pendingRequests={pendingRequests}
      showLinkModal={showLinkModal}
      setShowLinkModal={setShowLinkModal}
      selectedArtistToLink={selectedArtistToLink}
      setSelectedArtistToLink={setSelectedArtistToLink}
      onLinkArtist={(artistId) => linkArtistMutation.mutate(artistId)}
      isLinking={linkArtistMutation.isPending}
    />
  );
}

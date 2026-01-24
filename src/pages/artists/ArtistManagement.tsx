/**
 * ArtistManagement
 *
 * Page for managing artist profiles - overview, music, social media, and gallery.
 * Uses extracted hook for state management and tab components for content.
 */

import { useParams, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Eye,
  Share2,
  Headphones,
  Music,
  Image as ImageIcon,
} from 'lucide-react';
import { SideNavbarLayout } from '@/components/layout/SidebarLayout';
import { FmCommonSideNavGroup } from '@/components/common/navigation/FmCommonSideNav';
import { MobileBottomTabBar, MobileBottomTab } from '@/components/mobile';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmCommonConfirmDialog } from '@/components/common/modals/FmCommonConfirmDialog';
import { UnsavedChangesDialog } from '@/components/common/modals/UnsavedChangesDialog';
import { FmStickyFormFooter } from '@/components/common/forms/FmStickyFormFooter';
import { PageErrorBoundary } from '@/components/common/feedback';
import { useUnsavedChanges } from '@/shared/hooks';
import { useAuth } from '@/features/auth/services/AuthContext';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { useArtistManagement, type ArtistTab } from './hooks';
import {
  ArtistOverviewTab,
  ArtistMusicTab,
  ArtistSocialTab,
  ArtistManageGalleryTab,
} from './components/manage';

export default function ArtistManagement() {
  const { t } = useTranslation('common');
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { isAdmin, hasRole } = useUserPermissions();

  const {
    // Artist data
    artist,
    isLoading,

    // UI State
    activeTab,
    isDeleting,
    isSaving,
    isDirty,
    showDeleteConfirm,
    setShowDeleteConfirm,

    // Form state - Overview
    name,
    setName,
    bio,
    setBio,
    website,
    setWebsite,

    // Form state - Genres
    selectedGenres,
    handleGenreChange,

    // Form state - Social Links
    email,
    setEmail,
    instagram,
    setInstagram,
    tiktok,
    setTiktok,
    soundcloud,
    setSoundcloud,
    spotify,
    setSpotify,
    twitter,
    setTwitter,
    facebook,
    setFacebook,
    youtube,
    setYoutube,

    // Recording state
    recordings,
    isRecordingsLoading,
    isAddRecordingModalOpen,
    setIsAddRecordingModalOpen,
    editingRecording,
    setEditingRecording,
    recordingToDelete,
    setRecordingToDelete,
    deleteRecordingMutation,

    // Handlers
    handleSave,
    handleDelete,
    handleDeleteClick,
    handleTabChange,

    // Recording handlers
    handleAddRecording,
    handleEditRecording,
    handleUpdateRecording,
    handleDeleteRecording,
    confirmDeleteRecording,
    handleSetPrimaryRecording,
    handleRefetchRecording,
  } = useArtistManagement({ artistId: id });

  // Unsaved changes warning
  const unsavedChanges = useUnsavedChanges({ isDirty });

  // Navigation configuration
  const navigationGroups: FmCommonSideNavGroup<ArtistTab>[] = [
    {
      label: t('artistNav.artistDetails'),
      icon: Music,
      items: [
        {
          id: 'view',
          label: t('artistNav.viewArtist'),
          icon: Eye,
          description: t('artistNav.viewArtistDescription'),
          isExternal: true,
        },
        {
          id: 'overview',
          label: t('artistNav.overview'),
          icon: FileText,
          description: t('artistNav.overviewDescription'),
        },
        {
          id: 'music',
          label: t('artistNav.music'),
          icon: Headphones,
          description: t('artistNav.musicDescription'),
        },
        {
          id: 'social',
          label: t('artistNav.socialMedia'),
          icon: Share2,
          description: t('artistNav.socialMediaDescription'),
        },
        {
          id: 'gallery',
          label: t('artistNav.gallery'),
          icon: ImageIcon,
          description: t('artistNav.galleryDescription'),
        },
      ],
    },
  ];

  // Mobile tabs configuration
  const mobileTabs: MobileBottomTab[] = [
    { id: 'overview', label: t('artistNav.overview'), icon: FileText },
    { id: 'music', label: t('artistNav.music'), icon: Headphones },
    { id: 'social', label: t('artistNav.socialMedia'), icon: Share2 },
    { id: 'gallery', label: t('artistNav.gallery'), icon: ImageIcon },
    { id: 'view', label: t('artistNav.viewArtist'), icon: Eye },
  ];

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background'>
        <FmCommonLoadingSpinner size='lg' />
      </div>
    );
  }

  // Check if user has access to manage this artist (after loading completes)
  const canManageArtist = isAdmin() || hasRole('developer') || (artist?.user_id && artist.user_id === user?.id);

  // Redirect if user doesn't have permission to manage this artist
  if (!canManageArtist) {
    return <Navigate to='/' replace />;
  }

  return (
    <>
      <SideNavbarLayout
        navigationGroups={navigationGroups}
        activeItem={activeTab}
        onItemChange={handleTabChange}
        contentWidth="READABLE"
      >
        {activeTab === 'overview' && (
          <PageErrorBoundary section='Overview'>
            <ArtistOverviewTab
              name={name}
              onNameChange={setName}
              bio={bio}
              onBioChange={setBio}
              selectedGenres={selectedGenres}
              onGenreChange={handleGenreChange}
              onDeleteClick={handleDeleteClick}
              isDeleting={isDeleting}
            />
          </PageErrorBoundary>
        )}

        {activeTab === 'music' && id && (
          <PageErrorBoundary section='Music'>
            <ArtistMusicTab
              artistId={id}
              recordings={recordings}
              isRecordingsLoading={isRecordingsLoading}
              isAddRecordingModalOpen={isAddRecordingModalOpen}
              onAddRecordingModalChange={setIsAddRecordingModalOpen}
              editingRecording={editingRecording}
              onEditingRecordingChange={setEditingRecording}
              recordingToDelete={recordingToDelete}
              onRecordingToDeleteChange={setRecordingToDelete}
              isDeleting={deleteRecordingMutation.isPending}
              onAddRecording={handleAddRecording}
              onEditRecording={handleEditRecording}
              onUpdateRecording={handleUpdateRecording}
              onDeleteRecording={handleDeleteRecording}
              onConfirmDeleteRecording={confirmDeleteRecording}
              onRefetchRecording={handleRefetchRecording}
              onSetPrimaryRecording={handleSetPrimaryRecording}
            />
          </PageErrorBoundary>
        )}

        {activeTab === 'social' && (
          <PageErrorBoundary section='Social Media'>
            <ArtistSocialTab
              spotify={spotify}
              onSpotifyChange={setSpotify}
              soundcloud={soundcloud}
              onSoundcloudChange={setSoundcloud}
              email={email}
              onEmailChange={setEmail}
              website={website}
              onWebsiteChange={setWebsite}
              instagram={instagram}
              onInstagramChange={setInstagram}
              tiktok={tiktok}
              onTiktokChange={setTiktok}
              twitter={twitter}
              onTwitterChange={setTwitter}
              facebook={facebook}
              onFacebookChange={setFacebook}
              youtube={youtube}
              onYoutubeChange={setYoutube}
            />
          </PageErrorBoundary>
        )}

        {activeTab === 'gallery' && id && (
          <PageErrorBoundary section='Gallery'>
            <ArtistManageGalleryTab
              artistId={id}
              artistName={name}
              galleryId={artist?.gallery_id || null}
            />
          </PageErrorBoundary>
        )}

        <FmCommonConfirmDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          title={t('buttons.deleteArtist')}
          description={t('dialogs.deleteArtistConfirm')}
          confirmText={t('buttons.delete')}
          onConfirm={handleDelete}
          variant='destructive'
          isLoading={isDeleting}
        />

        <UnsavedChangesDialog
          open={unsavedChanges.showDialog}
          onConfirm={unsavedChanges.confirmNavigation}
          onCancel={unsavedChanges.cancelNavigation}
        />

        {/* Sticky Save Footer - shows on overview and social tabs */}
        {(activeTab === 'overview' || activeTab === 'social') && (
          <FmStickyFormFooter
            isDirty={isDirty}
            isSaving={isSaving}
            disabled={!name}
            onSave={handleSave}
          />
        )}
      </SideNavbarLayout>

      {/* Mobile bottom tab bar */}
      <MobileBottomTabBar
        tabs={mobileTabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />
    </>
  );
}

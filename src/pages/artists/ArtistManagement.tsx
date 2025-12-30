import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Save,
  Eye,
  Share2,
  Headphones,
  Trash2,
  Music,
  Image as ImageIcon,
} from 'lucide-react';
import {
  FaInstagram,
  FaXTwitter,
  FaFacebook,
  FaTiktok,
  FaYoutube,
} from 'react-icons/fa6';
import { supabase, logger } from '@/shared';
import { SideNavbarLayout } from '@/components/layout/SideNavbarLayout';
import { FmCommonSideNavGroup } from '@/components/common/navigation/FmCommonSideNav';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmImageUpload } from '@/components/common/forms/FmImageUpload';
import { FmCommonConfirmDialog } from '@/components/common/modals/FmCommonConfirmDialog';
import { FmI18nCommon } from '@/components/common/i18n';
import { FmRecordingsGrid } from '@/components/artist/FmRecordingsGrid';
import { toast } from 'sonner';
import { handleError } from '@/shared/services/errorHandler';
import { useDebouncedSave } from '@/shared/hooks/useDebouncedSave';
import { FmGenreMultiSelect } from '@/features/artists/components/FmGenreMultiSelect';
import { AddRecordingModal } from '@/features/artists/components/AddRecordingModal';
import { EditRecordingModal } from '@/features/artists/components/EditRecordingModal';
import { ArtistManageGalleryTab } from './components/manage/ArtistManageGalleryTab';
import { useArtistGenres, useUpdateArtistGenres } from '@/features/artists/hooks/useArtistGenres';
import {
  useArtistRecordings,
  useCreateRecording,
  useUpdateRecording,
  useDeleteRecording,
  useSetPrimaryRecording,
  type ArtistRecording,
  type CreateRecordingData,
} from '@/shared/api/queries/recordingQueries';

import type { Genre } from '@/features/artists/types';
import { cn } from '@/shared';

type ArtistTab = 'overview' | 'music' | 'social' | 'gallery' | 'view';

// Types for social links (stored in spotify_data JSON field)
interface SocialLinks {
  instagram?: string;
  twitter?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
}

interface ArtistMetadata {
  socialLinks?: SocialLinks;
}

export default function ArtistManagement() {
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ArtistTab>('overview');
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form state - Overview
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Form state - Genres
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);

  // Form state - Social Links
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [facebook, setFacebook] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [youtube, setYoutube] = useState('');

  // Recording modal state
  const [isAddRecordingModalOpen, setIsAddRecordingModalOpen] = useState(false);
  const [editingRecording, setEditingRecording] = useState<ArtistRecording | null>(null);
  const [recordingToDelete, setRecordingToDelete] = useState<ArtistRecording | null>(null);

  // Hooks for genre management
  const { data: artistGenres } = useArtistGenres(id);
  const updateGenresMutation = useUpdateArtistGenres();

  // Hooks for recording management
  const { data: recordings = [], isLoading: isRecordingsLoading } = useArtistRecordings(id);
  const createRecordingMutation = useCreateRecording();
  const updateRecordingMutation = useUpdateRecording();
  const deleteRecordingMutation = useDeleteRecording();
  const setPrimaryMutation = useSetPrimaryRecording();

  // Build metadata object for saving (social links only - tracks are now in separate table)
  const buildMetadata = (): ArtistMetadata => ({
    socialLinks: {
      instagram: instagram || undefined,
      twitter: twitter || undefined,
      facebook: facebook || undefined,
      tiktok: tiktok || undefined,
      youtube: youtube || undefined,
    },
  });

  // Debounced auto-save for artist changes
  const saveArtistData = async (data: {
    name: string;
    bio: string;
    website: string;
    image_url: string;
    spotify_data: ArtistMetadata;
  }) => {
    if (!id) return;

    try {
      const { error } = await supabase
        .from('artists')
        .update({
          name: data.name,
          bio: data.bio,
          website: data.website,
          image_url: data.image_url,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          spotify_data: data.spotify_data as any,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast.success(tToast('artists.autoSaved'));
      queryClient.invalidateQueries({ queryKey: ['artist', id] });
    } catch (error) {
      await handleError(error, {
        title: tToast('artists.autoSaveFailed'),
        description: tToast('artists.autoSaveFailedDescription'),
        endpoint: 'ArtistManagement',
        method: 'UPDATE',
      });
    }
  };

  const { triggerSave: triggerArtistSave, flushSave: flushArtistSave } =
    useDebouncedSave({
      saveFn: saveArtistData,
      delay: 2000,
    });

  // Helper to trigger auto-save
  const triggerAutoSave = () => {
    if (name.trim()) {
      triggerArtistSave({
        name,
        bio,
        website,
        image_url: imageUrl,
        spotify_data: buildMetadata(),
      });
    }
  };

  const { data: artist, isLoading } = useQuery({
    queryKey: ['artist', id],
    queryFn: async () => {
      if (!id) throw new Error('No artist ID provided');

      const { data, error } = await supabase
        .from('artists')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Populate form state from artist data
  useEffect(() => {
    if (artist) {
      setName(artist.name || '');
      setBio(artist.bio || '');
      setWebsite(artist.website || '');
      setImageUrl(artist.image_url || '');

      // Parse metadata from spotify_data field (social links only)
      const metadata = artist.spotify_data as ArtistMetadata | null;
      if (metadata) {
        setInstagram(metadata.socialLinks?.instagram || '');
        setTwitter(metadata.socialLinks?.twitter || '');
        setFacebook(metadata.socialLinks?.facebook || '');
        setTiktok(metadata.socialLinks?.tiktok || '');
        setYoutube(metadata.socialLinks?.youtube || '');
      }
    }
  }, [artist]);

  // Populate genres from artist_genres table
  useEffect(() => {
    if (artistGenres) {
      const genres: Genre[] = artistGenres.map(ag => ag.genre);
      setSelectedGenres(genres);
    }
  }, [artistGenres]);

  // Handle genre changes
  const handleGenreChange = (genres: Genre[]) => {
    setSelectedGenres(genres);
    // Save genres immediately (not debounced, uses separate table)
    if (id) {
      updateGenresMutation.mutate({
        artistId: id,
        genreSelections: genres.map((g, index) => ({
          genreId: g.id,
          isPrimary: index === 0, // First genre is primary
        })),
      });
    }
  };

  // Recording handlers (using database)
  const handleAddRecording = (data: CreateRecordingData) => {
    if (!id) return;
    createRecordingMutation.mutate(data, {
      onSuccess: () => {
        toast.success(tToast('artists.recordingAdded', { trackName: data.name }));
        setIsAddRecordingModalOpen(false);
      },
      onError: (error) => {
        handleError(error, { title: tToast('artists.recordingAddFailed') });
      },
    });
  };

  const handleEditRecording = (recording: ArtistRecording) => {
    setEditingRecording(recording);
  };

  const handleUpdateRecording = (recordingId: string, data: Partial<CreateRecordingData>) => {
    if (!id) return;
    updateRecordingMutation.mutate(
      { recordingId, artistId: id, data },
      {
        onSuccess: () => {
          toast.success(tToast('artists.recordingUpdated'));
          setEditingRecording(null);
        },
        onError: (error) => {
          handleError(error, { title: tToast('artists.recordingUpdateFailed') });
        },
      }
    );
  };

  const handleDeleteRecording = (recording: ArtistRecording) => {
    setRecordingToDelete(recording);
  };

  const confirmDeleteRecording = () => {
    if (!id || !recordingToDelete) return;
    deleteRecordingMutation.mutate(
      { recordingId: recordingToDelete.id, artistId: id },
      {
        onSuccess: () => {
          toast.success(tToast('artists.recordingDeleted'));
          setRecordingToDelete(null);
        },
        onError: (error) => {
          handleError(error, { title: tToast('artists.recordingDeleteFailed') });
        },
      }
    );
  };

  const handleSetPrimaryRecording = (recording: ArtistRecording) => {
    if (!id) return;
    setPrimaryMutation.mutate(
      { recordingId: recording.id, artistId: id },
      {
        onSuccess: () => {
          toast.success(tToast('artists.recordingSetAsPrimary'));
        },
        onError: (error) => {
          handleError(error, { title: tToast('artists.recordingSetPrimaryFailed') });
        },
      }
    );
  };

  const handleRefetchRecording = async (recording: ArtistRecording) => {
    // Refetch metadata from the platform (Spotify/SoundCloud)
    try {
      const url = recording.url;
      const platform = recording.platform;

      let metadata: { name: string; cover_art?: string } | null = null;

      if (platform === 'spotify') {
        const oEmbedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
        const response = await fetch(oEmbedUrl);
        if (response.ok) {
          const data = await response.json();
          const [name] = data.title?.split(' - ') || [data.title];
          metadata = { name: name || recording.name, cover_art: data.thumbnail_url };
        }
      } else if (platform === 'soundcloud') {
        const oEmbedUrl = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`;
        const response = await fetch(oEmbedUrl);
        if (response.ok) {
          const data = await response.json();
          let name = data.title || recording.name;
          if (name.includes(' by ')) {
            name = name.split(' by ')[0];
          }
          metadata = { name, cover_art: data.thumbnail_url };
        }
      }

      if (metadata && id) {
        updateRecordingMutation.mutate(
          {
            recordingId: recording.id,
            artistId: id,
            data: { name: metadata.name, cover_art: metadata.cover_art },
          },
          {
            onSuccess: () => {
              toast.success(tToast('artists.recordingRefetched'));
            },
            onError: (error) => {
              handleError(error, { title: tToast('artists.recordingRefetchFailed') });
            },
          }
        );
      } else {
        toast.error(tToast('artists.recordingRefetchFailed'));
      }
    } catch (error) {
      logger.error('Error refetching recording metadata', {
        error: error instanceof Error ? error.message : 'Unknown',
        source: 'ArtistManagement',
        recordingId: recording.id,
      });
      toast.error(tToast('artists.recordingRefetchFailed'));
    }
  };

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

  const handleSave = async () => {
    if (!id) return;

    setIsSaving(true);
    try {
      // Flush any pending debounced save first
      await flushArtistSave();

      const { error } = await supabase
        .from('artists')
        .update({
          name,
          bio,
          website,
          image_url: imageUrl,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          spotify_data: buildMetadata() as any,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      toast.success(tToast('artists.updated'));
      queryClient.invalidateQueries({ queryKey: ['artist', id] });
    } catch (error) {
      handleError(error, { title: tToast('artists.updateFailed') });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!id) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase.from('artists').delete().eq('id', id);

      if (error) throw error;

      toast.success(tToast('artists.deleted'));
      setShowDeleteConfirm(false);
      navigate('/developer/database?table=artists');
    } catch (error) {
      handleError(error, { title: tToast('artists.deleteFailed') });
    } finally {
      setIsDeleting(false);
    }
  };

  const renderOverviewTab = () => (
    <div className='space-y-6'>
      <FmCommonCard size='lg' hoverable={false}>
        <FmI18nCommon i18nKey='sections.basicInformation' as='h2' className='text-xl font-semibold mb-6' />

        <div className='space-y-4'>
          <FmCommonTextField
            label={t('labels.artistName')}
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              triggerAutoSave();
            }}
            placeholder={t('forms.artists.namePlaceholder')}
          />

          <div className='space-y-1'>
            <span className='text-xs text-muted-foreground'>{t('labels.artistImage')}</span>
            <FmImageUpload
              currentImageUrl={imageUrl}
              onUploadComplete={(url) => {
                setImageUrl(url);
                triggerAutoSave();
              }}
            />
          </div>

          <div>
            <FmGenreMultiSelect
              selectedGenres={selectedGenres}
              onChange={handleGenreChange}
              maxGenres={5}
              label={t('labels.genres')}
            />
          </div>

          <FmCommonTextField
            label={t('labels.bio')}
            multiline
            rows={5}
            value={bio}
            onChange={(e) => {
              setBio(e.target.value);
              triggerAutoSave();
            }}
            placeholder={t('forms.artists.bioPlaceholder')}
          />

          <FmCommonTextField
            label={t('labels.website')}
            value={website}
            onChange={(e) => {
              setWebsite(e.target.value);
              triggerAutoSave();
            }}
            placeholder={t('forms.artists.websitePlaceholder')}
          />
        </div>
      </FmCommonCard>

      <div className='flex justify-between'>
        <FmCommonButton
          variant='destructive'
          icon={Trash2}
          onClick={handleDeleteClick}
          disabled={isDeleting}
        >
          {isDeleting ? t('buttons.deleting') : t('buttons.deleteArtist')}
        </FmCommonButton>

        <FmCommonButton
          icon={Save}
          onClick={handleSave}
          disabled={isSaving || !name}
        >
          {isSaving ? t('buttons.saving') : t('buttons.saveChanges')}
        </FmCommonButton>
      </div>
    </div>
  );

  const renderMusicTab = () => (
    <div className='space-y-6'>
      <FmCommonCard size='lg' hoverable={false}>
        <div className='mb-6'>
          <FmI18nCommon i18nKey='sections.recordings' as='h2' className='text-xl font-semibold' />
          <FmI18nCommon i18nKey='sections.recordingsDescription' as='p' className='text-muted-foreground text-sm mt-1' />
        </div>

        {/* Recordings Grid */}
        <FmRecordingsGrid
          recordings={recordings}
          editable
          hideHeader
          columns={3}
          onEdit={handleEditRecording}
          onDelete={handleDeleteRecording}
          onRefetch={handleRefetchRecording}
          onSetPrimary={handleSetPrimaryRecording}
          onAdd={() => setIsAddRecordingModalOpen(true)}
          isLoading={isRecordingsLoading}
          className='mt-0'
        />

        {/* Add Recording Modal */}
        {id && (
          <AddRecordingModal
            open={isAddRecordingModalOpen}
            onOpenChange={setIsAddRecordingModalOpen}
            artistId={id}
            onAddRecording={handleAddRecording}
          />
        )}

        {/* Edit Recording Modal */}
        {id && (
          <EditRecordingModal
            recording={editingRecording}
            onClose={() => setEditingRecording(null)}
            onSave={(data) => {
              if (editingRecording) {
                handleUpdateRecording(editingRecording.id, data);
              }
            }}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <FmCommonConfirmDialog
          open={!!recordingToDelete}
          onOpenChange={(open) => !open && setRecordingToDelete(null)}
          title={t('dialogs.deleteRecording')}
          description={t('dialogs.deleteRecordingConfirm', { name: recordingToDelete?.name })}
          confirmText={t('buttons.delete')}
          onConfirm={confirmDeleteRecording}
          variant='destructive'
          isLoading={deleteRecordingMutation.isPending}
        />
      </FmCommonCard>
    </div>
  );

  // Social media URL builders
  const socialUrlBuilders = {
    instagram: (username: string) => `https://instagram.com/${username}`,
    twitter: (username: string) => `https://x.com/${username}`,
    facebook: (username: string) => `https://facebook.com/${username}`,
    tiktok: (username: string) => `https://tiktok.com/@${username}`,
    youtube: (username: string) => `https://youtube.com/@${username}`,
  };

  // Social media input with icon - username only, shows constructed URL
  const SocialInput = ({
    icon: Icon,
    label,
    value,
    onChange,
    placeholder,
    iconColor,
    urlBuilder,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    iconColor: string;
    urlBuilder: (username: string) => string;
  }) => (
    <div className='space-y-1'>
      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
        <Icon className={cn('h-4 w-4', iconColor)} />
        <span>{label}</span>
      </div>
      <FmCommonTextField
        value={value}
        onChange={(e) => {
          // Strip @ prefix if user includes it
          const cleaned = e.target.value.replace(/^@/, '');
          onChange(cleaned);
          triggerAutoSave();
        }}
        placeholder={placeholder}
        prepend='@'
      />
      {value && (
        <a
          href={urlBuilder(value)}
          target='_blank'
          rel='noopener noreferrer'
          className='text-xs text-muted-foreground hover:text-fm-gold transition-colors truncate block'
        >
          {urlBuilder(value)}
        </a>
      )}
    </div>
  );

  const renderSocialTab = () => (
    <div className='space-y-6'>
      <FmCommonCard size='lg' hoverable={false}>
        <FmI18nCommon i18nKey='sections.socialMedia' as='h2' className='text-xl font-semibold mb-6' />
        <FmI18nCommon i18nKey='sections.socialMediaDescription' as='p' className='text-muted-foreground mb-6' />

        <div className='space-y-4'>
          <SocialInput
            icon={FaInstagram}
            label={t('labels.instagram')}
            value={instagram}
            onChange={setInstagram}
            placeholder={t('placeholders.username')}
            iconColor='text-[#E4405F]'
            urlBuilder={socialUrlBuilders.instagram}
          />

          <SocialInput
            icon={FaXTwitter}
            label={t('labels.twitterX')}
            value={twitter}
            onChange={setTwitter}
            placeholder={t('placeholders.username')}
            iconColor='text-white'
            urlBuilder={socialUrlBuilders.twitter}
          />

          <SocialInput
            icon={FaFacebook}
            label={t('labels.facebook')}
            value={facebook}
            onChange={setFacebook}
            placeholder={t('placeholders.usernameOrPage')}
            iconColor='text-[#1877F2]'
            urlBuilder={socialUrlBuilders.facebook}
          />

          <SocialInput
            icon={FaTiktok}
            label={t('labels.tiktok')}
            value={tiktok}
            onChange={setTiktok}
            placeholder={t('placeholders.username')}
            iconColor='text-white'
            urlBuilder={socialUrlBuilders.tiktok}
          />

          <SocialInput
            icon={FaYoutube}
            label={t('labels.youtube')}
            value={youtube}
            onChange={setYoutube}
            placeholder={t('placeholders.channelHandle')}
            iconColor='text-[#FF0000]'
            urlBuilder={socialUrlBuilders.youtube}
          />
        </div>
      </FmCommonCard>
    </div>
  );

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background'>
        <FmCommonLoadingSpinner size='lg' />
      </div>
    );
  }

  return (
    <SideNavbarLayout
      navigationGroups={navigationGroups}
      activeItem={activeTab}
      onItemChange={(tabId: ArtistTab) => {
        if (tabId === 'view') {
          navigate(`/artists/${artist?.id}`);
        } else {
          setActiveTab(tabId);
        }
      }}
    >
      {activeTab === 'overview' && renderOverviewTab()}
      {activeTab === 'music' && renderMusicTab()}
      {activeTab === 'social' && renderSocialTab()}
      {activeTab === 'gallery' && id && (
        <ArtistManageGalleryTab
          artistId={id}
          artistName={name}
          galleryId={artist?.gallery_id || null}
        />
      )}

      <FmCommonConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t('buttons.deleteArtist')}
        description={t('dialogs.deleteArtistConfirm')}
        confirmText={t('buttons.delete')}
        onConfirm={handleDelete}
        variant="destructive"
        isLoading={isDeleting}
      />
    </SideNavbarLayout>
  );
}

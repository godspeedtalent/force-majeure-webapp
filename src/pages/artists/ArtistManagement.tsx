import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Music,
  Save,
  Trash2,
  Eye,
  Share2,
  Headphones,
  Plus,
  ExternalLink,
  Calendar,
  Disc,
  Radio,
  Pencil,
} from 'lucide-react';
import {
  FaInstagram,
  FaXTwitter,
  FaFacebook,
  FaTiktok,
  FaYoutube,
} from 'react-icons/fa6';
import { supabase } from '@/shared';
import { SideNavbarLayout } from '@/components/layout/SideNavbarLayout';
import { FmCommonSideNavGroup } from '@/components/common/navigation/FmCommonSideNav';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmImageUpload } from '@/components/common/forms/FmImageUpload';
import { FmCommonConfirmDialog } from '@/components/common/modals/FmCommonConfirmDialog';
import { FmI18nCommon } from '@/components/common/i18n';
import { toast } from 'sonner';
import { handleError } from '@/shared/services/errorHandler';
import { useDebouncedSave } from '@/shared/hooks/useDebouncedSave';
import { FmGenreMultiSelect } from '@/features/artists/components/FmGenreMultiSelect';
import { AddTrackModal } from '@/features/artists/components/AddTrackModal';
import { EditTrackModal } from '@/features/artists/components/EditTrackModal';
import { useArtistGenres, useUpdateArtistGenres } from '@/features/artists/hooks/useArtistGenres';
import type { Genre } from '@/features/artists/types';
import { cn } from '@/shared';

type ArtistTab = 'overview' | 'music' | 'social' | 'view';

// Types for social and music links (stored in spotify_data JSON field)
interface SocialLinks {
  instagram?: string;
  twitter?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
}

// Track type for music recordings
export type RecordingType = 'track' | 'dj_set';

export interface ArtistTrack {
  id: string;
  name: string;
  url: string;
  coverArt?: string;
  platform: 'spotify' | 'soundcloud';
  recordingType: RecordingType;
  addedAt?: string; // ISO date string of when the track was added
  clickCount?: number; // Number of times the link was clicked
}

interface ArtistMetadata {
  socialLinks?: SocialLinks;
  tracks?: ArtistTrack[];
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

  // Form state - Music Tracks
  const [tracks, setTracks] = useState<ArtistTrack[]>([]);
  const [isAddTrackModalOpen, setIsAddTrackModalOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<ArtistTrack | null>(null);

  // Hooks for genre management
  const { data: artistGenres } = useArtistGenres(id);
  const updateGenresMutation = useUpdateArtistGenres();

  // Build metadata object for saving
  const buildMetadata = (): ArtistMetadata => ({
    socialLinks: {
      instagram: instagram || undefined,
      twitter: twitter || undefined,
      facebook: facebook || undefined,
      tiktok: tiktok || undefined,
      youtube: youtube || undefined,
    },
    tracks: tracks.length > 0 ? tracks : undefined,
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

      // Parse metadata from spotify_data field
      const metadata = artist.spotify_data as ArtistMetadata | null;
      if (metadata) {
        // Social links
        setInstagram(metadata.socialLinks?.instagram || '');
        setTwitter(metadata.socialLinks?.twitter || '');
        setFacebook(metadata.socialLinks?.facebook || '');
        setTiktok(metadata.socialLinks?.tiktok || '');
        setYoutube(metadata.socialLinks?.youtube || '');

        // Tracks
        setTracks(metadata.tracks || []);
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

  // Handle track deletion
  const handleDeleteTrack = (trackId: string) => {
    const updatedTracks = tracks.filter(t => t.id !== trackId);
    setTracks(updatedTracks);
    // Trigger save with updated tracks
    if (name.trim()) {
      triggerArtistSave({
        name,
        bio,
        website,
        image_url: imageUrl,
        spotify_data: {
          socialLinks: {
            instagram: instagram || undefined,
            twitter: twitter || undefined,
            facebook: facebook || undefined,
            tiktok: tiktok || undefined,
            youtube: youtube || undefined,
          },
          tracks: updatedTracks.length > 0 ? updatedTracks : undefined,
        },
      });
    }
  };

  // Handle adding a new track
  const handleAddTrack = (newTrack: ArtistTrack) => {
    const updatedTracks = [...tracks, newTrack];
    setTracks(updatedTracks);
    // Trigger save with updated tracks
    if (name.trim()) {
      triggerArtistSave({
        name,
        bio,
        website,
        image_url: imageUrl,
        spotify_data: {
          socialLinks: {
            instagram: instagram || undefined,
            twitter: twitter || undefined,
            facebook: facebook || undefined,
            tiktok: tiktok || undefined,
            youtube: youtube || undefined,
          },
          tracks: updatedTracks,
        },
      });
    }
    toast.success(tToast('artists.recordingAdded', { trackName: newTrack.name }));
  };

  // Handle updating a track
  const handleUpdateTrack = (updatedTrack: ArtistTrack) => {
    const updatedTracks = tracks.map(t =>
      t.id === updatedTrack.id ? updatedTrack : t
    );
    setTracks(updatedTracks);
    setEditingTrack(null);
    // Trigger save with updated tracks
    if (name.trim()) {
      triggerArtistSave({
        name,
        bio,
        website,
        image_url: imageUrl,
        spotify_data: {
          socialLinks: {
            instagram: instagram || undefined,
            twitter: twitter || undefined,
            facebook: facebook || undefined,
            tiktok: tiktok || undefined,
            youtube: youtube || undefined,
          },
          tracks: updatedTracks,
        },
      });
    }
    toast.success(tToast('artists.recordingUpdated'));
  };

  // Handle click tracking for recordings
  const handleTrackLinkClick = (trackId: string) => {
    const updatedTracks = tracks.map(t =>
      t.id === trackId
        ? { ...t, clickCount: (t.clickCount || 0) + 1 }
        : t
    );
    setTracks(updatedTracks);
    // Save in background (don't show toast for click tracking)
    if (name.trim()) {
      triggerArtistSave({
        name,
        bio,
        website,
        image_url: imageUrl,
        spotify_data: {
          socialLinks: {
            instagram: instagram || undefined,
            twitter: twitter || undefined,
            facebook: facebook || undefined,
            tiktok: tiktok || undefined,
            youtube: youtube || undefined,
          },
          tracks: updatedTracks,
        },
      });
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
        <div className='flex items-center justify-between mb-6'>
          <div>
            <FmI18nCommon i18nKey='sections.recordings' as='h2' className='text-xl font-semibold' />
            <FmI18nCommon i18nKey='sections.recordingsDescription' as='p' className='text-muted-foreground text-sm mt-1' />
          </div>
        </div>

        {/* Track Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {tracks.map((track) => (
            <FmCommonCard
              key={track.id}
              size='sm'
              variant='outline'
              className='group relative overflow-hidden p-0'
            >
              {/* Cover Art */}
              <div className='aspect-square relative overflow-hidden'>
                {track.coverArt ? (
                  <img
                    src={track.coverArt}
                    alt={track.name}
                    className='w-full h-full object-cover'
                  />
                ) : (
                  <div className='w-full h-full bg-gradient-to-br from-fm-gold/20 to-fm-gold/5 flex items-center justify-center'>
                    <Music className='h-12 w-12 text-fm-gold/50' />
                  </div>
                )}
                {/* Platform badge */}
                <div className='absolute top-2 right-2'>
                  <span
                    className={cn(
                      'px-2 py-1 text-xs font-medium uppercase tracking-wider',
                      track.platform === 'spotify'
                        ? 'bg-[#1DB954]/90 text-white'
                        : 'bg-[#FF5500]/90 text-white'
                    )}
                  >
                    {track.platform}
                  </span>
                </div>
                {/* Recording type badge */}
                <div className='absolute bottom-2 left-2'>
                  <span className='flex items-center gap-1 px-2 py-1 text-xs font-medium bg-black/70 text-white'>
                    {track.recordingType === 'dj_set' ? (
                      <>
                        <Radio className='h-3 w-3' />
                        {t('labels.djSet')}
                      </>
                    ) : (
                      <>
                        <Disc className='h-3 w-3' />
                        {t('labels.track')}
                      </>
                    )}
                  </span>
                </div>
                {/* Action buttons - shows on hover */}
                <div className='absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200'>
                  <button
                    onClick={() => setEditingTrack(track)}
                    className='p-1.5 bg-black/60 hover:bg-fm-gold text-white transition-colors'
                  >
                    <Pencil className='h-4 w-4' />
                  </button>
                  <button
                    onClick={() => handleDeleteTrack(track.id)}
                    className='p-1.5 bg-black/60 hover:bg-red-600 text-white transition-colors'
                  >
                    <Trash2 className='h-4 w-4' />
                  </button>
                </div>
              </div>

              {/* Track Info */}
              <div className='p-4'>
                <h3 className='font-semibold text-sm line-clamp-1 mb-2'>
                  {track.name}
                </h3>
                <div className='flex items-center justify-between text-muted-foreground text-xs'>
                  <div className='flex items-center gap-3'>
                    {track.addedAt && (
                      <span className='flex items-center gap-1'>
                        <Calendar className='h-3 w-3' />
                        {new Date(track.addedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    )}
                    {track.clickCount !== undefined && track.clickCount > 0 && (
                      <span className='text-fm-gold'>
                        {t('labels.clicks', { count: track.clickCount })}
                      </span>
                    )}
                  </div>
                  <a
                    href={track.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    onClick={() => handleTrackLinkClick(track.id)}
                    className='flex items-center gap-1 hover:text-fm-gold transition-colors'
                  >
                    <ExternalLink className='h-3 w-3' />
                    <span>{t('labels.listen')}</span>
                  </a>
                </div>
              </div>
            </FmCommonCard>
          ))}

          {/* Add Track Button */}
          <button
            onClick={() => setIsAddTrackModalOpen(true)}
            className='aspect-square border-2 border-dashed border-white/20 hover:border-fm-gold/50 bg-black/20 hover:bg-fm-gold/5 flex flex-col items-center justify-center gap-3 transition-all duration-200 group'
          >
            <div className='p-3 rounded-full bg-white/5 group-hover:bg-fm-gold/20 transition-colors'>
              <Plus className='h-6 w-6 text-muted-foreground group-hover:text-fm-gold' />
            </div>
            <span className='text-sm text-muted-foreground group-hover:text-fm-gold font-medium'>
              {t('labels.addRecording')}
            </span>
          </button>
        </div>

        {/* Add Track Modal */}
        <AddTrackModal
          open={isAddTrackModalOpen}
          onOpenChange={setIsAddTrackModalOpen}
          onAddTrack={handleAddTrack}
        />

        {/* Edit Track Modal */}
        <EditTrackModal
          track={editingTrack}
          onClose={() => setEditingTrack(null)}
          onSave={handleUpdateTrack}
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

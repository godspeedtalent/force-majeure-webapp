import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '@/shared';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { DataGridAction, FmConfigurableDataGrid } from '@/features/data-grid';
import { SideNavbarLayout } from '@/components/layout/SideNavbarLayout';
import { FmCommonSideNavGroup } from '@/components/common/navigation/FmCommonSideNav';
import { MobileHorizontalTabs, MobileHorizontalTab } from '@/components/mobile';
import {
  MapPin,
  Database,
  Calendar,
  Trash2,
  Mic2,
  Building2,
  Users,
  RefreshCw,
  Disc3,
  HardDrive,
  Images,
  UserPlus,
  MessageSquare,
  Eye,
  FileQuestion,
  ExternalLink,
} from 'lucide-react';
import { supabase } from '@/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { EventsManagement } from '../admin/EventsManagement';
import { OrganizationsManagement } from '../admin/OrganizationsManagement';
import { UserManagement } from '../admin/UserManagement';
import { DatabaseNavigatorSearch } from '@/components/admin/DatabaseNavigatorSearch';
import { toast } from 'sonner';
import { artistColumns, venueColumns, recordingColumns } from '../admin/config/adminGridColumns';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { ROLES } from '@/shared';
import { AdminLockIndicator } from '@/components/common/indicators';
import { refreshAllTableSchemas } from '@/features/data-grid/services/schemaRefresh';
import { FmCommonButton } from '@/components/common/buttons';
import { FmCommonConfirmDialog } from '@/components/common/modals/FmCommonConfirmDialog';
import { GalleryManagementSection } from '@/components/DevTools/GalleryManagementSection';
import { ArtistRegistrationsManagement } from '../admin/ArtistRegistrationsManagement';
import { UserRequestsAdmin } from '@/components/admin/UserRequestsAdmin';
import { extractSpotifyTrackId, getSpotifyTrack } from '@/services/spotify/spotifyApiService';
import { getSoundCloudTrackFromUrl } from '@/services/soundcloud/soundcloudApiService';

type DatabaseTab =
  | 'overview'
  | 'artists'
  | 'events'
  | 'galleries'
  | 'organizations'
  | 'recordings'
  | 'registrations'
  | 'user_requests'
  | 'users'
  | 'venues';

export default function DeveloperDatabase() {
  const { t } = useTranslation('common');
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { hasRole } = useUserPermissions();
  const isAdmin = hasRole(ROLES.ADMIN);
  const [isRefreshingSchema, setIsRefreshingSchema] = useState(false);

  // Delete confirmation state
  const [artistToDelete, setArtistToDelete] = useState<any>(null);
  const [showDeleteArtistConfirm, setShowDeleteArtistConfirm] = useState(false);
  const [venueToDelete, setVenueToDelete] = useState<any>(null);
  const [showDeleteVenueConfirm, setShowDeleteVenueConfirm] = useState(false);
  const [recordingToDelete, setRecordingToDelete] = useState<any>(null);
  const [showDeleteRecordingConfirm, setShowDeleteRecordingConfirm] = useState(false);

  // Get active tab from URL query string, fallback to 'overview'
  const tabFromUrl = searchParams.get('table') as DatabaseTab | null;
  const validTabs: DatabaseTab[] = ['overview', 'artists', 'events', 'galleries', 'organizations', 'recordings', 'registrations', 'user_requests', 'users', 'venues'];
  const activeTab: DatabaseTab = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : 'overview';

  // Fetch pending registrations count for badge (needs to be before navigationGroups useMemo)
  const { data: pendingRegistrationsCount = 0 } = useQuery({
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

  // Fetch total registrations count
  const { data: totalRegistrationsCount = 0 } = useQuery({
    queryKey: ['artist-registrations-total-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('artist_registrations')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count ?? 0;
    },
  });

  // Fetch pending user requests count for badge
  const { data: pendingUserRequestsCount = 0 } = useQuery({
    queryKey: ['user-requests-pending-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('user_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      if (error) throw error;
      return count ?? 0;
    },
  });

  // Fetch total user requests count
  const { data: totalUserRequestsCount = 0 } = useQuery({
    queryKey: ['user-requests-total-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('user_requests')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count ?? 0;
    },
  });

  // Fetch venues count
  const { data: venuesCount = 0 } = useQuery({
    queryKey: ['venues-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('venues')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count ?? 0;
    },
  });

  // Fetch organizations count
  const { data: organizationsCount = 0 } = useQuery({
    queryKey: ['organizations-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count ?? 0;
    },
  });

  // Fetch users count
  const { data: usersCount = 0 } = useQuery({
    queryKey: ['users-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count ?? 0;
    },
  });

  // Fetch artists count
  const { data: artistsCount = 0 } = useQuery({
    queryKey: ['artists-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('artists')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count ?? 0;
    },
  });

  // Fetch events count for dashboard (moved up for useMemo dependency)
  const { data: eventsCount = 0 } = useQuery({
    queryKey: ['events-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count ?? 0;
    },
  });

  // Fetch recordings count for dashboard (moved up for useMemo dependency)
  const { data: recordingsCount = 0 } = useQuery({
    queryKey: ['recordings-count'],
    queryFn: async () => {
      const { count, error } = await (supabase as any)
        .from('artist_recordings')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      return count ?? 0;
    },
  });

  // Navigation groups configuration - conditionally include admin-only tabs
  const navigationGroups: FmCommonSideNavGroup<DatabaseTab>[] = useMemo(() => {
    const tables: Array<{
      id: DatabaseTab;
      label: string;
      icon: any;
      description: string;
      badge?: React.ReactNode;
    }> = [
      {
        id: 'artists',
        label: 'Artists',
        icon: Mic2,
        description: 'Artist Management',
        badge: <span className="text-[10px] text-muted-foreground">{artistsCount}</span>,
      },
      {
        id: 'events',
        label: 'Events',
        icon: Calendar,
        description: 'Event Management',
        badge: <span className="text-[10px] text-muted-foreground">{eventsCount}</span>,
      },
      {
        id: 'recordings',
        label: 'Recordings',
        icon: Disc3,
        description: 'Music Recordings',
        badge: <span className="text-[10px] text-muted-foreground">{recordingsCount}</span>,
      },
      {
        id: 'venues',
        label: 'Venues',
        icon: MapPin,
        description: 'Venue Management',
        badge: <span className="text-[10px] text-muted-foreground">{venuesCount}</span>,
      },
    ];

    // Add admin-only tabs to tables (alphabetically)
    if (isAdmin) {
      tables.push(
        {
          id: 'organizations',
          label: 'Organizations',
          icon: Building2,
          description: 'Organization Management',
          badge: (
            <span className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground">{organizationsCount}</span>
              <AdminLockIndicator position="inline" size="xs" tooltipText="Admin only" />
            </span>
          ),
        },
        {
          id: 'users',
          label: 'Users',
          icon: Users,
          description: 'User Management',
          badge: (
            <span className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground">{usersCount}</span>
              <AdminLockIndicator position="inline" size="xs" tooltipText="Admin only" />
            </span>
          ),
        }
      );
    }

    // Sort all tables alphabetically by label
    tables.sort((a, b) => a.label.localeCompare(b.label));

    // Messages group items (admin only)
    const messagesItems: Array<{
      id: DatabaseTab;
      label: string;
      icon: any;
      description: string;
      badge?: React.ReactNode;
    }> = [];

    if (isAdmin) {
      messagesItems.push(
        {
          id: 'registrations',
          label: t('artistRegistrations.navLabel'),
          icon: UserPlus,
          description: t('artistRegistrations.navDescription'),
          badge: pendingRegistrationsCount > 0 ? (
            <span className="px-1.5 py-0.5 text-[10px] bg-fm-gold text-black font-bold">
              {pendingRegistrationsCount}
            </span>
          ) : undefined,
        },
        {
          id: 'user_requests',
          label: 'User Requests',
          icon: FileQuestion,
          description: 'Manage user requests',
          badge: pendingUserRequestsCount > 0 ? (
            <span className="px-1.5 py-0.5 text-[10px] bg-fm-gold text-black font-bold">
              {pendingUserRequestsCount}
            </span>
          ) : undefined,
        }
      );
    }

    const groups: FmCommonSideNavGroup<DatabaseTab>[] = [
      {
        label: 'Overview',
        icon: Database,
        items: [
          {
            id: 'overview' as const,
            label: 'Dashboard',
            icon: Database,
            description: 'Database overview and search',
          },
        ],
      },
      {
        label: 'Tables',
        icon: Database,
        items: tables,
      },
      {
        label: 'Storage',
        icon: HardDrive,
        items: [
          {
            id: 'galleries' as const,
            label: 'Galleries',
            icon: Images,
            description: 'Media gallery management',
          },
        ],
      },
    ];

    // Add Messages group only if there are items (admin only)
    if (messagesItems.length > 0) {
      groups.push({
        label: 'Messages',
        icon: MessageSquare,
        items: messagesItems,
      });
    }

    return groups;
  }, [isAdmin, t, pendingRegistrationsCount, pendingUserRequestsCount, totalRegistrationsCount, totalUserRequestsCount, artistsCount, eventsCount, recordingsCount, venuesCount, organizationsCount, usersCount]);

  // Mobile horizontal tabs configuration
  const mobileTabs: MobileHorizontalTab[] = useMemo(() => {
    const baseTabs = [
      { id: 'artists', label: 'Artists', icon: Mic2 },
      { id: 'events', label: 'Events', icon: Calendar },
      { id: 'recordings', label: 'Tracks', icon: Disc3 },
      { id: 'venues', label: 'Venues', icon: MapPin },
    ];
    if (isAdmin) {
      baseTabs.push(
        { id: 'organizations', label: 'Orgs', icon: Building2 },
        { id: 'registrations', label: 'Regs', icon: UserPlus },
        { id: 'users', label: 'Users', icon: Users }
      );
    }
    return baseTabs;
  }, [isAdmin]);

  // Update URL when tab changes via location state
  useEffect(() => {
    const state = location.state as {
      editEventId?: string;
      editArtistId?: string;
      openTab?: string;
    } | null;

    if (state?.editArtistId) {
      navigate(`?table=artists`, { replace: true });
    } else if (
      state?.openTab &&
      validTabs.includes(state.openTab as DatabaseTab)
    ) {
      navigate(`?table=${state.openTab}`, { replace: true });
    }
  }, [location.state, navigate]);

  // Handler to change tabs and update URL
  const handleTabChange = (tab: DatabaseTab) => {
    navigate(`?table=${tab}`);
  };

  // Fetch artists data
  // Fetch all genres first for the map
  const { data: allGenres = [] } = useQuery({
    queryKey: ['all-genres'],
    queryFn: async () => {
      const { data, error } = await supabase.from('genres').select('id, name');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: artists = [], isLoading: artistsLoading } = useQuery({
    queryKey: ['admin-artists', allGenres],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('artists')
        .select(`
          id, name, genre, image_url, bio, created_at, updated_at,
          artist_genres(genre_id, is_primary)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform to include genre_names array for column display
      return (data ?? []).map(artist => ({
        ...artist,
        genre_names: artist.artist_genres?.map((ag: any) => {
          const genreData = allGenres.find(g => g.id === ag.genre_id);
          return genreData?.name || ag.genre_id;
        }) || [],
      }));
    },
    enabled: allGenres.length > 0 || true, // Run even if no genres, but prefer after genres load
  });

  // Fetch venues data with city join
  const { data: venues = [], isLoading: venuesLoading } = useQuery({
    queryKey: ['admin-venues'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('venues')
        .select(
          `
          id, name, address_line_1, address_line_2, city, state, zip_code,
          capacity, image_url, website, created_at, updated_at,
          cities!city_id(name, state)
        `
        )
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Flatten the city data for easier access
      return data.map((venue: any) => ({
        ...venue,
        city: venue.cities
          ? `${venue.cities.name}, ${venue.cities.state}`
          : null,
      }));
    },
  });

  // Note: eventsCount and recordingsCount queries moved above navigationGroups useMemo

  // Fetch recordings data with artist join
  const { data: recordings = [], isLoading: recordingsLoading } = useQuery({
    queryKey: ['admin-recordings'],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('artist_recordings')
        .select(`
          id, artist_id, name, duration, url, cover_art, platform, created_at, updated_at,
          artists!artist_id(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Flatten artist name for easier access
      return (data ?? []).map((recording: any) => ({
        ...recording,
        artist_name: recording.artists?.name || null,
      }));
    },
  });

  const handleArtistUpdate = async (
    row: any,
    columnKey: string,
    newValue: any
  ) => {
    const normalizedValue =
      typeof newValue === 'string' ? newValue.trim() : newValue;
    const updateData: Record<string, any> = {
      [columnKey]: normalizedValue === '' ? null : normalizedValue,
    };

    try {
      const { error } = await supabase
        .from('artists')
        .update(updateData)
        .eq('id', row.id);

      if (error) throw error;

      queryClient.setQueryData(
        ['admin-artists'],
        (oldData: any[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map(artist =>
            artist.id === row.id
              ? {
                  ...artist,
                  ...updateData,
                  updated_at: new Date().toISOString(),
                }
              : artist
          );
        }
      );

      toast.success(t('devTools.database.artistUpdated'));
    } catch (error) {
      logger.error('Error updating artist:', { error: error instanceof Error ? error.message : 'Unknown error', source: 'DeveloperDatabase.tsx' });
      toast.error(t('devTools.database.artistUpdateFailed'));
      throw error;
    }
  };

  const handleArtistCreate = async (newRow: Partial<any>) => {
    const name = typeof newRow.name === 'string' ? newRow.name.trim() : '';
    if (!name) {
      throw new Error('Artist name is required');
    }

    const payload = {
      name,
      genre:
        typeof newRow.genre === 'string' && newRow.genre.trim() !== ''
          ? newRow.genre.trim()
          : null,
      image_url:
        typeof newRow.image_url === 'string' && newRow.image_url.trim() !== ''
          ? newRow.image_url.trim()
          : null,
      bio:
        typeof newRow.bio === 'string' && newRow.bio.trim() !== ''
          ? newRow.bio.trim()
          : null,
      city_id:
        typeof newRow.city_id === 'string' && newRow.city_id.trim() !== ''
          ? newRow.city_id.trim()
          : null,
      instagram_handle:
        typeof newRow.instagram_handle === 'string' && newRow.instagram_handle.trim() !== ''
          ? newRow.instagram_handle.trim()
          : null,
      tiktok_handle:
        typeof newRow.tiktok_handle === 'string' && newRow.tiktok_handle.trim() !== ''
          ? newRow.tiktok_handle.trim()
          : null,
      soundcloud_id:
        typeof newRow.soundcloud_id === 'string' && newRow.soundcloud_id.trim() !== ''
          ? newRow.soundcloud_id.trim()
          : null,
      spotify_id:
        typeof newRow.spotify_id === 'string' && newRow.spotify_id.trim() !== ''
          ? newRow.spotify_id.trim()
          : null,
    };

    try {
      const { error } = await supabase.from('artists').insert(payload);
      if (error) throw error;

      toast.success(t('devTools.database.artistCreated'));
      await queryClient.invalidateQueries({ queryKey: ['admin-artists'] });
    } catch (error) {
      logger.error('Error creating artist:', { error: error instanceof Error ? error.message : 'Unknown error', source: 'DeveloperDatabase.tsx' });
      toast.error(t('devTools.database.artistCreateFailed'));
      throw error;
    }
  };

  const handleDeleteArtistClick = (artist: any) => {
    setArtistToDelete(artist);
    setShowDeleteArtistConfirm(true);
  };

  const handleDeleteArtist = async () => {
    if (!artistToDelete) return;

    try {
      const artist = artistToDelete;
      const { error } = await supabase
        .from('artists')
        .delete()
        .eq('id', artist.id);

      if (error) throw error;

      toast.success(t('devTools.database.artistDeleted'));
      queryClient.invalidateQueries({ queryKey: ['admin-artists'] });
      setShowDeleteArtistConfirm(false);
      setArtistToDelete(null);
    } catch (error) {
      logger.error('Error deleting artist:', { error: error instanceof Error ? error.message : 'Unknown error', source: 'DeveloperDatabase.tsx' });
      toast.error(t('devTools.database.artistDeleteFailed'));
    }
  };

  const artistContextActions: DataGridAction[] = [
    {
      label: t('devTools.database.viewArtist'),
      icon: <Eye className='h-4 w-4' />,
      onClick: (artist: any) => navigate(`/artists/${artist.id}`),
    },
    {
      label: t('devTools.database.editArtist'),
      icon: <Mic2 className='h-4 w-4' />,
      onClick: (artist: any) => navigate(`/artists/${artist.id}/manage`),
    },
    {
      label: t('devTools.database.deleteArtist'),
      icon: <Trash2 className='h-4 w-4' />,
      onClick: handleDeleteArtistClick,
      variant: 'destructive',
    },
  ];

  // Handle venue updates
  const handleVenueUpdate = async (
    row: any,
    columnKey: string,
    newValue: any
  ) => {
    const updateData: any = {};

    // Convert capacity to integer if updating that field
    if (columnKey === 'capacity') {
      const numValue = parseInt(newValue, 10);
      if (isNaN(numValue)) {
        throw new Error('Capacity must be a valid number');
      }
      updateData[columnKey] = numValue;
    } else {
      updateData[columnKey] = newValue;
    }

    const { error } = await (supabase as any)
      .from('venues')
      .update(updateData)
      .eq('id', row.id);

    if (error) throw error;

    // Update local data instead of refetching to maintain sort order
    queryClient.setQueryData(['admin-venues'], (oldData: any[]) => {
      if (!oldData) return oldData;
      return oldData.map(venue =>
        venue.id === row.id
          ? { ...venue, ...updateData, updated_at: new Date().toISOString() }
          : venue
      );
    });
  };


  const handleDeleteVenueClick = (venue: any) => {
    setVenueToDelete(venue);
    setShowDeleteVenueConfirm(true);
  };

  const handleDeleteVenue = async () => {
    if (!venueToDelete) return;

    try {
      const { error } = await (supabase as any)
        .from('venues')
        .delete()
        .eq('id', venueToDelete.id);

      if (error) throw error;

      toast.success(t('devTools.database.venueDeleted'));
      queryClient.invalidateQueries({ queryKey: ['admin-venues'] });
      setShowDeleteVenueConfirm(false);
      setVenueToDelete(null);
    } catch (error) {
      logger.error('Error deleting venue:', { error: error instanceof Error ? error.message : 'Unknown error', source: 'DeveloperDatabase.tsx' });
      toast.error(t('devTools.database.venueDeleteFailed'));
    }
  };

  // Context menu actions for venues
  const venueContextActions: DataGridAction[] = [
    {
      label: t('devTools.database.editVenue'),
      icon: <MapPin className='h-4 w-4' />,
      onClick: (venue: any) => navigate(`/venues/${venue.id}/manage`),
    },
    {
      label: t('devTools.database.deleteVenue'),
      icon: <Trash2 className='h-4 w-4' />,
      onClick: handleDeleteVenueClick,
      variant: 'destructive',
    },
  ];

  // Handle recording updates
  const handleRecordingUpdate = async (
    row: any,
    columnKey: string,
    newValue: any
  ) => {
    const normalizedValue =
      typeof newValue === 'string' ? newValue.trim() : newValue;
    const updateData: Record<string, any> = {
      [columnKey]: normalizedValue === '' ? null : normalizedValue,
    };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('artist_recordings')
        .update(updateData)
        .eq('id', row.id);

      if (error) throw error;

      queryClient.setQueryData(
        ['admin-recordings'],
        (oldData: any[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map(recording =>
            recording.id === row.id
              ? {
                  ...recording,
                  ...updateData,
                  updated_at: new Date().toISOString(),
                }
              : recording
          );
        }
      );

      toast.success(t('devTools.database.recordingUpdated'));
    } catch (error) {
      logger.error('Error updating recording:', { error: error instanceof Error ? error.message : 'Unknown error', source: 'DeveloperDatabase.tsx' });
      toast.error(t('devTools.database.recordingUpdateFailed'));
      throw error;
    }
  };

  const handleDeleteRecordingClick = (recording: any) => {
    setRecordingToDelete(recording);
    setShowDeleteRecordingConfirm(true);
  };

  const handleDeleteRecording = async () => {
    if (!recordingToDelete) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('artist_recordings')
        .delete()
        .eq('id', recordingToDelete.id);

      if (error) throw error;

      toast.success(t('devTools.database.recordingDeleted'));
      queryClient.invalidateQueries({ queryKey: ['admin-recordings'] });
      setShowDeleteRecordingConfirm(false);
      setRecordingToDelete(null);
    } catch (error) {
      logger.error('Error deleting recording:', { error: error instanceof Error ? error.message : 'Unknown error', source: 'DeveloperDatabase.tsx' });
      toast.error(t('devTools.database.recordingDeleteFailed'));
    }
  };

  // Handle refreshing recording details from Spotify/SoundCloud
  const handleRefreshRecordingDetails = async (recording: any) => {
    const url = recording.url;
    if (!url) {
      toast.error('No URL found for this recording');
      return;
    }

    const loadingToast = toast.loading('Fetching recording details...');

    try {
      let updateData: Record<string, any> = {};

      if (url.includes('spotify.com')) {
        // Extract track ID from Spotify URL
        const trackId = extractSpotifyTrackId(url);
        if (!trackId) {
          toast.dismiss(loadingToast);
          toast.error('Could not extract Spotify track ID from URL');
          return;
        }

        const track = await getSpotifyTrack(trackId);
        updateData = {
          name: track.name,
          cover_art: track.album.images[0]?.url || null,
          platform: 'spotify',
        };
      } else if (url.includes('soundcloud.com')) {
        // Use SoundCloud oEmbed API
        const trackData = await getSoundCloudTrackFromUrl(url);
        if (!trackData) {
          toast.dismiss(loadingToast);
          toast.error('Could not fetch SoundCloud track details');
          return;
        }

        updateData = {
          name: trackData.name,
          cover_art: trackData.coverArt || null,
          platform: 'soundcloud',
        };
      } else {
        toast.dismiss(loadingToast);
        toast.error('Unknown platform. Only Spotify and SoundCloud URLs are supported.');
        return;
      }

      // Update the recording in the database
      const { error } = await (supabase as any)
        .from('artist_recordings')
        .update(updateData)
        .eq('id', recording.id);

      if (error) throw error;

      // Update local cache
      queryClient.setQueryData(['admin-recordings'], (oldData: any[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(rec =>
          rec.id === recording.id
            ? { ...rec, ...updateData, updated_at: new Date().toISOString() }
            : rec
        );
      });

      toast.dismiss(loadingToast);
      toast.success(`Updated "${updateData.name}" successfully`);
    } catch (error) {
      toast.dismiss(loadingToast);
      logger.error('Error refreshing recording details:', { error: error instanceof Error ? error.message : 'Unknown error', source: 'DeveloperDatabase.tsx' });
      toast.error('Failed to refresh recording details');
    }
  };

  const recordingContextActions: DataGridAction[] = [
    {
      label: 'View Recording Details',
      icon: <Eye className='h-4 w-4' />,
      onClick: (recording: any) => navigate(`/recordings/${recording.id}`),
    },
    {
      label: 'Go to Spotify',
      icon: <ExternalLink className='h-4 w-4' />,
      onClick: (recording: any) => {
        if (recording.url) {
          window.open(recording.url, '_blank', 'noopener,noreferrer');
        }
      },
      hidden: (recording: any) => recording.platform?.toLowerCase() !== 'spotify' || !recording.url,
    },
    {
      label: 'Go to SoundCloud',
      icon: <ExternalLink className='h-4 w-4' />,
      onClick: (recording: any) => {
        if (recording.url) {
          window.open(recording.url, '_blank', 'noopener,noreferrer');
        }
      },
      hidden: (recording: any) => recording.platform?.toLowerCase() !== 'soundcloud' || !recording.url,
    },
    {
      label: 'Refresh Details',
      icon: <RefreshCw className='h-4 w-4' />,
      onClick: handleRefreshRecordingDetails,
    },
    {
      label: 'Delete Recording',
      icon: <Trash2 className='h-4 w-4' />,
      onClick: handleDeleteRecordingClick,
      variant: 'destructive',
    },
  ];

  // Calculate statistics for current data
  const getCurrentData = () => {
    if (activeTab === 'artists') return artists;
    if (activeTab === 'venues') return venues;
    if (activeTab === 'recordings') return recordings;
    if (activeTab === 'events') return []; // Events data is managed in EventsManagement component
    if (activeTab === 'organizations') return [];
    return [];
  };

  const calculateCompleteness = (data: any[]) => {
    if (!data.length) return 0;

    let totalFields = 0;
    let filledFields = 0;

    data.forEach(record => {
      const fields = Object.entries(record);
      fields.forEach(([key, value]) => {
        // Skip internal fields
        if (['id', 'created_at', 'updated_at'].includes(key)) return;
        totalFields++;
        if (value !== null && value !== undefined && value !== '') {
          filledFields++;
        }
      });
    });

    return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;
  };

  const currentData = getCurrentData();
  const completeness = calculateCompleteness(currentData);

  // Schema refresh handler
  const handleSchemaRefresh = async () => {
    setIsRefreshingSchema(true);
    try {
      const result = await refreshAllTableSchemas();
      if (result.success) {
        toast.success(t('devTools.database.schemaRefreshSuccess', { count: result.tablesRefreshed }));
      } else {
        toast.error(result.error || t('devTools.database.schemaRefreshFailed'));
      }
    } catch (error) {
      logger.error('Error refreshing schema', {
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'DeveloperDatabase',
        details: {},
      });
      toast.error(t('devTools.database.schemaRefreshFailed'));
    } finally {
      setIsRefreshingSchema(false);
    }
  };

  return (
    <SideNavbarLayout
      navigationGroups={navigationGroups}
      activeItem={activeTab}
      onItemChange={handleTabChange}
    >
      {/* Mobile horizontal tabs */}
      <MobileHorizontalTabs
        tabs={mobileTabs}
        activeTab={activeTab}
        onTabChange={tab => handleTabChange(tab as DatabaseTab)}
      />

      <div className='max-w-full'>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className='flex flex-col items-center justify-center min-h-[60vh]'>
            {/* Schema Refresh Button */}
            <div className='w-full max-w-4xl mb-6 flex justify-end'>
              <FmCommonButton
                onClick={handleSchemaRefresh}
                disabled={isRefreshingSchema}
                variant="secondary"
                size="sm"
                icon={RefreshCw}
                className={isRefreshingSchema ? '[&_svg]:animate-spin' : ''}
              >
                {isRefreshingSchema ? 'Refreshing Schema...' : 'Refresh Schema'}
              </FmCommonButton>
            </div>

            {/* Stats Groups in Columns */}
            <div className='w-full max-w-5xl mb-12'>
              <div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
                <div className='bg-muted/30 border border-border rounded-none px-[20px] py-[15px] transition-all duration-300 hover:bg-white/5 hover:shadow-[0_0_0_2px_rgba(212,175,55,0.3)] hover:scale-[1.02]'>
                  <div className='text-xs text-muted-foreground mb-1'>
                    Artists
                  </div>
                  <div className='text-2xl font-bold text-foreground'>
                    {artists.length}
                  </div>
                </div>
                <div className='bg-muted/30 border border-border rounded-none px-[20px] py-[15px] transition-all duration-300 hover:bg-white/5 hover:shadow-[0_0_0_2px_rgba(212,175,55,0.3)] hover:scale-[1.02]'>
                  <div className='text-xs text-muted-foreground mb-1'>
                    Venues
                  </div>
                  <div className='text-2xl font-bold text-foreground'>
                    {venues.length}
                  </div>
                </div>
                <div className='bg-muted/30 border border-border rounded-none px-[20px] py-[15px] transition-all duration-300 hover:bg-white/5 hover:shadow-[0_0_0_2px_rgba(212,175,55,0.3)] hover:scale-[1.02]'>
                  <div className='text-xs text-muted-foreground mb-1'>
                    Events
                  </div>
                  <div className='text-2xl font-bold text-foreground'>
                    {eventsCount}
                  </div>
                </div>
                <div className='bg-muted/30 border border-border rounded-none px-[20px] py-[15px] transition-all duration-300 hover:bg-white/5 hover:shadow-[0_0_0_2px_rgba(212,175,55,0.3)] hover:scale-[1.02]'>
                  <div className='text-xs text-muted-foreground mb-1'>
                    Recordings
                  </div>
                  <div className='text-2xl font-bold text-foreground'>
                    {recordingsCount}
                  </div>
                </div>
                <div className='bg-muted/30 border border-border rounded-none px-[20px] py-[15px] transition-all duration-300 hover:bg-white/5 hover:shadow-[0_0_0_2px_rgba(212,175,55,0.3)] hover:scale-[1.02]'>
                  <div className='text-xs text-muted-foreground mb-1'>
                    Complete Data
                  </div>
                  <div className='text-2xl font-bold text-foreground'>
                    {completeness}%
                  </div>
                </div>
              </div>
            </div>

            {/* Centered Search */}
            <div className='w-full max-w-2xl'>
              <DatabaseNavigatorSearch />
            </div>
          </div>
        )}

        {activeTab === 'artists' && (
          <div className='space-y-6'>
            <div>
              <h1 className='text-3xl font-canela font-bold text-foreground mb-2'>
                Artists Management
              </h1>
              <p className='text-muted-foreground'>
                Manage artist profiles, genres, and metadata.
              </p>
            </div>

            <FmConfigurableDataGrid
              gridId='dev-artists'
              data={artists}
              columns={artistColumns}
              contextMenuActions={artistContextActions}
              loading={artistsLoading}
              pageSize={15}
              onUpdate={handleArtistUpdate}
              onCreate={handleArtistCreate}
              resourceName='Artist'
              createButtonLabel='Add Artist'
              onCreateButtonClick={() => navigate('/artists/create')}
            />
          </div>
        )}

        {activeTab === 'organizations' && <OrganizationsManagement />}

        {activeTab === 'users' && <UserManagement />}

        {activeTab === 'venues' && (
          <div className='space-y-6'>
            <div>
              <h1 className='text-3xl font-canela font-bold text-foreground mb-2'>
                Venues Management
              </h1>
              <p className='text-muted-foreground'>
                Manage venue locations, capacities, and details.
              </p>
            </div>

            <FmConfigurableDataGrid
              gridId='dev-venues'
              data={venues}
              columns={venueColumns}
              contextMenuActions={venueContextActions}
              loading={venuesLoading}
              pageSize={15}
              onUpdate={handleVenueUpdate}
              resourceName='Venue'
              createButtonLabel='Add Venue'
              onCreateButtonClick={() => navigate('/venues/create')}
            />
          </div>
        )}

        {activeTab === 'events' && (
          <EventsManagement />
        )}

        {activeTab === 'recordings' && (
          <div className='space-y-6'>
            <div>
              <h1 className='text-3xl font-canela font-bold text-foreground mb-2'>
                Recordings Management
              </h1>
              <p className='text-muted-foreground'>
                Manage artist recordings from Spotify and SoundCloud.
              </p>
            </div>

            <FmConfigurableDataGrid
              gridId='dev-recordings'
              data={recordings}
              columns={recordingColumns}
              contextMenuActions={recordingContextActions}
              loading={recordingsLoading}
              pageSize={15}
              onUpdate={handleRecordingUpdate}
              resourceName='Recording'
            />
          </div>
        )}

        {activeTab === 'galleries' && (
          <div className='space-y-6'>
            <div>
              <h1 className='text-3xl font-canela font-bold text-foreground mb-2'>
                Media Galleries
              </h1>
              <p className='text-muted-foreground'>
                Manage image galleries and media collections for the site.
              </p>
            </div>

            <GalleryManagementSection />
          </div>
        )}

        {activeTab === 'registrations' && <ArtistRegistrationsManagement />}

        {activeTab === 'user_requests' && (
          <div className='space-y-6'>
            <div>
              <h1 className='text-3xl font-canela font-bold text-foreground mb-2'>
                User Requests
              </h1>
              <p className='text-muted-foreground'>
                Review and manage user requests for artist linking, data deletion, and more.
              </p>
            </div>
            <UserRequestsAdmin />
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialogs */}
      <FmCommonConfirmDialog
        open={showDeleteArtistConfirm}
        onOpenChange={setShowDeleteArtistConfirm}
        title={t('devTools.database.deleteArtist')}
        description={t('devTools.database.confirmDeleteArtist', { name: artistToDelete?.name })}
        confirmText={t('buttons.delete')}
        onConfirm={handleDeleteArtist}
        variant="destructive"
      />

      <FmCommonConfirmDialog
        open={showDeleteVenueConfirm}
        onOpenChange={setShowDeleteVenueConfirm}
        title={t('devTools.database.deleteVenue')}
        description={t('devTools.database.confirmDeleteVenue', { name: venueToDelete?.name })}
        confirmText={t('buttons.delete')}
        onConfirm={handleDeleteVenue}
        variant="destructive"
      />

      <FmCommonConfirmDialog
        open={showDeleteRecordingConfirm}
        onOpenChange={setShowDeleteRecordingConfirm}
        title={t('devTools.database.deleteRecording')}
        description={t('devTools.database.confirmDeleteRecording', { name: recordingToDelete?.name })}
        confirmText={t('buttons.delete')}
        onConfirm={handleDeleteRecording}
        variant="destructive"
      />
    </SideNavbarLayout>
  );
}

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '@/shared';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { FmConfigurableDataGrid } from '@/features/data-grid';
import { SideNavbarLayout } from '@/components/layout/SideNavbarLayout';
import { MobileHorizontalTabs } from '@/components/mobile';
import { MapPin, Database, Calendar, Trash2, Mic2, Building2, Users, RefreshCw, Disc3, } from 'lucide-react';
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
export default function DeveloperDatabase() {
    const { t } = useTranslation('common');
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const queryClient = useQueryClient();
    const { hasRole } = useUserPermissions();
    const isAdmin = hasRole(ROLES.ADMIN);
    const [isRefreshingSchema, setIsRefreshingSchema] = useState(false);
    // Get active tab from URL query string, fallback to 'overview'
    const tabFromUrl = searchParams.get('table');
    const validTabs = ['overview', 'artists', 'events', 'organizations', 'recordings', 'users', 'venues'];
    const activeTab = tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : 'overview';
    // Navigation groups configuration - conditionally include admin-only tabs
    const navigationGroups = useMemo(() => {
        const tables = [
            {
                id: 'artists',
                label: 'Artists',
                icon: Mic2,
                description: 'Artist Management',
            },
            {
                id: 'events',
                label: 'Events',
                icon: Calendar,
                description: 'Event Management',
            },
            {
                id: 'recordings',
                label: 'Recordings',
                icon: Disc3,
                description: 'Music Recordings',
            },
            {
                id: 'venues',
                label: 'Venues',
                icon: MapPin,
                description: 'Venue Management',
            },
        ];
        // Add admin-only tabs (alphabetically)
        if (isAdmin) {
            tables.push({
                id: 'organizations',
                label: 'Organizations',
                icon: Building2,
                description: 'Organization Management',
                badge: _jsx(AdminLockIndicator, { position: "inline", size: "xs", tooltipText: "Admin only" }),
            }, {
                id: 'users',
                label: 'Users',
                icon: Users,
                description: 'User Management',
                badge: _jsx(AdminLockIndicator, { position: "inline", size: "xs", tooltipText: "Admin only" }),
            });
        }
        // Sort all tables alphabetically by label
        tables.sort((a, b) => a.label.localeCompare(b.label));
        return [
            {
                label: 'Overview',
                icon: Database,
                items: [
                    {
                        id: 'overview',
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
        ];
    }, [isAdmin]);
    // Mobile horizontal tabs configuration
    const mobileTabs = useMemo(() => {
        const baseTabs = [
            { id: 'artists', label: 'Artists', icon: Mic2 },
            { id: 'events', label: 'Events', icon: Calendar },
            { id: 'recordings', label: 'Tracks', icon: Disc3 },
            { id: 'venues', label: 'Venues', icon: MapPin },
        ];
        if (isAdmin) {
            baseTabs.push({ id: 'organizations', label: 'Orgs', icon: Building2 }, { id: 'users', label: 'Users', icon: Users });
        }
        return baseTabs;
    }, [isAdmin]);
    // Update URL when tab changes via location state
    useEffect(() => {
        const state = location.state;
        if (state?.editArtistId) {
            navigate(`?table=artists`, { replace: true });
        }
        else if (state?.openTab &&
            validTabs.includes(state.openTab)) {
            navigate(`?table=${state.openTab}`, { replace: true });
        }
    }, [location.state, navigate]);
    // Handler to change tabs and update URL
    const handleTabChange = (tab) => {
        navigate(`?table=${tab}`);
    };
    // Fetch artists data
    const { data: artists = [], isLoading: artistsLoading } = useQuery({
        queryKey: ['admin-artists'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('artists')
                .select('id, name, genre, image_url, bio, created_at, updated_at')
                .order('created_at', { ascending: false });
            if (error)
                throw error;
            return data ?? [];
        },
    });
    // Fetch venues data with city join
    const { data: venues = [], isLoading: venuesLoading } = useQuery({
        queryKey: ['admin-venues'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('venues')
                .select(`
          id, name, address_line_1, address_line_2, city, state, zip_code,
          capacity, image_url, website, created_at, updated_at,
          cities!city_id(name, state)
        `)
                .order('created_at', { ascending: false });
            if (error)
                throw error;
            // Flatten the city data for easier access
            return data.map((venue) => ({
                ...venue,
                city: venue.cities
                    ? `${venue.cities.name}, ${venue.cities.state}`
                    : null,
            }));
        },
    });
    // Fetch events count for dashboard
    const { data: eventsCount = 0 } = useQuery({
        queryKey: ['events-count'],
        queryFn: async () => {
            const { count, error } = await supabase
                .from('events')
                .select('*', { count: 'exact', head: true });
            if (error)
                throw error;
            return count ?? 0;
        },
    });
    // Fetch recordings count for dashboard
    const { data: recordingsCount = 0 } = useQuery({
        queryKey: ['recordings-count'],
        queryFn: async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { count, error } = await supabase
                .from('artist_recordings')
                .select('*', { count: 'exact', head: true });
            if (error)
                throw error;
            return count ?? 0;
        },
    });
    // Fetch recordings data with artist join
    const { data: recordings = [], isLoading: recordingsLoading } = useQuery({
        queryKey: ['admin-recordings'],
        queryFn: async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await supabase
                .from('artist_recordings')
                .select(`
          id, artist_id, name, duration, url, cover_art, platform, created_at, updated_at,
          artists!artist_id(name)
        `)
                .order('created_at', { ascending: false });
            if (error)
                throw error;
            // Flatten artist name for easier access
            return (data ?? []).map((recording) => ({
                ...recording,
                artist_name: recording.artists?.name || null,
            }));
        },
    });
    const handleArtistUpdate = async (row, columnKey, newValue) => {
        const normalizedValue = typeof newValue === 'string' ? newValue.trim() : newValue;
        const updateData = {
            [columnKey]: normalizedValue === '' ? null : normalizedValue,
        };
        try {
            const { error } = await supabase
                .from('artists')
                .update(updateData)
                .eq('id', row.id);
            if (error)
                throw error;
            queryClient.setQueryData(['admin-artists'], (oldData) => {
                if (!oldData)
                    return oldData;
                return oldData.map(artist => artist.id === row.id
                    ? {
                        ...artist,
                        ...updateData,
                        updated_at: new Date().toISOString(),
                    }
                    : artist);
            });
            toast.success(t('devTools.database.artistUpdated'));
        }
        catch (error) {
            logger.error('Error updating artist:', { error: error instanceof Error ? error.message : 'Unknown error', source: 'DeveloperDatabase.tsx' });
            toast.error(t('devTools.database.artistUpdateFailed'));
            throw error;
        }
    };
    const handleArtistCreate = async (newRow) => {
        const name = typeof newRow.name === 'string' ? newRow.name.trim() : '';
        if (!name) {
            throw new Error('Artist name is required');
        }
        const payload = {
            name,
            genre: typeof newRow.genre === 'string' && newRow.genre.trim() !== ''
                ? newRow.genre.trim()
                : null,
            image_url: typeof newRow.image_url === 'string' && newRow.image_url.trim() !== ''
                ? newRow.image_url.trim()
                : null,
            bio: typeof newRow.bio === 'string' && newRow.bio.trim() !== ''
                ? newRow.bio.trim()
                : null,
        };
        try {
            const { error } = await supabase.from('artists').insert(payload);
            if (error)
                throw error;
            toast.success(t('devTools.database.artistCreated'));
            await queryClient.invalidateQueries({ queryKey: ['admin-artists'] });
        }
        catch (error) {
            logger.error('Error creating artist:', { error: error instanceof Error ? error.message : 'Unknown error', source: 'DeveloperDatabase.tsx' });
            toast.error(t('devTools.database.artistCreateFailed'));
            throw error;
        }
    };
    const handleDeleteArtist = async (artist) => {
        if (!confirm(t('devTools.database.confirmDeleteArtist', { name: artist.name }))) {
            return;
        }
        try {
            const { error } = await supabase
                .from('artists')
                .delete()
                .eq('id', artist.id);
            if (error)
                throw error;
            toast.success(t('devTools.database.artistDeleted'));
            queryClient.invalidateQueries({ queryKey: ['admin-artists'] });
        }
        catch (error) {
            logger.error('Error deleting artist:', { error: error instanceof Error ? error.message : 'Unknown error', source: 'DeveloperDatabase.tsx' });
            toast.error(t('devTools.database.artistDeleteFailed'));
        }
    };
    const artistContextActions = [
        {
            label: 'Delete Artist',
            icon: _jsx(Trash2, { className: 'h-4 w-4' }),
            onClick: handleDeleteArtist,
            variant: 'destructive',
        },
    ];
    // Handle venue updates
    const handleVenueUpdate = async (row, columnKey, newValue) => {
        const updateData = {};
        // Convert capacity to integer if updating that field
        if (columnKey === 'capacity') {
            const numValue = parseInt(newValue, 10);
            if (isNaN(numValue)) {
                throw new Error('Capacity must be a valid number');
            }
            updateData[columnKey] = numValue;
        }
        else {
            updateData[columnKey] = newValue;
        }
        const { error } = await supabase
            .from('venues')
            .update(updateData)
            .eq('id', row.id);
        if (error)
            throw error;
        // Update local data instead of refetching to maintain sort order
        queryClient.setQueryData(['admin-venues'], (oldData) => {
            if (!oldData)
                return oldData;
            return oldData.map(venue => venue.id === row.id
                ? { ...venue, ...updateData, updated_at: new Date().toISOString() }
                : venue);
        });
    };
    const handleDeleteVenue = async (venue) => {
        if (!confirm(t('devTools.database.confirmDeleteVenue', { name: venue.name }))) {
            return;
        }
        try {
            const { error } = await supabase
                .from('venues')
                .delete()
                .eq('id', venue.id);
            if (error)
                throw error;
            toast.success(t('devTools.database.venueDeleted'));
            queryClient.invalidateQueries({ queryKey: ['admin-venues'] });
        }
        catch (error) {
            logger.error('Error deleting venue:', { error: error instanceof Error ? error.message : 'Unknown error', source: 'DeveloperDatabase.tsx' });
            toast.error(t('devTools.database.venueDeleteFailed'));
        }
    };
    // Context menu actions for venues
    const venueContextActions = [
        {
            label: 'Delete Venue',
            icon: _jsx(Trash2, { className: 'h-4 w-4' }),
            onClick: handleDeleteVenue,
            variant: 'destructive',
        },
    ];
    // Handle recording updates
    const handleRecordingUpdate = async (row, columnKey, newValue) => {
        const normalizedValue = typeof newValue === 'string' ? newValue.trim() : newValue;
        const updateData = {
            [columnKey]: normalizedValue === '' ? null : normalizedValue,
        };
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await supabase
                .from('artist_recordings')
                .update(updateData)
                .eq('id', row.id);
            if (error)
                throw error;
            queryClient.setQueryData(['admin-recordings'], (oldData) => {
                if (!oldData)
                    return oldData;
                return oldData.map(recording => recording.id === row.id
                    ? {
                        ...recording,
                        ...updateData,
                        updated_at: new Date().toISOString(),
                    }
                    : recording);
            });
            toast.success(t('devTools.database.recordingUpdated'));
        }
        catch (error) {
            logger.error('Error updating recording:', { error: error instanceof Error ? error.message : 'Unknown error', source: 'DeveloperDatabase.tsx' });
            toast.error(t('devTools.database.recordingUpdateFailed'));
            throw error;
        }
    };
    const handleDeleteRecording = async (recording) => {
        if (!confirm(t('devTools.database.confirmDeleteRecording', { name: recording.name }))) {
            return;
        }
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await supabase
                .from('artist_recordings')
                .delete()
                .eq('id', recording.id);
            if (error)
                throw error;
            toast.success(t('devTools.database.recordingDeleted'));
            queryClient.invalidateQueries({ queryKey: ['admin-recordings'] });
        }
        catch (error) {
            logger.error('Error deleting recording:', { error: error instanceof Error ? error.message : 'Unknown error', source: 'DeveloperDatabase.tsx' });
            toast.error(t('devTools.database.recordingDeleteFailed'));
        }
    };
    const recordingContextActions = [
        {
            label: 'Delete Recording',
            icon: _jsx(Trash2, { className: 'h-4 w-4' }),
            onClick: handleDeleteRecording,
            variant: 'destructive',
        },
    ];
    // Calculate statistics for current data
    const getCurrentData = () => {
        if (activeTab === 'artists')
            return artists;
        if (activeTab === 'venues')
            return venues;
        if (activeTab === 'recordings')
            return recordings;
        if (activeTab === 'events')
            return []; // Events data is managed in EventsManagement component
        if (activeTab === 'organizations')
            return [];
        return [];
    };
    const calculateCompleteness = (data) => {
        if (!data.length)
            return 0;
        let totalFields = 0;
        let filledFields = 0;
        data.forEach(record => {
            const fields = Object.entries(record);
            fields.forEach(([key, value]) => {
                // Skip internal fields
                if (['id', 'created_at', 'updated_at'].includes(key))
                    return;
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
            }
            else {
                toast.error(result.error || t('devTools.database.schemaRefreshFailed'));
            }
        }
        catch (error) {
            logger.error('Error refreshing schema', {
                error: error instanceof Error ? error.message : 'Unknown error',
                source: 'DeveloperDatabase',
                details: {},
            });
            toast.error(t('devTools.database.schemaRefreshFailed'));
        }
        finally {
            setIsRefreshingSchema(false);
        }
    };
    return (_jsxs(SideNavbarLayout, { navigationGroups: navigationGroups, activeItem: activeTab, onItemChange: handleTabChange, children: [_jsx(MobileHorizontalTabs, { tabs: mobileTabs, activeTab: activeTab, onTabChange: tab => handleTabChange(tab) }), _jsxs("div", { className: 'max-w-full', children: [activeTab === 'overview' && (_jsxs("div", { className: 'flex flex-col items-center justify-center min-h-[60vh]', children: [_jsx("div", { className: 'w-full max-w-4xl mb-6 flex justify-end', children: _jsx(FmCommonButton, { onClick: handleSchemaRefresh, disabled: isRefreshingSchema, variant: "secondary", size: "sm", icon: RefreshCw, className: isRefreshingSchema ? '[&_svg]:animate-spin' : '', children: isRefreshingSchema ? 'Refreshing Schema...' : 'Refresh Schema' }) }), _jsx("div", { className: 'w-full max-w-5xl mb-12', children: _jsxs("div", { className: 'grid grid-cols-2 md:grid-cols-5 gap-4', children: [_jsxs("div", { className: 'bg-muted/30 border border-border rounded-none px-[20px] py-[15px] transition-all duration-300 hover:bg-white/5 hover:shadow-[0_0_0_2px_rgba(212,175,55,0.3)] hover:scale-[1.02]', children: [_jsx("div", { className: 'text-xs text-muted-foreground mb-1', children: "Artists" }), _jsx("div", { className: 'text-2xl font-bold text-foreground', children: artists.length })] }), _jsxs("div", { className: 'bg-muted/30 border border-border rounded-none px-[20px] py-[15px] transition-all duration-300 hover:bg-white/5 hover:shadow-[0_0_0_2px_rgba(212,175,55,0.3)] hover:scale-[1.02]', children: [_jsx("div", { className: 'text-xs text-muted-foreground mb-1', children: "Venues" }), _jsx("div", { className: 'text-2xl font-bold text-foreground', children: venues.length })] }), _jsxs("div", { className: 'bg-muted/30 border border-border rounded-none px-[20px] py-[15px] transition-all duration-300 hover:bg-white/5 hover:shadow-[0_0_0_2px_rgba(212,175,55,0.3)] hover:scale-[1.02]', children: [_jsx("div", { className: 'text-xs text-muted-foreground mb-1', children: "Events" }), _jsx("div", { className: 'text-2xl font-bold text-foreground', children: eventsCount })] }), _jsxs("div", { className: 'bg-muted/30 border border-border rounded-none px-[20px] py-[15px] transition-all duration-300 hover:bg-white/5 hover:shadow-[0_0_0_2px_rgba(212,175,55,0.3)] hover:scale-[1.02]', children: [_jsx("div", { className: 'text-xs text-muted-foreground mb-1', children: "Recordings" }), _jsx("div", { className: 'text-2xl font-bold text-foreground', children: recordingsCount })] }), _jsxs("div", { className: 'bg-muted/30 border border-border rounded-none px-[20px] py-[15px] transition-all duration-300 hover:bg-white/5 hover:shadow-[0_0_0_2px_rgba(212,175,55,0.3)] hover:scale-[1.02]', children: [_jsx("div", { className: 'text-xs text-muted-foreground mb-1', children: "Complete Data" }), _jsxs("div", { className: 'text-2xl font-bold text-foreground', children: [completeness, "%"] })] })] }) }), _jsx("div", { className: 'w-full max-w-2xl', children: _jsx(DatabaseNavigatorSearch, {}) })] })), activeTab === 'artists' && (_jsxs("div", { className: 'space-y-6', children: [_jsxs("div", { children: [_jsx("h1", { className: 'text-3xl font-canela font-bold text-foreground mb-2', children: "Artists Management" }), _jsx("p", { className: 'text-muted-foreground', children: "Manage artist profiles, genres, and metadata." })] }), _jsx(FmConfigurableDataGrid, { gridId: 'dev-artists', data: artists, columns: artistColumns, contextMenuActions: artistContextActions, loading: artistsLoading, pageSize: 15, onUpdate: handleArtistUpdate, onCreate: handleArtistCreate, resourceName: 'Artist', createButtonLabel: 'Add Artist', onCreateButtonClick: () => navigate('/artists/create') })] })), activeTab === 'organizations' && _jsx(OrganizationsManagement, {}), activeTab === 'users' && _jsx(UserManagement, {}), activeTab === 'venues' && (_jsxs("div", { className: 'space-y-6', children: [_jsxs("div", { children: [_jsx("h1", { className: 'text-3xl font-canela font-bold text-foreground mb-2', children: "Venues Management" }), _jsx("p", { className: 'text-muted-foreground', children: "Manage venue locations, capacities, and details." })] }), _jsx(FmConfigurableDataGrid, { gridId: 'dev-venues', data: venues, columns: venueColumns, contextMenuActions: venueContextActions, loading: venuesLoading, pageSize: 15, onUpdate: handleVenueUpdate, resourceName: 'Venue', createButtonLabel: 'Add Venue', onCreateButtonClick: () => navigate('/venues/create') })] })), activeTab === 'events' && (_jsx(EventsManagement, {})), activeTab === 'recordings' && (_jsxs("div", { className: 'space-y-6', children: [_jsxs("div", { children: [_jsx("h1", { className: 'text-3xl font-canela font-bold text-foreground mb-2', children: "Recordings Management" }), _jsx("p", { className: 'text-muted-foreground', children: "Manage artist recordings from Spotify and SoundCloud." })] }), _jsx(FmConfigurableDataGrid, { gridId: 'dev-recordings', data: recordings, columns: recordingColumns, contextMenuActions: recordingContextActions, loading: recordingsLoading, pageSize: 15, onUpdate: handleRecordingUpdate, resourceName: 'Recording' })] }))] })] }));
}

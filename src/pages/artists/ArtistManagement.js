import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Music, Save, Trash2, Eye, Share2, Headphones, Plus, ExternalLink, Calendar, Disc, Radio, Pencil, } from 'lucide-react';
import { FaInstagram, FaXTwitter, FaFacebook, FaTiktok, FaYoutube, } from 'react-icons/fa6';
import { supabase } from '@/shared';
import { SideNavbarLayout } from '@/components/layout/SideNavbarLayout';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmImageUpload } from '@/components/common/forms/FmImageUpload';
import { FmI18nCommon } from '@/components/common/i18n';
import { toast } from 'sonner';
import { handleError } from '@/shared/services/errorHandler';
import { useDebouncedSave } from '@/shared/hooks/useDebouncedSave';
import { FmGenreMultiSelect } from '@/features/artists/components/FmGenreMultiSelect';
import { AddTrackModal } from '@/features/artists/components/AddTrackModal';
import { EditTrackModal } from '@/features/artists/components/EditTrackModal';
import { useArtistGenres, useUpdateArtistGenres } from '@/features/artists/hooks/useArtistGenres';
import { cn } from '@/shared';
export default function ArtistManagement() {
    const { t } = useTranslation('common');
    const { t: tToast } = useTranslation('toasts');
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const queryClient = useQueryClient();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    // Form state - Overview
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [website, setWebsite] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    // Form state - Genres
    const [selectedGenres, setSelectedGenres] = useState([]);
    // Form state - Social Links
    const [instagram, setInstagram] = useState('');
    const [twitter, setTwitter] = useState('');
    const [facebook, setFacebook] = useState('');
    const [tiktok, setTiktok] = useState('');
    const [youtube, setYoutube] = useState('');
    // Form state - Music Tracks
    const [tracks, setTracks] = useState([]);
    const [isAddTrackModalOpen, setIsAddTrackModalOpen] = useState(false);
    const [editingTrack, setEditingTrack] = useState(null);
    // Hooks for genre management
    const { data: artistGenres } = useArtistGenres(id);
    const updateGenresMutation = useUpdateArtistGenres();
    // Build metadata object for saving
    const buildMetadata = () => ({
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
    const saveArtistData = async (data) => {
        if (!id)
            return;
        try {
            const { error } = await supabase
                .from('artists')
                .update({
                name: data.name,
                bio: data.bio,
                website: data.website,
                image_url: data.image_url,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                spotify_data: data.spotify_data,
                updated_at: new Date().toISOString(),
            })
                .eq('id', id);
            if (error)
                throw error;
            toast.success(tToast('artists.autoSaved'));
            queryClient.invalidateQueries({ queryKey: ['artist', id] });
        }
        catch (error) {
            await handleError(error, {
                title: 'Auto-save Failed',
                description: 'Could not save changes automatically',
                endpoint: 'ArtistManagement',
                method: 'UPDATE',
            });
        }
    };
    const { triggerSave: triggerArtistSave, flushSave: flushArtistSave } = useDebouncedSave({
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
            if (!id)
                throw new Error('No artist ID provided');
            const { data, error } = await supabase
                .from('artists')
                .select('*')
                .eq('id', id)
                .single();
            if (error)
                throw error;
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
            const metadata = artist.spotify_data;
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
            const genres = artistGenres.map(ag => ag.genre);
            setSelectedGenres(genres);
        }
    }, [artistGenres]);
    // Handle genre changes
    const handleGenreChange = (genres) => {
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
    const handleDeleteTrack = (trackId) => {
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
    const handleAddTrack = (newTrack) => {
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
    const handleUpdateTrack = (updatedTrack) => {
        const updatedTracks = tracks.map(t => t.id === updatedTrack.id ? updatedTrack : t);
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
    const handleTrackLinkClick = (trackId) => {
        const updatedTracks = tracks.map(t => t.id === trackId
            ? { ...t, clickCount: (t.clickCount || 0) + 1 }
            : t);
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
    const navigationGroups = [
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
        if (!id)
            return;
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
                spotify_data: buildMetadata(),
                updated_at: new Date().toISOString(),
            })
                .eq('id', id);
            if (error)
                throw error;
            toast.success(tToast('artists.updated'));
            queryClient.invalidateQueries({ queryKey: ['artist', id] });
        }
        catch (error) {
            handleError(error, { title: 'Failed to update artist' });
        }
        finally {
            setIsSaving(false);
        }
    };
    const handleDelete = async () => {
        if (!id || !confirm(t('dialogs.deleteArtistConfirm')))
            return;
        setIsDeleting(true);
        try {
            const { error } = await supabase.from('artists').delete().eq('id', id);
            if (error)
                throw error;
            toast.success(tToast('artists.deleted'));
            navigate('/developer/database?table=artists');
        }
        catch (error) {
            handleError(error, { title: 'Failed to delete artist' });
        }
        finally {
            setIsDeleting(false);
        }
    };
    const renderOverviewTab = () => (_jsxs("div", { className: 'space-y-6', children: [_jsxs(FmCommonCard, { size: 'lg', hoverable: false, children: [_jsx(FmI18nCommon, { i18nKey: 'sections.basicInformation', as: 'h2', className: 'text-xl font-semibold mb-6' }), _jsxs("div", { className: 'space-y-4', children: [_jsx(FmCommonTextField, { label: t('labels.artistName'), required: true, value: name, onChange: (e) => {
                                    setName(e.target.value);
                                    triggerAutoSave();
                                }, placeholder: t('forms.artists.namePlaceholder') }), _jsxs("div", { className: 'space-y-1', children: [_jsx("span", { className: 'text-xs text-muted-foreground', children: t('labels.artistImage') }), _jsx(FmImageUpload, { currentImageUrl: imageUrl, onUploadComplete: (url) => {
                                            setImageUrl(url);
                                            triggerAutoSave();
                                        } })] }), _jsx("div", { children: _jsx(FmGenreMultiSelect, { selectedGenres: selectedGenres, onChange: handleGenreChange, maxGenres: 5, label: t('labels.genres') }) }), _jsx(FmCommonTextField, { label: t('labels.bio'), multiline: true, rows: 5, value: bio, onChange: (e) => {
                                    setBio(e.target.value);
                                    triggerAutoSave();
                                }, placeholder: t('forms.artists.bioPlaceholder') }), _jsx(FmCommonTextField, { label: t('labels.website'), value: website, onChange: (e) => {
                                    setWebsite(e.target.value);
                                    triggerAutoSave();
                                }, placeholder: t('forms.artists.websitePlaceholder') })] })] }), _jsxs("div", { className: 'flex justify-between', children: [_jsx(FmCommonButton, { variant: 'destructive', icon: Trash2, onClick: handleDelete, disabled: isDeleting, children: isDeleting ? t('buttons.deleting') : t('buttons.deleteArtist') }), _jsx(FmCommonButton, { icon: Save, onClick: handleSave, disabled: isSaving || !name, children: isSaving ? t('buttons.saving') : t('buttons.saveChanges') })] })] }));
    const renderMusicTab = () => (_jsx("div", { className: 'space-y-6', children: _jsxs(FmCommonCard, { size: 'lg', hoverable: false, children: [_jsx("div", { className: 'flex items-center justify-between mb-6', children: _jsxs("div", { children: [_jsx(FmI18nCommon, { i18nKey: 'sections.recordings', as: 'h2', className: 'text-xl font-semibold' }), _jsx(FmI18nCommon, { i18nKey: 'sections.recordingsDescription', as: 'p', className: 'text-muted-foreground text-sm mt-1' })] }) }), _jsxs("div", { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', children: [tracks.map((track) => (_jsxs(FmCommonCard, { size: 'sm', variant: 'outline', className: 'group relative overflow-hidden p-0', children: [_jsxs("div", { className: 'aspect-square relative overflow-hidden', children: [track.coverArt ? (_jsx("img", { src: track.coverArt, alt: track.name, className: 'w-full h-full object-cover' })) : (_jsx("div", { className: 'w-full h-full bg-gradient-to-br from-fm-gold/20 to-fm-gold/5 flex items-center justify-center', children: _jsx(Music, { className: 'h-12 w-12 text-fm-gold/50' }) })), _jsx("div", { className: 'absolute top-2 right-2', children: _jsx("span", { className: cn('px-2 py-1 text-xs font-medium uppercase tracking-wider', track.platform === 'spotify'
                                                    ? 'bg-[#1DB954]/90 text-white'
                                                    : 'bg-[#FF5500]/90 text-white'), children: track.platform }) }), _jsx("div", { className: 'absolute bottom-2 left-2', children: _jsx("span", { className: 'flex items-center gap-1 px-2 py-1 text-xs font-medium bg-black/70 text-white', children: track.recordingType === 'dj_set' ? (_jsxs(_Fragment, { children: [_jsx(Radio, { className: 'h-3 w-3' }), t('labels.djSet')] })) : (_jsxs(_Fragment, { children: [_jsx(Disc, { className: 'h-3 w-3' }), t('labels.track')] })) }) }), _jsxs("div", { className: 'absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200', children: [_jsx("button", { onClick: () => setEditingTrack(track), className: 'p-1.5 bg-black/60 hover:bg-fm-gold text-white transition-colors', children: _jsx(Pencil, { className: 'h-4 w-4' }) }), _jsx("button", { onClick: () => handleDeleteTrack(track.id), className: 'p-1.5 bg-black/60 hover:bg-red-600 text-white transition-colors', children: _jsx(Trash2, { className: 'h-4 w-4' }) })] })] }), _jsxs("div", { className: 'p-4', children: [_jsx("h3", { className: 'font-semibold text-sm line-clamp-1 mb-2', children: track.name }), _jsxs("div", { className: 'flex items-center justify-between text-muted-foreground text-xs', children: [_jsxs("div", { className: 'flex items-center gap-3', children: [track.addedAt && (_jsxs("span", { className: 'flex items-center gap-1', children: [_jsx(Calendar, { className: 'h-3 w-3' }), new Date(track.addedAt).toLocaleDateString('en-US', {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    year: 'numeric'
                                                                })] })), track.clickCount !== undefined && track.clickCount > 0 && (_jsx("span", { className: 'text-fm-gold', children: t('labels.clicks', { count: track.clickCount }) }))] }), _jsxs("a", { href: track.url, target: '_blank', rel: 'noopener noreferrer', onClick: () => handleTrackLinkClick(track.id), className: 'flex items-center gap-1 hover:text-fm-gold transition-colors', children: [_jsx(ExternalLink, { className: 'h-3 w-3' }), _jsx("span", { children: t('labels.listen') })] })] })] })] }, track.id))), _jsxs("button", { onClick: () => setIsAddTrackModalOpen(true), className: 'aspect-square border-2 border-dashed border-white/20 hover:border-fm-gold/50 bg-black/20 hover:bg-fm-gold/5 flex flex-col items-center justify-center gap-3 transition-all duration-200 group', children: [_jsx("div", { className: 'p-3 rounded-full bg-white/5 group-hover:bg-fm-gold/20 transition-colors', children: _jsx(Plus, { className: 'h-6 w-6 text-muted-foreground group-hover:text-fm-gold' }) }), _jsx("span", { className: 'text-sm text-muted-foreground group-hover:text-fm-gold font-medium', children: t('labels.addRecording') })] })] }), _jsx(AddTrackModal, { open: isAddTrackModalOpen, onOpenChange: setIsAddTrackModalOpen, onAddTrack: handleAddTrack }), _jsx(EditTrackModal, { track: editingTrack, onClose: () => setEditingTrack(null), onSave: handleUpdateTrack })] }) }));
    // Social media URL builders
    const socialUrlBuilders = {
        instagram: (username) => `https://instagram.com/${username}`,
        twitter: (username) => `https://x.com/${username}`,
        facebook: (username) => `https://facebook.com/${username}`,
        tiktok: (username) => `https://tiktok.com/@${username}`,
        youtube: (username) => `https://youtube.com/@${username}`,
    };
    // Social media input with icon - username only, shows constructed URL
    const SocialInput = ({ icon: Icon, label, value, onChange, placeholder, iconColor, urlBuilder, }) => (_jsxs("div", { className: 'space-y-1', children: [_jsxs("div", { className: 'flex items-center gap-2 text-xs text-muted-foreground', children: [_jsx(Icon, { className: cn('h-4 w-4', iconColor) }), _jsx("span", { children: label })] }), _jsx(FmCommonTextField, { value: value, onChange: (e) => {
                    // Strip @ prefix if user includes it
                    const cleaned = e.target.value.replace(/^@/, '');
                    onChange(cleaned);
                    triggerAutoSave();
                }, placeholder: placeholder, prepend: '@' }), value && (_jsx("a", { href: urlBuilder(value), target: '_blank', rel: 'noopener noreferrer', className: 'text-xs text-muted-foreground hover:text-fm-gold transition-colors truncate block', children: urlBuilder(value) }))] }));
    const renderSocialTab = () => (_jsx("div", { className: 'space-y-6', children: _jsxs(FmCommonCard, { size: 'lg', hoverable: false, children: [_jsx(FmI18nCommon, { i18nKey: 'sections.socialMedia', as: 'h2', className: 'text-xl font-semibold mb-6' }), _jsx(FmI18nCommon, { i18nKey: 'sections.socialMediaDescription', as: 'p', className: 'text-muted-foreground mb-6' }), _jsxs("div", { className: 'space-y-4', children: [_jsx(SocialInput, { icon: FaInstagram, label: t('labels.instagram'), value: instagram, onChange: setInstagram, placeholder: t('placeholders.username'), iconColor: 'text-[#E4405F]', urlBuilder: socialUrlBuilders.instagram }), _jsx(SocialInput, { icon: FaXTwitter, label: t('labels.twitterX'), value: twitter, onChange: setTwitter, placeholder: t('placeholders.username'), iconColor: 'text-white', urlBuilder: socialUrlBuilders.twitter }), _jsx(SocialInput, { icon: FaFacebook, label: t('labels.facebook'), value: facebook, onChange: setFacebook, placeholder: t('placeholders.usernameOrPage'), iconColor: 'text-[#1877F2]', urlBuilder: socialUrlBuilders.facebook }), _jsx(SocialInput, { icon: FaTiktok, label: t('labels.tiktok'), value: tiktok, onChange: setTiktok, placeholder: t('placeholders.username'), iconColor: 'text-white', urlBuilder: socialUrlBuilders.tiktok }), _jsx(SocialInput, { icon: FaYoutube, label: t('labels.youtube'), value: youtube, onChange: setYoutube, placeholder: t('placeholders.channelHandle'), iconColor: 'text-[#FF0000]', urlBuilder: socialUrlBuilders.youtube })] })] }) }));
    if (isLoading) {
        return (_jsx("div", { className: 'min-h-screen flex items-center justify-center bg-background', children: _jsx(FmCommonLoadingSpinner, { size: 'lg' }) }));
    }
    return (_jsxs(SideNavbarLayout, { navigationGroups: navigationGroups, activeItem: activeTab, onItemChange: (tabId) => {
            if (tabId === 'view') {
                navigate(`/artists/${artist?.id}`);
            }
            else {
                setActiveTab(tabId);
            }
        }, children: [activeTab === 'overview' && renderOverviewTab(), activeTab === 'music' && renderMusicTab(), activeTab === 'social' && renderSocialTab()] }));
}

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * TrackInputForm Component
 *
 * Reusable form for adding a track by pasting a Spotify or SoundCloud URL.
 * Fetches and parses track metadata from the URL and displays a preview.
 * Can be used standalone or within a modal.
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link2, Music, ExternalLink, AlertCircle, Disc, Radio, Trash2, Pencil, X } from 'lucide-react';
import { logger } from '@/shared/services/logger';
import { FaSpotify, FaSoundcloud } from 'react-icons/fa6';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { cn } from '@/shared';
// Parse platform from URL
function detectPlatform(url) {
    if (url.includes('spotify.com') || url.includes('open.spotify')) {
        return 'spotify';
    }
    if (url.includes('soundcloud.com')) {
        return 'soundcloud';
    }
    return null;
}
// Extract Spotify track ID from URL
function extractSpotifyTrackId(url) {
    const match = url.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
}
// Fetch Spotify track metadata using oEmbed (no API key required)
async function fetchSpotifyMetadata(url) {
    try {
        const trackId = extractSpotifyTrackId(url);
        if (!trackId)
            return null;
        const oEmbedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
        const response = await fetch(oEmbedUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch Spotify metadata');
        }
        const data = await response.json();
        const [name, artistName] = data.title?.split(' - ') || [data.title, 'Unknown Artist'];
        return {
            name: name || 'Unknown Track',
            coverArt: data.thumbnail_url,
            artistName: artistName,
            platform: 'spotify',
            url: `https://open.spotify.com/track/${trackId}`,
        };
    }
    catch (error) {
        logger.error('Error fetching Spotify metadata', {
            error: error instanceof Error ? error.message : 'Unknown',
            source: 'TrackInputForm'
        });
        return null;
    }
}
// Fetch SoundCloud track metadata using oEmbed
async function fetchSoundCloudMetadata(url) {
    try {
        const oEmbedUrl = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`;
        const response = await fetch(oEmbedUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch SoundCloud metadata');
        }
        const data = await response.json();
        let name = data.title || 'Unknown Track';
        const artistName = data.author_name || 'Unknown Artist';
        if (name.includes(' by ')) {
            const parts = name.split(' by ');
            name = parts[0];
        }
        return {
            name,
            coverArt: data.thumbnail_url,
            artistName,
            platform: 'soundcloud',
            url,
        };
    }
    catch (error) {
        logger.error('Error fetching SoundCloud metadata', {
            error: error instanceof Error ? error.message : 'Unknown',
            source: 'TrackInputForm'
        });
        return null;
    }
}
export function TrackInputForm({ onAddTrack, onCancel, showCancelButton = false, submitButtonText, editingTrack, onEditComplete, }) {
    const { t } = useTranslation('common');
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [trackData, setTrackData] = useState(null);
    const [isLinking, setIsLinking] = useState(false);
    const [recordingType, setRecordingType] = useState('track');
    const isEditMode = !!editingTrack;
    const defaultSubmitText = submitButtonText || t('forms.tracks.addRecording');
    // Initialize form when editing track changes
    useEffect(() => {
        if (editingTrack) {
            setUrl(editingTrack.url);
            setRecordingType(editingTrack.recordingType);
            // Set initial track data from the editing track
            setTrackData({
                name: editingTrack.name,
                coverArt: editingTrack.coverArt,
                platform: editingTrack.platform,
                url: editingTrack.url,
            });
        }
    }, [editingTrack]);
    // Auto-fetch when URL changes
    useEffect(() => {
        const fetchMetadata = async () => {
            if (!url.trim()) {
                setTrackData(null);
                setError(null);
                return;
            }
            const platform = detectPlatform(url);
            if (!platform) {
                setError(t('formMessages.invalidTrackUrl'));
                setTrackData(null);
                return;
            }
            setIsLoading(true);
            setError(null);
            try {
                let metadata = null;
                if (platform === 'spotify') {
                    metadata = await fetchSpotifyMetadata(url);
                }
                else if (platform === 'soundcloud') {
                    metadata = await fetchSoundCloudMetadata(url);
                }
                if (metadata) {
                    setTrackData(metadata);
                    setError(null);
                }
                else {
                    setError(t('formMessages.couldNotFetchTrack'));
                    setTrackData(null);
                }
            }
            catch {
                setError(t('formMessages.failedToFetchTrack'));
                setTrackData(null);
            }
            finally {
                setIsLoading(false);
            }
        };
        const timer = setTimeout(fetchMetadata, 500);
        return () => clearTimeout(timer);
    }, [url]);
    const handleLink = () => {
        if (!trackData)
            return;
        setIsLinking(true);
        if (isEditMode && editingTrack && onEditComplete) {
            // Edit mode - update existing track
            const updatedTrack = {
                id: editingTrack.id,
                name: trackData.name,
                url: trackData.url,
                coverArt: trackData.coverArt,
                platform: trackData.platform,
                recordingType,
            };
            onEditComplete(updatedTrack);
        }
        else {
            // Add mode - create new track
            const newTrack = {
                id: crypto.randomUUID(),
                name: trackData.name,
                url: trackData.url,
                coverArt: trackData.coverArt,
                platform: trackData.platform,
                recordingType,
            };
            onAddTrack(newTrack);
        }
        setIsLinking(false);
        // Reset form
        setUrl('');
        setTrackData(null);
        setRecordingType('track');
    };
    const platform = url ? detectPlatform(url) : null;
    return (_jsxs("div", { className: "space-y-[20px]", children: [_jsxs("div", { className: "space-y-[10px]", children: [_jsx(FmCommonTextField, { label: t('forms.tracks.urlLabel'), value: url, onChange: (e) => setUrl(e.target.value), placeholder: t('forms.tracks.urlPlaceholder') }), _jsxs("div", { className: "flex items-center gap-[20px] text-xs text-muted-foreground", children: [_jsxs("span", { className: "flex items-center gap-[5px]", children: [_jsx(FaSpotify, { className: cn('h-4 w-4', platform === 'spotify' ? 'text-[#1DB954]' : 'opacity-30') }), "Spotify"] }), _jsxs("span", { className: "flex items-center gap-[5px]", children: [_jsx(FaSoundcloud, { className: cn('h-4 w-4', platform === 'soundcloud' ? 'text-[#FF5500]' : 'opacity-30') }), "SoundCloud"] })] })] }), trackData && !isLoading && (_jsxs("div", { className: "space-y-[10px]", children: [_jsx("label", { className: "text-xs uppercase text-muted-foreground", children: t('formLabels.recordingType') }), _jsxs("div", { className: "flex gap-[10px]", children: [_jsxs("button", { type: "button", onClick: () => setRecordingType('track'), className: cn('flex-1 flex items-center justify-center gap-[10px] px-[20px] py-[10px] border transition-all', recordingType === 'track'
                                    ? 'border-fm-gold bg-fm-gold/10 text-fm-gold'
                                    : 'border-white/20 hover:border-white/40 text-muted-foreground'), children: [_jsx(Disc, { className: "h-4 w-4" }), _jsx("span", { className: "font-medium", children: t('formLabels.track') })] }), _jsxs("button", { type: "button", onClick: () => setRecordingType('dj_set'), className: cn('flex-1 flex items-center justify-center gap-[10px] px-[20px] py-[10px] border transition-all', recordingType === 'dj_set'
                                    ? 'border-fm-gold bg-fm-gold/10 text-fm-gold'
                                    : 'border-white/20 hover:border-white/40 text-muted-foreground'), children: [_jsx(Radio, { className: "h-4 w-4" }), _jsx("span", { className: "font-medium", children: t('formLabels.djSet') })] })] })] })), isLoading && (_jsxs("div", { className: "flex items-center justify-center py-[40px]", children: [_jsx(FmCommonLoadingSpinner, { size: "md" }), _jsx("span", { className: "ml-[10px] text-muted-foreground", children: t('formMessages.fetchingTrackInfo') })] })), error && !isLoading && (_jsxs("div", { className: "flex items-center gap-[10px] p-[20px] bg-red-500/10 border border-red-500/30 text-red-400", children: [_jsx(AlertCircle, { className: "h-5 w-5 flex-shrink-0" }), _jsx("span", { className: "text-sm", children: error })] })), trackData && !isLoading && (_jsx(FmCommonCard, { variant: "outline", className: "p-0 overflow-hidden", children: _jsxs("div", { className: "flex gap-[20px]", children: [_jsxs("div", { className: "w-24 h-24 flex-shrink-0 relative", children: [trackData.coverArt ? (_jsx("img", { src: trackData.coverArt, alt: trackData.name, className: "w-full h-full object-cover" })) : (_jsx("div", { className: "w-full h-full bg-gradient-to-br from-fm-gold/20 to-fm-gold/5 flex items-center justify-center", children: _jsx(Music, { className: "h-8 w-8 text-fm-gold/50" }) })), _jsx("div", { className: "absolute bottom-1 right-1", children: trackData.platform === 'spotify' ? (_jsx(FaSpotify, { className: "h-5 w-5 text-[#1DB954] drop-shadow-lg" })) : (_jsx(FaSoundcloud, { className: "h-5 w-5 text-[#FF5500] drop-shadow-lg" })) })] }), _jsxs("div", { className: "flex-1 py-[10px] pr-[20px]", children: [_jsx("h3", { className: "font-semibold text-base line-clamp-1 mb-[5px]", children: trackData.name }), trackData.artistName && (_jsx("p", { className: "text-sm text-muted-foreground mb-[10px]", children: trackData.artistName })), _jsx("div", { className: "flex items-center gap-[20px] text-xs text-muted-foreground", children: _jsxs("a", { href: trackData.url, target: "_blank", rel: "noopener noreferrer", className: "flex items-center gap-[5px] hover:text-fm-gold transition-colors", children: [_jsx(ExternalLink, { className: "h-3 w-3" }), t('forms.tracks.preview')] }) })] })] }) })), _jsxs("div", { className: "flex justify-end gap-[10px]", children: [(showCancelButton || isEditMode) && onCancel && (_jsx(FmCommonButton, { variant: "secondary", onClick: onCancel, children: t('buttons.cancel') })), _jsx(FmCommonButton, { icon: Link2, onClick: handleLink, disabled: !trackData || isLoading || isLinking, children: isLinking
                            ? (isEditMode ? t('forms.tracks.saving') : t('forms.tracks.adding'))
                            : (isEditMode ? t('formActions.saveChanges') : defaultSubmitText) })] })] }));
}
export function TrackList({ tracks, onRemoveTrack, onEditTrack, editingTrackId }) {
    const { t } = useTranslation('common');
    if (tracks.length === 0)
        return null;
    return (_jsxs("div", { className: "space-y-[10px]", children: [_jsx("label", { className: "text-xs uppercase text-muted-foreground", children: t('forms.tracks.addedRecordings', { count: tracks.length }) }), _jsx("div", { className: "space-y-[10px]", children: tracks.map((track) => {
                    const isEditing = editingTrackId === track.id;
                    return (_jsx(FmCommonCard, { variant: "outline", className: cn("p-0 overflow-hidden transition-all duration-200", isEditing && "border-fm-gold/50 bg-fm-gold/5"), children: _jsxs("div", { className: "flex gap-[10px] items-center", children: [_jsxs("div", { className: "w-16 h-16 flex-shrink-0 relative", children: [track.coverArt ? (_jsx("img", { src: track.coverArt, alt: track.name, className: "w-full h-full object-cover" })) : (_jsx("div", { className: "w-full h-full bg-gradient-to-br from-fm-gold/20 to-fm-gold/5 flex items-center justify-center", children: _jsx(Music, { className: "h-6 w-6 text-fm-gold/50" }) })), _jsx("div", { className: "absolute bottom-0.5 right-0.5", children: track.platform === 'spotify' ? (_jsx(FaSpotify, { className: "h-4 w-4 text-[#1DB954] drop-shadow-lg" })) : (_jsx(FaSoundcloud, { className: "h-4 w-4 text-[#FF5500] drop-shadow-lg" })) })] }), _jsxs("div", { className: "flex-1 py-[10px]", children: [_jsx("h4", { className: "font-medium text-sm line-clamp-1", children: track.name }), _jsx("p", { className: "text-xs text-muted-foreground", children: track.recordingType === 'dj_set' ? t('formLabels.djSet') : t('formLabels.track') })] }), _jsxs("div", { className: "flex items-center gap-[5px] mr-[10px]", children: [onEditTrack && (_jsx("button", { onClick: () => onEditTrack(track), className: cn("p-[10px] transition-colors", isEditing
                                                ? "text-fm-gold"
                                                : "text-muted-foreground hover:text-fm-gold"), "aria-label": t('aria.editTrack'), children: isEditing ? _jsx(X, { className: "h-4 w-4" }) : _jsx(Pencil, { className: "h-4 w-4" }) })), _jsx("button", { onClick: () => onRemoveTrack(track.id), className: "p-[10px] text-muted-foreground hover:text-red-400 transition-colors", "aria-label": t('aria.removeTrack'), children: _jsx(Trash2, { className: "h-4 w-4" }) })] })] }) }, track.id));
                }) })] }));
}

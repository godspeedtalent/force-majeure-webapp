/**
 * TrackInputForm Component
 *
 * Reusable form for adding a track by pasting a Spotify, SoundCloud, or YouTube URL.
 * Fetches and parses track metadata from the URL and displays a preview.
 * Can be used standalone or within a modal.
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link2, Music, ExternalLink, AlertCircle, Disc, Radio, Trash2, Pencil, X, Star } from 'lucide-react';
import { logger } from '@/shared/services/logger';
import { FaSpotify, FaSoundcloud, FaYoutube } from 'react-icons/fa6';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { cn } from '@/shared';

export type RecordingType = 'track' | 'dj_set';

export type RecordingPlatform = 'spotify' | 'soundcloud' | 'youtube';

export interface TrackMetadata {
  name: string;
  coverArt?: string;
  artistName?: string;
  platform: RecordingPlatform;
  url: string;
}

export interface TrackFormData {
  id: string;
  name: string;
  url: string;
  coverArt?: string;
  platform: RecordingPlatform;
  recordingType: RecordingType;
  /** Whether this is the primary/featured DJ set for the artist */
  isPrimaryDjSet?: boolean;
}

interface TrackInputFormProps {
  onAddTrack: (track: TrackFormData) => void;
  onCancel?: () => void;
  showCancelButton?: boolean;
  submitButtonText?: string;
  /** Track to edit - when provided, form will be in edit mode */
  editingTrack?: TrackFormData | null;
  /** Called when editing is complete */
  onEditComplete?: (track: TrackFormData) => void;
}

// Parse platform from URL
function detectPlatform(url: string): RecordingPlatform | null {
  if (url.includes('spotify.com') || url.includes('open.spotify')) {
    return 'spotify';
  }
  if (url.includes('soundcloud.com')) {
    return 'soundcloud';
  }
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  }
  return null;
}

// Extract Spotify track ID from URL
function extractSpotifyTrackId(url: string): string | null {
  const match = url.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

// Fetch Spotify track metadata using oEmbed (no API key required)
async function fetchSpotifyMetadata(url: string): Promise<TrackMetadata | null> {
  try {
    const trackId = extractSpotifyTrackId(url);
    if (!trackId) return null;

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
  } catch (error) {
    logger.error('Error fetching Spotify metadata', {
      error: error instanceof Error ? error.message : 'Unknown',
      source: 'TrackInputForm'
    });
    return null;
  }
}

// Fetch SoundCloud track metadata using oEmbed
async function fetchSoundCloudMetadata(url: string): Promise<TrackMetadata | null> {
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
  } catch (error) {
    logger.error('Error fetching SoundCloud metadata', {
      error: error instanceof Error ? error.message : 'Unknown',
      source: 'TrackInputForm'
    });
    return null;
  }
}

// Fetch YouTube video metadata using oEmbed
async function fetchYouTubeMetadata(url: string): Promise<TrackMetadata | null> {
  try {
    const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(oEmbedUrl);

    if (!response.ok) {
      throw new Error('Failed to fetch YouTube metadata');
    }

    const data = await response.json();
    const name = data.title || 'Unknown Video';
    const artistName = data.author_name || 'Unknown Channel';

    return {
      name,
      coverArt: data.thumbnail_url,
      artistName,
      platform: 'youtube',
      url,
    };
  } catch (error) {
    logger.error('Error fetching YouTube metadata', {
      error: error instanceof Error ? error.message : 'Unknown',
      source: 'TrackInputForm'
    });
    return null;
  }
}

export function TrackInputForm({
  onAddTrack,
  onCancel,
  showCancelButton = false,
  submitButtonText,
  editingTrack,
  onEditComplete,
}: TrackInputFormProps) {
  const { t } = useTranslation('common');
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackData, setTrackData] = useState<TrackMetadata | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [recordingType, setRecordingType] = useState<RecordingType>('track');

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
        let metadata: TrackMetadata | null = null;

        if (platform === 'spotify') {
          metadata = await fetchSpotifyMetadata(url);
        } else if (platform === 'soundcloud') {
          metadata = await fetchSoundCloudMetadata(url);
        } else if (platform === 'youtube') {
          metadata = await fetchYouTubeMetadata(url);
        }

        if (metadata) {
          setTrackData(metadata);
          setError(null);
        } else {
          setError(t('formMessages.couldNotFetchTrack'));
          setTrackData(null);
        }
      } catch {
        setError(t('formMessages.failedToFetchTrack'));
        setTrackData(null);
      } finally {
        setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchMetadata, 500);
    return () => clearTimeout(timer);
  }, [url]);

  const handleLink = () => {
    if (!trackData) return;

    setIsLinking(true);

    if (isEditMode && editingTrack && onEditComplete) {
      // Edit mode - update existing track
      const updatedTrack: TrackFormData = {
        id: editingTrack.id,
        name: trackData.name,
        url: trackData.url,
        coverArt: trackData.coverArt,
        platform: trackData.platform,
        recordingType,
      };
      onEditComplete(updatedTrack);
    } else {
      // Add mode - create new track
      const newTrack: TrackFormData = {
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

  return (
    <div className="space-y-[20px]">
      {/* URL Input */}
      <div className="space-y-[10px]">
        <FmCommonTextField
          label={t('forms.tracks.urlLabel')}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={t('forms.tracks.urlPlaceholder')}
        />

        {/* Platform indicators */}
        <div className="flex items-center gap-[20px] text-xs text-muted-foreground">
          <span className="flex items-center gap-[5px]">
            <FaSpotify className={cn('h-4 w-4', platform === 'spotify' ? 'text-[#5aad7a]' : 'opacity-30')} />
            Spotify
          </span>
          <span className="flex items-center gap-[5px]">
            <FaSoundcloud className={cn('h-4 w-4', platform === 'soundcloud' ? 'text-[#d48968]' : 'opacity-30')} />
            SoundCloud
          </span>
          <span className="flex items-center gap-[5px]">
            <FaYoutube className={cn('h-4 w-4', platform === 'youtube' ? 'text-[#FF0000]' : 'opacity-30')} />
            YouTube
          </span>
        </div>
      </div>

      {/* Recording Type Selector */}
      {trackData && !isLoading && (
        <div className="space-y-[10px]">
          <label className="text-xs uppercase text-muted-foreground">{t('formLabels.recordingType')}</label>
          <div className="flex gap-[10px]">
            <button
              type="button"
              onClick={() => setRecordingType('track')}
              className={cn(
                'flex-1 flex items-center justify-center gap-[10px] px-[20px] py-[10px] border transition-all',
                recordingType === 'track'
                  ? 'border-fm-gold bg-fm-gold/10 text-fm-gold'
                  : 'border-white/20 hover:border-white/40 text-muted-foreground'
              )}
            >
              <Disc className="h-4 w-4" />
              <span className="font-medium">{t('formLabels.track')}</span>
            </button>
            <button
              type="button"
              onClick={() => setRecordingType('dj_set')}
              className={cn(
                'flex-1 flex items-center justify-center gap-[10px] px-[20px] py-[10px] border transition-all',
                recordingType === 'dj_set'
                  ? 'border-fm-gold bg-fm-gold/10 text-fm-gold'
                  : 'border-white/20 hover:border-white/40 text-muted-foreground'
              )}
            >
              <Radio className="h-4 w-4" />
              <span className="font-medium">{t('formLabels.djSet')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-[40px]">
          <FmCommonLoadingSpinner size="md" />
          <span className="ml-[10px] text-muted-foreground">{t('formMessages.fetchingTrackInfo')}</span>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="flex items-center gap-[10px] p-[20px] bg-red-500/10 border border-red-500/30 text-red-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Track Preview */}
      {trackData && !isLoading && (
        <FmCommonCard variant="default" className="p-0 overflow-hidden">
          <div className="flex gap-[20px]">
            {/* Cover Art */}
            <div className="w-24 h-24 flex-shrink-0 relative">
              {trackData.coverArt ? (
                <img
                  src={trackData.coverArt}
                  alt={trackData.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-fm-gold/20 to-fm-gold/5 flex items-center justify-center">
                  <Music className="h-8 w-8 text-fm-gold/50" />
                </div>
              )}
              {/* Platform badge */}
              <div className="absolute bottom-1 right-1">
                {trackData.platform === 'spotify' && (
                  <FaSpotify className="h-5 w-5 text-[#5aad7a] drop-shadow-lg" />
                )}
                {trackData.platform === 'soundcloud' && (
                  <FaSoundcloud className="h-5 w-5 text-[#d48968] drop-shadow-lg" />
                )}
                {trackData.platform === 'youtube' && (
                  <FaYoutube className="h-5 w-5 text-[#FF0000] drop-shadow-lg" />
                )}
              </div>
            </div>

            {/* Track Info */}
            <div className="flex-1 py-[10px] pr-[20px]">
              <h3 className="font-semibold text-base line-clamp-1 mb-[5px]">
                {trackData.name}
              </h3>
              {trackData.artistName && (
                <p className="text-sm text-muted-foreground mb-[10px]">
                  {trackData.artistName}
                </p>
              )}
              <div className="flex items-center gap-[20px] text-xs text-muted-foreground">
                <a
                  href={trackData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-[5px] hover:text-fm-gold transition-colors"
                >
                  <ExternalLink className="h-3 w-3" />
                  {t('forms.tracks.preview')}
                </a>
              </div>
            </div>
          </div>
        </FmCommonCard>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-[10px]">
        {(showCancelButton || isEditMode) && onCancel && (
          <FmCommonButton
            variant="secondary"
            onClick={onCancel}
          >
            {t('buttons.cancel')}
          </FmCommonButton>
        )}
        <FmCommonButton
          icon={Link2}
          onClick={handleLink}
          disabled={!trackData || isLoading || isLinking}
        >
          {isLinking
            ? (isEditMode ? t('forms.tracks.saving') : t('forms.tracks.adding'))
            : (isEditMode ? t('formActions.saveChanges') : defaultSubmitText)
          }
        </FmCommonButton>
      </div>
    </div>
  );
}

// Component to display added tracks
interface TrackListProps {
  tracks: TrackFormData[];
  onRemoveTrack: (trackId: string) => void;
  onEditTrack?: (track: TrackFormData) => void;
  onSetPrimaryDjSet?: (trackId: string) => void;
  editingTrackId?: string | null;
}

export function TrackList({ tracks, onRemoveTrack, onEditTrack, onSetPrimaryDjSet, editingTrackId }: TrackListProps) {
  const { t } = useTranslation('common');

  if (tracks.length === 0) return null;

  // Check if there are multiple DJ sets (only show primary selection if more than one)
  const djSetCount = tracks.filter(t => t.recordingType === 'dj_set').length;
  const showPrimaryOption = djSetCount > 1 && !!onSetPrimaryDjSet;

  return (
    <div className="space-y-[10px]">
      <label className="text-xs uppercase text-muted-foreground">{t('forms.tracks.addedRecordings', { count: tracks.length })}</label>
      <div className="space-y-[10px]">
        {tracks.map((track) => {
          const isEditing = editingTrackId === track.id;
          const isDjSet = track.recordingType === 'dj_set';
          const isPrimary = track.isPrimaryDjSet;

          return (
            <FmCommonCard
              key={track.id}
              variant="default"
              className={cn(
                "p-0 overflow-hidden transition-all duration-200",
                isEditing && "border-fm-gold/50 bg-fm-gold/5",
                isPrimary && isDjSet && "border-fm-gold/30 bg-fm-gold/5"
              )}
            >
              <div className="flex gap-[10px] items-center">
                {/* Cover Art */}
                <div className="w-16 h-16 flex-shrink-0 relative">
                  {track.coverArt ? (
                    <img
                      src={track.coverArt}
                      alt={track.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-fm-gold/20 to-fm-gold/5 flex items-center justify-center">
                      <Music className="h-6 w-6 text-fm-gold/50" />
                    </div>
                  )}
                  {/* Platform badge */}
                  <div className="absolute bottom-0.5 right-0.5">
                    {track.platform === 'spotify' && (
                      <FaSpotify className="h-4 w-4 text-[#5aad7a] drop-shadow-lg" />
                    )}
                    {track.platform === 'soundcloud' && (
                      <FaSoundcloud className="h-4 w-4 text-[#d48968] drop-shadow-lg" />
                    )}
                    {track.platform === 'youtube' && (
                      <FaYoutube className="h-4 w-4 text-[#FF0000] drop-shadow-lg" />
                    )}
                  </div>
                  {/* Primary badge */}
                  {isPrimary && isDjSet && (
                    <div className="absolute top-0.5 left-0.5">
                      <Star className="h-4 w-4 text-fm-gold fill-fm-gold drop-shadow-lg" />
                    </div>
                  )}
                </div>

                {/* Track Info */}
                <div className="flex-1 py-[10px]">
                  <div className="flex items-center gap-[5px]">
                    <h4 className="font-medium text-sm line-clamp-1">{track.name}</h4>
                    {isPrimary && isDjSet && (
                      <span className="text-[10px] uppercase text-fm-gold font-medium px-[5px] py-[1px] bg-fm-gold/10 border border-fm-gold/30">
                        {t('formLabels.primary')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isDjSet ? t('formLabels.djSet') : t('formLabels.track')}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-[5px] mr-[10px]">
                  {/* Set as Primary button - only for DJ sets when there are multiple */}
                  {showPrimaryOption && isDjSet && !isPrimary && (
                    <button
                      onClick={() => onSetPrimaryDjSet(track.id)}
                      className="p-[10px] text-muted-foreground hover:text-fm-gold transition-colors"
                      aria-label={t('aria.setAsPrimary')}
                      title={t('forms.tracks.setAsPrimary')}
                    >
                      <Star className="h-4 w-4" />
                    </button>
                  )}
                  {onEditTrack && (
                    <button
                      onClick={() => onEditTrack(track)}
                      className={cn(
                        "p-[10px] transition-colors",
                        isEditing
                          ? "text-fm-gold"
                          : "text-muted-foreground hover:text-fm-gold"
                      )}
                      aria-label={t('aria.editTrack')}
                    >
                      {isEditing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                    </button>
                  )}
                  <button
                    onClick={() => onRemoveTrack(track.id)}
                    className="p-[10px] text-muted-foreground hover:text-red-400 transition-colors"
                    aria-label={t('aria.removeTrack')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </FmCommonCard>
          );
        })}
      </div>
    </div>
  );
}

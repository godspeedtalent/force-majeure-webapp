/**
 * AddTrackModal Component
 *
 * Modal for adding a track to an artist by pasting a Spotify or SoundCloud URL.
 * Fetches and parses track metadata from the URL, displays a preview,
 * and allows linking the track to the artist.
 */

import { useState, useEffect } from 'react';
import { Link2, Music, ExternalLink, AlertCircle, Disc, Radio } from 'lucide-react';
import { FaSpotify, FaSoundcloud } from 'react-icons/fa6';
import { FmCommonModal } from '@/components/common/modals/FmCommonModal';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { cn } from '@/shared/utils/utils';
import type { ArtistTrack, RecordingType } from '@/pages/artists/ArtistManagement';

interface TrackMetadata {
  name: string;
  coverArt?: string;
  artistName?: string;
  platform: 'spotify' | 'soundcloud';
  url: string;
}

interface AddTrackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTrack: (track: ArtistTrack) => void;
}

// Parse platform from URL
function detectPlatform(url: string): 'spotify' | 'soundcloud' | null {
  if (url.includes('spotify.com') || url.includes('open.spotify')) {
    return 'spotify';
  }
  if (url.includes('soundcloud.com')) {
    return 'soundcloud';
  }
  return null;
}

// Extract Spotify track ID from URL
function extractSpotifyTrackId(url: string): string | null {
  // Handle URLs like:
  // https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh
  // https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh?si=xxx
  const match = url.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

// Fetch Spotify track metadata using oEmbed (no API key required)
async function fetchSpotifyMetadata(url: string): Promise<TrackMetadata | null> {
  try {
    const trackId = extractSpotifyTrackId(url);
    if (!trackId) return null;

    // Use Spotify oEmbed endpoint
    const oEmbedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
    const response = await fetch(oEmbedUrl);

    if (!response.ok) {
      throw new Error('Failed to fetch Spotify metadata');
    }

    const data = await response.json();

    // oEmbed returns: title, thumbnail_url, html (embed code)
    // Title format is usually "Song Name - Artist Name"
    const [name, artistName] = data.title?.split(' - ') || [data.title, 'Unknown Artist'];

    return {
      name: name || 'Unknown Track',
      coverArt: data.thumbnail_url,
      artistName: artistName,
      platform: 'spotify',
      url: `https://open.spotify.com/track/${trackId}`,
    };
  } catch (error) {
    console.error('Error fetching Spotify metadata:', error);
    return null;
  }
}

// Fetch SoundCloud track metadata using oEmbed
async function fetchSoundCloudMetadata(url: string): Promise<TrackMetadata | null> {
  try {
    // Use SoundCloud oEmbed endpoint
    const oEmbedUrl = `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(url)}`;
    const response = await fetch(oEmbedUrl);

    if (!response.ok) {
      throw new Error('Failed to fetch SoundCloud metadata');
    }

    const data = await response.json();

    // Parse title - usually "Track Name by Artist Name"
    let name = data.title || 'Unknown Track';
    const artistName = data.author_name || 'Unknown Artist';

    // If title includes "by", extract track name
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
    console.error('Error fetching SoundCloud metadata:', error);
    return null;
  }
}

export function AddTrackModal({ open, onOpenChange, onAddTrack }: AddTrackModalProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackData, setTrackData] = useState<TrackMetadata | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [recordingType, setRecordingType] = useState<RecordingType>('track');

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setUrl('');
      setTrackData(null);
      setError(null);
      setIsLoading(false);
      setRecordingType('track');
    }
  }, [open]);

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
        setError('Please enter a valid Spotify or SoundCloud URL');
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
        }

        if (metadata) {
          setTrackData(metadata);
          setError(null);
        } else {
          setError('Could not fetch track information. Please check the URL.');
          setTrackData(null);
        }
      } catch {
        setError('Failed to fetch track metadata');
        setTrackData(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce the fetch
    const timer = setTimeout(fetchMetadata, 500);
    return () => clearTimeout(timer);
  }, [url]);

  const handleLink = () => {
    if (!trackData) return;

    setIsLinking(true);

    const newTrack: ArtistTrack = {
      id: crypto.randomUUID(),
      name: trackData.name,
      url: trackData.url,
      coverArt: trackData.coverArt,
      platform: trackData.platform,
      recordingType,
      addedAt: new Date().toISOString(),
      clickCount: 0,
    };

    onAddTrack(newTrack);
    setIsLinking(false);
    onOpenChange(false);
  };

  const platform = url ? detectPlatform(url) : null;

  return (
    <FmCommonModal
      open={open}
      onOpenChange={onOpenChange}
      title="Add Recording"
      description="Paste a Spotify or SoundCloud URL to link it to this artist."
    >
      <div className="space-y-6">
        {/* URL Input */}
        <div className="space-y-2">
          <FmCommonTextField
            label="Track URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://open.spotify.com/track/... or https://soundcloud.com/..."
          />

          {/* Platform indicators */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <FaSpotify className={cn('h-4 w-4', platform === 'spotify' ? 'text-[#1DB954]' : 'opacity-30')} />
              Spotify
            </span>
            <span className="flex items-center gap-1">
              <FaSoundcloud className={cn('h-4 w-4', platform === 'soundcloud' ? 'text-[#FF5500]' : 'opacity-30')} />
              SoundCloud
            </span>
          </div>
        </div>

        {/* Recording Type Selector */}
        {trackData && !isLoading && (
          <div className="space-y-2">
            <label className="text-xs uppercase text-muted-foreground">Recording Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRecordingType('track')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-3 border transition-all',
                  recordingType === 'track'
                    ? 'border-fm-gold bg-fm-gold/10 text-fm-gold'
                    : 'border-white/20 hover:border-white/40 text-muted-foreground'
                )}
              >
                <Disc className="h-4 w-4" />
                <span className="font-medium">Track</span>
              </button>
              <button
                type="button"
                onClick={() => setRecordingType('dj_set')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-4 py-3 border transition-all',
                  recordingType === 'dj_set'
                    ? 'border-fm-gold bg-fm-gold/10 text-fm-gold'
                    : 'border-white/20 hover:border-white/40 text-muted-foreground'
                )}
              >
                <Radio className="h-4 w-4" />
                <span className="font-medium">DJ Set</span>
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <FmCommonLoadingSpinner size="md" />
            <span className="ml-3 text-muted-foreground">Fetching track info...</span>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 text-red-400">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Track Preview */}
        {trackData && !isLoading && (
          <FmCommonCard variant="outline" className="p-0 overflow-hidden">
            <div className="flex gap-4">
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
                  {trackData.platform === 'spotify' ? (
                    <FaSpotify className="h-5 w-5 text-[#1DB954] drop-shadow-lg" />
                  ) : (
                    <FaSoundcloud className="h-5 w-5 text-[#FF5500] drop-shadow-lg" />
                  )}
                </div>
              </div>

              {/* Track Info */}
              <div className="flex-1 py-3 pr-4">
                <h3 className="font-semibold text-base line-clamp-1 mb-1">
                  {trackData.name}
                </h3>
                {trackData.artistName && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {trackData.artistName}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <a
                    href={trackData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-fm-gold transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Preview
                  </a>
                </div>
              </div>
            </div>
          </FmCommonCard>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <FmCommonButton
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </FmCommonButton>
          <FmCommonButton
            icon={Link2}
            onClick={handleLink}
            disabled={!trackData || isLoading || isLinking}
          >
            {isLinking ? 'Linking...' : 'Link Track'}
          </FmCommonButton>
        </div>
      </div>
    </FmCommonModal>
  );
}

/**
 * EditTrackModal Component
 *
 * Modal for editing an existing track's details, specifically the recording type.
 */

import { useState, useEffect } from 'react';
import { Save, Disc, Radio, ExternalLink, Music } from 'lucide-react';
import { FaSpotify, FaSoundcloud } from 'react-icons/fa6';
import { FmCommonModal } from '@/components/common/modals/FmCommonModal';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { cn } from '@force-majeure/shared';
import type { ArtistTrack, RecordingType } from '@/pages/artists/ArtistManagement';

interface EditTrackModalProps {
  track: ArtistTrack | null;
  onClose: () => void;
  onSave: (track: ArtistTrack) => void;
}

export function EditTrackModal({ track, onClose, onSave }: EditTrackModalProps) {
  const [recordingType, setRecordingType] = useState<RecordingType>('track');

  // Reset state when track changes
  useEffect(() => {
    if (track) {
      setRecordingType(track.recordingType || 'track');
    }
  }, [track]);

  const handleSave = () => {
    if (!track) return;

    onSave({
      ...track,
      recordingType,
    });
  };

  if (!track) return null;

  return (
    <FmCommonModal
      open={!!track}
      onOpenChange={(open) => !open && onClose()}
      title="Edit Recording"
      description="Update the recording type for this track."
    >
      <div className="space-y-6">
        {/* Track Preview */}
        <FmCommonCard variant="outline" className="p-0 overflow-hidden">
          <div className="flex gap-4">
            {/* Cover Art */}
            <div className="w-20 h-20 flex-shrink-0 relative">
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
              <div className="absolute bottom-1 right-1">
                {track.platform === 'spotify' ? (
                  <FaSpotify className="h-4 w-4 text-[#1DB954] drop-shadow-lg" />
                ) : (
                  <FaSoundcloud className="h-4 w-4 text-[#FF5500] drop-shadow-lg" />
                )}
              </div>
            </div>

            {/* Track Info */}
            <div className="flex-1 py-2 pr-4">
              <h3 className="font-semibold text-sm line-clamp-1 mb-1">
                {track.name}
              </h3>
              <p className="text-xs text-muted-foreground mb-2 capitalize">
                {track.platform}
              </p>
              <a
                href={track.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-fm-gold transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                Open Link
              </a>
            </div>
          </div>
        </FmCommonCard>

        {/* Recording Type Selector */}
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

        {/* Stats */}
        {track.clickCount !== undefined && track.clickCount > 0 && (
          <div className="text-sm text-muted-foreground">
            <span className="text-fm-gold font-medium">{track.clickCount}</span> link clicks
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <FmCommonButton
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </FmCommonButton>
          <FmCommonButton
            icon={Save}
            onClick={handleSave}
          >
            Save Changes
          </FmCommonButton>
        </div>
      </div>
    </FmCommonModal>
  );
}

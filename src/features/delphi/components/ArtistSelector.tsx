/**
 * ArtistSelector
 *
 * Component for selecting an artist in the Delphi forecast calculator.
 * Wraps FmArtistSearchDropdown with Delphi-specific styling and state handling.
 */

import { useTranslation } from 'react-i18next';
import { User, RefreshCw } from 'lucide-react';
import { FmArtistSearchDropdown } from '@/components/common/search/FmArtistSearchDropdown';
import { FmCommonCard, FmCommonCardContent } from '@/components/common/display/FmCommonCard';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import type { SelectedArtist } from '../hooks/useDelphiCalculator';

interface ArtistSelectorProps {
  /** Currently selected artist */
  selectedArtist: SelectedArtist | null;
  /** Called when artist selection changes */
  onArtistChange: (artist: SelectedArtist | null) => void;
  /** Whether stats are currently loading */
  isLoadingStats?: boolean;
  /** Whether stats are stale and can be refreshed */
  isStatsStale?: boolean;
  /** Called when user requests stats refresh */
  onRefreshStats?: () => void;
  /** Disabled state */
  disabled?: boolean;
}

export function ArtistSelector({
  selectedArtist,
  onArtistChange,
  isLoadingStats = false,
  isStatsStale = false,
  onRefreshStats,
  disabled = false,
}: ArtistSelectorProps) {
  const { t } = useTranslation('common');

  const handleArtistChange = (
    artistId: string,
    artist?: { id: string; name: string; image_url: string | null }
  ) => {
    if (artist) {
      onArtistChange({ id: artist.id, name: artist.name });
    } else if (artistId) {
      // If we only have the ID, set with empty name (will be populated by stats hook)
      onArtistChange({ id: artistId, name: '' });
    } else {
      onArtistChange(null);
    }
  };

  return (
    <FmCommonCard className="border border-white/10">
      <FmCommonCardContent className="p-[20px]">
        <div className="space-y-[10px]">
          {/* Label */}
          <label className="text-xs uppercase text-muted-foreground font-medium">
            {t('labels.selectArtist', 'Select Artist')}
          </label>

          {/* Search Dropdown */}
          <div className="flex items-center gap-[10px]">
            <div className="flex-1">
              <FmArtistSearchDropdown
                value={selectedArtist?.id || null}
                onChange={handleArtistChange}
                placeholder={t('placeholders.searchArtist', 'Search for an artist...')}
                disabled={disabled}
              />
            </div>

            {/* Refresh button (shown when artist selected and stats are stale) */}
            {selectedArtist && isStatsStale && onRefreshStats && (
              <FmCommonButton
                variant="secondary"
                size="sm"
                onClick={onRefreshStats}
                disabled={isLoadingStats}
                className="shrink-0"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isLoadingStats ? 'animate-spin' : ''}`}
                />
              </FmCommonButton>
            )}
          </div>

          {/* Selected artist display */}
          {selectedArtist && (
            <div className="flex items-center gap-[10px] mt-[10px] p-[10px] bg-white/5 rounded-none border border-white/10">
              <div className="h-10 w-10 rounded-full bg-fm-gold/20 flex items-center justify-center shrink-0">
                <User className="h-5 w-5 text-fm-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{selectedArtist.name}</p>
                <p className="text-xs text-muted-foreground">
                  {isLoadingStats
                    ? t('status.loadingStats', 'Loading stats...')
                    : isStatsStale
                      ? t('status.statsStale', 'Stats may be outdated')
                      : t('status.statsLoaded', 'Stats loaded')}
                </p>
              </div>
            </div>
          )}

          {/* Help text when no artist selected */}
          {!selectedArtist && (
            <p className="text-xs text-muted-foreground">
              {t(
                'help.selectArtistForForecast',
                'Search and select an artist to load their social media stats and generate ticket sales projections.'
              )}
            </p>
          )}
        </div>
      </FmCommonCardContent>
    </FmCommonCard>
  );
}

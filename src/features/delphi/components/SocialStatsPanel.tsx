/**
 * SocialStatsPanel
 *
 * Displays and allows editing of social media statistics for an artist.
 * Shows which stats are auto-fetched vs manually entered.
 */

import { useTranslation } from 'react-i18next';
import { Music2, Instagram, AudioLines } from 'lucide-react';
import { FmCommonCard, FmCommonCardContent } from '@/components/common/display/FmCommonCard';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { ArtistSocialStats, SOCIAL_METRICS, SocialMetricDefinition } from '../types/socialStats';
import type { MetricId } from '../hooks/useDelphiCalculator';

interface SocialStatsPanelProps {
  /** Current social stats */
  stats: ArtistSocialStats | null;
  /** Whether stats are loading */
  isLoading?: boolean;
  /** Called when a stat value changes */
  onStatChange: (metricId: MetricId, value: number | null) => void;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Get icon for a platform
 */
function getPlatformIcon(platform: SocialMetricDefinition['platform']) {
  switch (platform) {
    case 'spotify':
      return <Music2 className="h-4 w-4 text-green-400" />;
    case 'soundcloud':
      return <AudioLines className="h-4 w-4 text-orange-400" />;
    case 'instagram':
      return <Instagram className="h-4 w-4 text-pink-400" />;
    case 'tiktok':
      return (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
        </svg>
      );
    default:
      return null;
  }
}

/**
 * Format large numbers with K/M suffix
 */
function formatNumber(value: number | null): string {
  if (value === null) return '';
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
}

/**
 * Parse input string to number
 */
function parseNumberInput(value: string): number | null {
  if (!value || value.trim() === '') return null;
  const num = parseInt(value.replace(/[^0-9]/g, ''), 10);
  return isNaN(num) ? null : num;
}

export function SocialStatsPanel({
  stats,
  isLoading = false,
  onStatChange,
  disabled = false,
}: SocialStatsPanelProps) {
  const { t } = useTranslation('common');

  if (isLoading) {
    return (
      <FmCommonCard className="border border-white/10">
        <FmCommonCardContent className="p-[20px]">
          <div className="animate-pulse space-y-[10px]">
            <div className="h-4 bg-white/10 rounded w-1/3" />
            <div className="grid grid-cols-2 gap-[10px]">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-12 bg-white/5 rounded" />
              ))}
            </div>
          </div>
        </FmCommonCardContent>
      </FmCommonCard>
    );
  }

  return (
    <FmCommonCard className="border border-white/10">
      <FmCommonCardContent className="p-[20px]">
        <div className="space-y-[20px]">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">
              {t('delphi.socialStats', 'Social Media Stats')}
            </h3>
            <span className="text-xs text-muted-foreground">
              {t('delphi.editableFields', 'All fields are editable')}
            </span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[10px]">
            {SOCIAL_METRICS.map((metric) => {
              const metricId = metric.id as MetricId;
              const value = stats?.[metricId] ?? null;

              return (
                <div key={metricId} className="relative">
                  <div className="absolute left-[10px] top-[10px] z-10">
                    {getPlatformIcon(metric.platform)}
                  </div>
                  <FmCommonTextField
                    label={metric.label}
                    value={value !== null ? value.toString() : ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      onStatChange(metricId, parseNumberInput(e.target.value))
                    }
                    placeholder="0"
                    disabled={disabled}
                    type="text"
                    inputMode="numeric"
                    className="pl-[36px]"
                  />
                  {/* Source indicator */}
                  <div className="absolute right-[10px] top-[10px]">
                    <span
                      className={`text-[10px] uppercase ${
                        metric.source === 'api' ? 'text-green-400' : 'text-yellow-400'
                      }`}
                      title={
                        metric.source === 'api'
                          ? t('delphi.autoFetched', 'Auto-fetched from API')
                          : t('delphi.manualEntry', 'Manual entry')
                      }
                    >
                      {metric.source === 'api' ? 'API' : 'Manual'}
                    </span>
                  </div>
                  {/* Description */}
                  <p className="text-[10px] text-muted-foreground mt-[5px] px-[10px]">
                    {metric.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          {stats && (
            <div className="pt-[10px] border-t border-white/10">
              <div className="flex flex-wrap gap-[20px] text-xs text-muted-foreground">
                {SOCIAL_METRICS.map((metric) => {
                  const value = stats[metric.id as MetricId];
                  if (value === null || value === 0) return null;
                  return (
                    <span key={metric.id} className="flex items-center gap-[5px]">
                      {getPlatformIcon(metric.platform)}
                      <span className="text-white font-medium">{formatNumber(value)}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </FmCommonCardContent>
    </FmCommonCard>
  );
}

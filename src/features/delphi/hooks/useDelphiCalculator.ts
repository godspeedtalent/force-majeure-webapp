/**
 * useDelphiCalculator
 *
 * Main state management hook for the Delphi forecast calculator.
 * Manages:
 * - Selected artist
 * - Conversion rates per metric and scenario
 * - Computed projections
 */

import { useState, useMemo, useCallback } from 'react';
import { useArtistSocialStats } from './useArtistSocialStats';
import { ArtistSocialStats, SOCIAL_METRICS } from '../types/socialStats';

// ============================================================================
// Types
// ============================================================================

/** Scenario types for conversion rates */
export type ForecastScenario = 'conservative' | 'moderate' | 'high';

/** Metric IDs that can have conversion rates */
export type MetricId =
  | 'spotifyLocalListeners'
  | 'spotifyRegionalListeners'
  | 'spotifyFollowers'
  | 'soundcloudFollowers'
  | 'instagramFollowers'
  | 'tiktokFollowers';

/** Conversion rates for all metrics in all scenarios */
export type ConversionRates = {
  [K in MetricId]: {
    [S in ForecastScenario]: number; // Rate as decimal (e.g., 0.01 = 1%)
  };
};

/** Result for a single metric in a scenario */
export interface MetricProjection {
  metricId: MetricId;
  metricLabel: string;
  metricValue: number;
  conversionRate: number;
  projectedTickets: number;
}

/** Full projection result for a scenario */
export interface ScenarioProjection {
  scenario: ForecastScenario;
  totalProjectedTickets: number;
  breakdown: MetricProjection[];
}

/** Selected artist info */
export interface SelectedArtist {
  id: string;
  name: string;
}

// ============================================================================
// Default Values
// ============================================================================

/** Default conversion rates (as decimals) */
const DEFAULT_CONVERSION_RATES: ConversionRates = {
  spotifyLocalListeners: { conservative: 0.001, moderate: 0.005, high: 0.01 },
  spotifyRegionalListeners: { conservative: 0.0005, moderate: 0.002, high: 0.005 },
  spotifyFollowers: { conservative: 0.0001, moderate: 0.0005, high: 0.001 },
  soundcloudFollowers: { conservative: 0.0005, moderate: 0.002, high: 0.005 },
  instagramFollowers: { conservative: 0.0002, moderate: 0.001, high: 0.003 },
  tiktokFollowers: { conservative: 0.0001, moderate: 0.0005, high: 0.001 },
};

// ============================================================================
// Hook
// ============================================================================

export interface UseDelphiCalculatorResult {
  // Artist selection
  selectedArtist: SelectedArtist | null;
  setSelectedArtist: (artist: SelectedArtist | null) => void;

  // Social stats (from useArtistSocialStats)
  socialStats: ArtistSocialStats | null;
  isLoadingStats: boolean;
  statsError: Error | null;
  isStatsStale: boolean;
  updateStat: (field: MetricId, value: number | null) => Promise<void>;

  // Conversion rates
  conversionRates: ConversionRates;
  setConversionRate: (metricId: MetricId, scenario: ForecastScenario, rate: number) => void;
  resetConversionRates: () => void;

  // Projections
  projections: {
    conservative: ScenarioProjection;
    moderate: ScenarioProjection;
    high: ScenarioProjection;
  };

  // UI helpers
  hasAnyStats: boolean;
  canCalculate: boolean;
}

/**
 * Main calculator hook for Delphi forecasting
 */
export function useDelphiCalculator(): UseDelphiCalculatorResult {
  // Selected artist state
  const [selectedArtist, setSelectedArtist] = useState<SelectedArtist | null>(null);

  // Conversion rates state
  const [conversionRates, setConversionRates] = useState<ConversionRates>(DEFAULT_CONVERSION_RATES);

  // Fetch social stats for selected artist
  const {
    stats: socialStats,
    isLoading: isLoadingStats,
    error: statsError,
    isStale: isStatsStale,
    updateStat: updateStatInternal,
  } = useArtistSocialStats(selectedArtist?.id);

  // Update a single conversion rate
  const setConversionRate = useCallback(
    (metricId: MetricId, scenario: ForecastScenario, rate: number) => {
      setConversionRates((prev) => ({
        ...prev,
        [metricId]: {
          ...prev[metricId],
          [scenario]: rate,
        },
      }));
    },
    []
  );

  // Reset conversion rates to defaults
  const resetConversionRates = useCallback(() => {
    setConversionRates(DEFAULT_CONVERSION_RATES);
  }, []);

  // Wrapper for updateStat that uses our MetricId type
  const updateStat = useCallback(
    async (field: MetricId, value: number | null) => {
      await updateStatInternal(field, value);
    },
    [updateStatInternal]
  );

  // Check if we have any stats to work with
  const hasAnyStats = useMemo(() => {
    if (!socialStats) return false;
    return (
      socialStats.spotifyLocalListeners !== null ||
      socialStats.spotifyRegionalListeners !== null ||
      socialStats.spotifyFollowers !== null ||
      socialStats.soundcloudFollowers !== null ||
      socialStats.instagramFollowers !== null ||
      socialStats.tiktokFollowers !== null
    );
  }, [socialStats]);

  // Can we calculate projections?
  const canCalculate = Boolean(selectedArtist && hasAnyStats);

  // Calculate projections for a single scenario
  const calculateScenarioProjection = useCallback(
    (scenario: ForecastScenario): ScenarioProjection => {
      const breakdown: MetricProjection[] = [];
      let totalProjectedTickets = 0;

      if (!socialStats) {
        return { scenario, totalProjectedTickets: 0, breakdown: [] };
      }

      // Process each metric
      for (const metric of SOCIAL_METRICS) {
        const metricId = metric.id as MetricId;
        const metricValue = socialStats[metricId];

        if (metricValue !== null && metricValue > 0) {
          const rate = conversionRates[metricId][scenario];
          const projectedTickets = Math.round(metricValue * rate);

          breakdown.push({
            metricId,
            metricLabel: metric.label,
            metricValue,
            conversionRate: rate,
            projectedTickets,
          });

          totalProjectedTickets += projectedTickets;
        }
      }

      return {
        scenario,
        totalProjectedTickets,
        breakdown,
      };
    },
    [socialStats, conversionRates]
  );

  // Calculate all projections
  const projections = useMemo(
    () => ({
      conservative: calculateScenarioProjection('conservative'),
      moderate: calculateScenarioProjection('moderate'),
      high: calculateScenarioProjection('high'),
    }),
    [calculateScenarioProjection]
  );

  return {
    // Artist selection
    selectedArtist,
    setSelectedArtist,

    // Social stats
    socialStats,
    isLoadingStats,
    statsError,
    isStatsStale,
    updateStat,

    // Conversion rates
    conversionRates,
    setConversionRate,
    resetConversionRates,

    // Projections
    projections,

    // UI helpers
    hasAnyStats,
    canCalculate,
  };
}

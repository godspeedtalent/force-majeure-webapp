/**
 * ForecastResults
 *
 * Displays the projected ticket sales for conservative, moderate, and high scenarios.
 * Shows a breakdown of contributions from each metric.
 */

import { useTranslation } from 'react-i18next';
import { TrendingUp, Ticket, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { FmCommonCard, FmCommonCardContent } from '@/components/common/display/FmCommonCard';
import type { ScenarioProjection, ForecastScenario } from '../hooks/useDelphiCalculator';

interface ForecastResultsProps {
  /** Projections for all scenarios */
  projections: {
    conservative: ScenarioProjection;
    moderate: ScenarioProjection;
    high: ScenarioProjection;
  };
  /** Whether there's enough data to show results */
  canCalculate: boolean;
  /** Artist name for display */
  artistName?: string;
}

const SCENARIO_CONFIG: Record<
  ForecastScenario,
  { label: string; bgColor: string; borderColor: string; textColor: string; icon: string }
> = {
  conservative: {
    label: 'Conservative',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-400',
    icon: '📉',
  },
  moderate: {
    label: 'Moderate',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    textColor: 'text-yellow-400',
    icon: '📊',
  },
  high: {
    label: 'High',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    textColor: 'text-green-400',
    icon: '📈',
  },
};

/**
 * Format number with commas
 */
function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Format percentage
 */
function formatPercentage(decimal: number): string {
  return `${(decimal * 100).toFixed(2)}%`;
}

/**
 * Single scenario result card
 */
function ScenarioCard({ projection }: { projection: ScenarioProjection }) {
  const { t } = useTranslation('common');
  const [showBreakdown, setShowBreakdown] = useState(false);
  const config = SCENARIO_CONFIG[projection.scenario];

  return (
    <FmCommonCard className={`border ${config.borderColor} ${config.bgColor}`}>
      <FmCommonCardContent className="p-[20px]">
        <div className="space-y-[10px]">
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${config.textColor}`}>
              {t(`delphi.${projection.scenario}`, config.label)}
            </span>
            <span className="text-lg">{config.icon}</span>
          </div>

          {/* Total */}
          <div className="flex items-baseline gap-[10px]">
            <Ticket className="h-5 w-5 text-fm-gold" />
            <span className="text-3xl font-bold text-white">
              {formatNumber(projection.totalProjectedTickets)}
            </span>
            <span className="text-sm text-muted-foreground">
              {t('delphi.ticketsSold', 'tickets')}
            </span>
          </div>

          {/* Breakdown toggle */}
          {projection.breakdown.length > 0 && (
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="flex items-center gap-[5px] text-xs text-muted-foreground hover:text-white transition-colors"
            >
              {showBreakdown ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  {t('actions.hideBreakdown', 'Hide breakdown')}
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  {t('actions.showBreakdown', 'Show breakdown')}
                </>
              )}
            </button>
          )}

          {/* Breakdown */}
          {showBreakdown && projection.breakdown.length > 0 && (
            <div className="pt-[10px] border-t border-white/10 space-y-[5px]">
              {projection.breakdown.map((item) => (
                <div
                  key={item.metricId}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-muted-foreground">{item.metricLabel}</span>
                  <div className="flex items-center gap-[10px]">
                    <span className="text-muted-foreground">
                      {formatNumber(item.metricValue)} × {formatPercentage(item.conversionRate)}
                    </span>
                    <span className="text-white font-medium">
                      = {formatNumber(item.projectedTickets)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </FmCommonCardContent>
    </FmCommonCard>
  );
}

export function ForecastResults({
  projections,
  canCalculate,
  artistName,
}: ForecastResultsProps) {
  const { t } = useTranslation('common');

  if (!canCalculate) {
    return (
      <FmCommonCard className="border border-white/10 border-dashed">
        <FmCommonCardContent className="p-[40px]">
          <div className="text-center space-y-[10px]">
            <TrendingUp className="h-8 w-8 text-muted-foreground mx-auto" />
            <h3 className="text-sm font-medium text-white">
              {t('delphi.noProjectionsYet', 'No projections yet')}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {t(
                'delphi.selectArtistAndEnterStats',
                'Select an artist and enter their social media stats to generate ticket sales projections.'
              )}
            </p>
          </div>
        </FmCommonCardContent>
      </FmCommonCard>
    );
  }

  return (
    <div className="space-y-[20px]">
      {/* Header */}
      <div className="flex items-center gap-[10px]">
        <TrendingUp className="h-5 w-5 text-fm-gold" />
        <h3 className="text-lg font-medium text-white">
          {t('delphi.projectedTicketSales', 'Projected Ticket Sales')}
        </h3>
        {artistName && (
          <span className="text-sm text-muted-foreground">for {artistName}</span>
        )}
      </div>

      {/* Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[20px]">
        <ScenarioCard projection={projections.conservative} />
        <ScenarioCard projection={projections.moderate} />
        <ScenarioCard projection={projections.high} />
      </div>

      {/* Range Summary */}
      <div className="text-center text-sm text-muted-foreground">
        {t('delphi.expectedRange', 'Expected range')}:{' '}
        <span className="text-white font-medium">
          {formatNumber(projections.conservative.totalProjectedTickets)}
        </span>
        {' – '}
        <span className="text-white font-medium">
          {formatNumber(projections.high.totalProjectedTickets)}
        </span>
        {' '}
        {t('delphi.tickets', 'tickets')}
      </div>
    </div>
  );
}

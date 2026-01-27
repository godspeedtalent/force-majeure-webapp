/**
 * ConversionRatesPanel
 *
 * Component for configuring conversion rates for each metric across
 * conservative, moderate, and high scenarios.
 */

import { useTranslation } from 'react-i18next';
import { Settings2, RotateCcw } from 'lucide-react';
import { FmCommonCard, FmCommonCardContent } from '@/components/common/display/FmCommonCard';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { SOCIAL_METRICS } from '../types/socialStats';
import type { ConversionRates, MetricId, ForecastScenario } from '../hooks/useDelphiCalculator';

interface ConversionRatesPanelProps {
  /** Current conversion rates */
  conversionRates: ConversionRates;
  /** Called when a rate changes */
  onRateChange: (metricId: MetricId, scenario: ForecastScenario, rate: number) => void;
  /** Called to reset all rates to defaults */
  onResetRates: () => void;
  /** Disabled state */
  disabled?: boolean;
}

const SCENARIOS: { id: ForecastScenario; label: string; color: string }[] = [
  { id: 'conservative', label: 'Conservative', color: 'text-blue-400' },
  { id: 'moderate', label: 'Moderate', color: 'text-yellow-400' },
  { id: 'high', label: 'High', color: 'text-green-400' },
];

/**
 * Convert decimal to percentage string
 */
function toPercentage(decimal: number): string {
  return (decimal * 100).toFixed(2);
}

/**
 * Convert percentage string to decimal
 */
function fromPercentage(percentage: string): number {
  const num = parseFloat(percentage);
  if (isNaN(num)) return 0;
  return num / 100;
}

export function ConversionRatesPanel({
  conversionRates,
  onRateChange,
  onResetRates,
  disabled = false,
}: ConversionRatesPanelProps) {
  const { t } = useTranslation('common');

  return (
    <FmCommonCard className="border border-white/10">
      <FmCommonCardContent className="p-[20px]">
        <div className="space-y-[20px]">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[10px]">
              <Settings2 className="h-4 w-4 text-fm-gold" />
              <h3 className="text-sm font-medium text-white">
                {t('delphi.conversionRates', 'Conversion Rates')}
              </h3>
            </div>
            <FmCommonButton
              variant="secondary"
              size="sm"
              onClick={onResetRates}
              disabled={disabled}
            >
              <RotateCcw className="h-3 w-3 mr-[5px]" />
              {t('actions.resetToDefaults', 'Reset')}
            </FmCommonButton>
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground">
            {t(
              'delphi.conversionRatesDescription',
              'Set the percentage of followers/listeners expected to convert to ticket sales for each scenario.'
            )}
          </p>

          {/* Rates Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-[10px] px-[5px] text-xs text-muted-foreground font-medium">
                    {t('labels.metric', 'Metric')}
                  </th>
                  {SCENARIOS.map((scenario) => (
                    <th
                      key={scenario.id}
                      className={`text-center py-[10px] px-[5px] text-xs font-medium ${scenario.color}`}
                    >
                      {t(`delphi.${scenario.id}`, scenario.label)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SOCIAL_METRICS.map((metric) => {
                  const metricId = metric.id as MetricId;
                  return (
                    <tr key={metricId} className="border-b border-white/5">
                      <td className="py-[10px] px-[5px]">
                        <span className="text-white text-xs">{metric.label}</span>
                      </td>
                      {SCENARIOS.map((scenario) => (
                        <td key={scenario.id} className="py-[10px] px-[5px]">
                          <div className="flex items-center justify-center">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={toPercentage(conversionRates[metricId][scenario.id])}
                              onChange={(e) =>
                                onRateChange(metricId, scenario.id, fromPercentage(e.target.value))
                              }
                              disabled={disabled}
                              className="w-[70px] bg-white/5 border border-white/10 rounded-none px-[8px] py-[4px] text-center text-xs text-white focus:border-fm-gold focus:outline-none disabled:opacity-50"
                            />
                            <span className="text-xs text-muted-foreground ml-[2px]">%</span>
                          </div>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Help text */}
          <div className="text-[10px] text-muted-foreground space-y-[5px]">
            <p>
              <span className="text-blue-400 font-medium">Conservative:</span>{' '}
              {t('delphi.conservativeDescription', 'Pessimistic estimate - lower bound')}
            </p>
            <p>
              <span className="text-yellow-400 font-medium">Moderate:</span>{' '}
              {t('delphi.moderateDescription', 'Realistic estimate - expected outcome')}
            </p>
            <p>
              <span className="text-green-400 font-medium">High:</span>{' '}
              {t('delphi.highDescription', 'Optimistic estimate - upper bound')}
            </p>
          </div>
        </div>
      </FmCommonCardContent>
    </FmCommonCard>
  );
}

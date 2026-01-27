/**
 * DelphiRoot - Main Entry Component for Delphi
 *
 * This is the root component for the Delphi ticket sales forecasting tool.
 * It orchestrates the artist selection, stats input, conversion rates, and projections.
 */

import { useTranslation } from 'react-i18next';
import { TrendingUp } from 'lucide-react';
import { FmFormSectionHeader } from '@/components/common/display/FmSectionHeader';
import { useDelphiCalculator } from '../hooks/useDelphiCalculator';
import { ArtistSelector } from './ArtistSelector';
import { SocialStatsPanel } from './SocialStatsPanel';
import { ConversionRatesPanel } from './ConversionRatesPanel';
import { ForecastResults } from './ForecastResults';

export function DelphiRoot() {
  const { t } = useTranslation('common');

  const {
    // Artist selection
    selectedArtist,
    setSelectedArtist,

    // Social stats
    socialStats,
    isLoadingStats,
    isStatsStale,
    updateStat,

    // Conversion rates
    conversionRates,
    setConversionRate,
    resetConversionRates,

    // Projections
    projections,
    canCalculate,
  } = useDelphiCalculator();

  return (
    <div className="space-y-[20px]">
      {/* Header */}
      <FmFormSectionHeader
        title={t('developerIndex.delphi')}
        description={t('developerIndex.delphiDescription')}
        icon={TrendingUp}
      />

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[20px]">
        {/* Left column: Artist selection and stats */}
        <div className="space-y-[20px]">
          {/* Artist Selector */}
          <ArtistSelector
            selectedArtist={selectedArtist}
            onArtistChange={setSelectedArtist}
            isLoadingStats={isLoadingStats}
            isStatsStale={isStatsStale}
          />

          {/* Social Stats Panel - only show when artist selected */}
          {selectedArtist && (
            <SocialStatsPanel
              stats={socialStats}
              isLoading={isLoadingStats}
              onStatChange={updateStat}
            />
          )}
        </div>

        {/* Right column: Conversion rates */}
        <div className="space-y-[20px]">
          <ConversionRatesPanel
            conversionRates={conversionRates}
            onRateChange={setConversionRate}
            onResetRates={resetConversionRates}
          />
        </div>
      </div>

      {/* Results section - full width */}
      <ForecastResults
        projections={projections}
        canCalculate={canCalculate}
        artistName={selectedArtist?.name}
      />
    </div>
  );
}

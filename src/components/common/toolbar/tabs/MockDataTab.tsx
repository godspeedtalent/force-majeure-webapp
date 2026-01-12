/**
 * Mock Data Tab
 *
 * FmToolbar tab for generating mock order data for test events.
 * Uses FmCommon components throughout for consistent styling.
 */

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Play,
  Trash2,
  RefreshCw,
  Calendar,
  Users,
  Ticket,
  Shield,
  CheckCircle,
  XCircle,
  MapPin,
} from 'lucide-react';

import { Separator } from '@/components/common/shadcn/separator';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonSelect } from '@/components/common/forms/FmCommonSelect';
import { FmCommonCheckbox } from '@/components/common/forms/FmCommonCheckbox';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmCommonLabel } from '@/components/common/forms/FmCommonLabel';
import { FmCommonCollapsibleSection } from '@/components/common/data/FmCommonCollapsibleSection';
import { cn } from '@/shared';
import { useMockOrderGenerator } from '@/services/mockOrders/hooks/useMockOrderGenerator';

export function MockDataTabContent() {
  const { t } = useTranslation('common');
  const {
    testEvents,
    selectedEventId,
    selectedEvent,
    config,
    tierSelections,
    isLoading,
    isGenerating,
    isDeleting,
    lastResult,
    isAutoLoaded,
    loadTestEvents,
    setSelectedEventId,
    generateOrders,
    deleteMockOrders,
    updateConfig,
    updateTierSelection,
    toggleTierEnabled,
  } = useMockOrderGenerator();

  // Refresh events when tab opens
  useEffect(() => {
    loadTestEvents();
  }, [loadTestEvents]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <FmCommonLoadingSpinner size="md" />
      </div>
    );
  }

  const eventOptions = testEvents.map(event => ({
    value: event.id,
    label: `${event.title} (${event.mockOrderCount} orders)`,
  }));

  return (
    <div className="space-y-4">
      <Separator className="bg-white/10" />

      <div className="px-4 py-2 space-y-4">
        {/* Event Selection */}
        <div className="space-y-2">
          <FmCommonLabel className="flex items-center gap-2">
            <Ticket className="h-3 w-3" />
            {t('mockOrderGenerator.selectEvent')}
          </FmCommonLabel>

          {testEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('mockOrderGenerator.noTestEvents')}
            </p>
          ) : (
            <FmCommonSelect
              value={selectedEventId || ''}
              onChange={setSelectedEventId}
              options={eventOptions}
              placeholder={t('mockOrderGenerator.selectEventPlaceholder')}
            />
          )}

          {isAutoLoaded && selectedEvent && (
            <div className="flex items-center gap-2 text-xs text-fm-gold">
              <MapPin className="h-3 w-3" />
              {t('mockOrderGenerator.autoLoadedFromPage')}
            </div>
          )}

          <FmCommonButton
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={loadTestEvents}
            className="w-full"
          >
            {t('mockOrderGenerator.refreshEvents')}
          </FmCommonButton>
        </div>

        {selectedEvent && (
          <>
            <Separator className="bg-white/10" />

            {/* Configuration */}
            <FmCommonCollapsibleSection
              title={t('mockOrderGenerator.configuration')}
              defaultExpanded={true}
            >
              <div className="space-y-4 pt-2">
                {/* Order Count */}
                <div className="space-y-2">
                  <FmCommonLabel className="flex items-center gap-2">
                    <Ticket className="h-3 w-3" />
                    {t('mockOrderGenerator.orderCount')}
                  </FmCommonLabel>
                  <FmCommonTextField
                    type="number"
                    value={config.totalOrders?.toString() || '50'}
                    onChange={e => updateConfig('totalOrders', parseInt(e.target.value) || 50)}
                    min={1}
                    max={1000}
                  />
                </div>

                {/* User Ratio */}
                <div className="space-y-2">
                  <FmCommonLabel className="flex items-center gap-2">
                    <Users className="h-3 w-3" />
                    {t('mockOrderGenerator.userRatio')}
                  </FmCommonLabel>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={config.registeredUserRatio ?? 30}
                      onChange={e => updateConfig('registeredUserRatio', parseInt(e.target.value))}
                      className="flex-1 accent-fm-gold"
                    />
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {config.registeredUserRatio ?? 30}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('mockOrderGenerator.userRatioHelp')}
                  </p>
                </div>

                {/* Date Range */}
                <div className="space-y-2">
                  <FmCommonLabel className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    {t('mockOrderGenerator.dateRange')}
                  </FmCommonLabel>
                  <div className="grid grid-cols-2 gap-2">
                    <FmCommonTextField
                      type="date"
                      value={config.dateRangeStart?.split('T')[0] || ''}
                      onChange={e => updateConfig('dateRangeStart', new Date(e.target.value).toISOString())}
                      label={t('mockOrderGenerator.startDate')}
                    />
                    <FmCommonTextField
                      type="date"
                      value={config.dateRangeEnd?.split('T')[0] || ''}
                      onChange={e => updateConfig('dateRangeEnd', new Date(e.target.value).toISOString())}
                      label={t('mockOrderGenerator.endDate')}
                    />
                  </div>
                </div>

                {/* Ticket Protection */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FmCommonCheckbox
                      checked={config.includeTicketProtection ?? true}
                      onCheckedChange={checked => updateConfig('includeTicketProtection', checked)}
                    />
                    <FmCommonLabel>
                      {t('mockOrderGenerator.includeProtection')}
                    </FmCommonLabel>
                  </div>
                  {config.includeTicketProtection && (
                    <div className="flex items-center gap-2 pl-7">
                      <Shield className="h-3 w-3 text-fm-gold" />
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={config.ticketProtectionRatio ?? 40}
                        onChange={e => updateConfig('ticketProtectionRatio', parseInt(e.target.value))}
                        className="flex-1 accent-fm-gold"
                      />
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {config.ticketProtectionRatio ?? 40}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </FmCommonCollapsibleSection>

            <Separator className="bg-white/10" />

            {/* Tier Selection */}
            <FmCommonCollapsibleSection
              title={t('mockOrderGenerator.tierSelection')}
              defaultExpanded={true}
            >
              <div className="space-y-2 pt-2">
                {selectedEvent.ticketTiers.map(tier => {
                  const selection = tierSelections.find(s => s.tierId === tier.id);
                  const isSelected = !!selection;

                  return (
                    <div
                      key={tier.id}
                      className={cn(
                        'border rounded-none p-3 space-y-2 transition-all duration-200',
                        isSelected
                          ? 'border-fm-gold/50 bg-fm-gold/10'
                          : 'border-white/20 hover:border-white/40'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <FmCommonCheckbox
                          checked={isSelected}
                          onCheckedChange={() => toggleTierEnabled(tier.id)}
                        />
                        <span className="text-sm flex-1">
                          {tier.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ${(tier.price_cents / 100).toFixed(2)}
                        </span>
                      </div>

                      {isSelected && selection && (
                        <div className="grid grid-cols-3 gap-2 pl-7">
                          <FmCommonTextField
                            type="number"
                            value={selection.minQuantity.toString()}
                            onChange={e => updateTierSelection(tier.id, {
                              minQuantity: Math.max(1, parseInt(e.target.value) || 1),
                            })}
                            label={t('mockOrderGenerator.min')}
                            min={1}
                            max={10}
                          />
                          <FmCommonTextField
                            type="number"
                            value={selection.maxQuantity.toString()}
                            onChange={e => updateTierSelection(tier.id, {
                              maxQuantity: Math.max(1, parseInt(e.target.value) || 1),
                            })}
                            label={t('mockOrderGenerator.max')}
                            min={1}
                            max={10}
                          />
                          <FmCommonTextField
                            type="number"
                            value={selection.weight.toString()}
                            onChange={e => updateTierSelection(tier.id, {
                              weight: Math.max(1, parseInt(e.target.value) || 1),
                            })}
                            label={t('mockOrderGenerator.weight')}
                            min={1}
                            max={10}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </FmCommonCollapsibleSection>

            <Separator className="bg-white/10" />

            {/* Actions */}
            <div className="space-y-2">
              <FmCommonButton
                variant="gold"
                icon={Play}
                onClick={generateOrders}
                disabled={isGenerating || tierSelections.length === 0}
                loading={isGenerating}
                className="w-full"
              >
                {isGenerating
                  ? t('mockOrderGenerator.generating')
                  : t('mockOrderGenerator.generate')
                }
              </FmCommonButton>

              {selectedEvent.mockOrderCount > 0 && (
                <FmCommonButton
                  variant="destructive-outline"
                  icon={Trash2}
                  onClick={deleteMockOrders}
                  disabled={isDeleting}
                  loading={isDeleting}
                  className="w-full"
                >
                  {isDeleting
                    ? t('mockOrderGenerator.deleting')
                    : t('mockOrderGenerator.deleteOrders', { count: selectedEvent.mockOrderCount })
                  }
                </FmCommonButton>
              )}
            </div>

            {/* Last Result */}
            {lastResult && (
              <div className={cn(
                'p-3 rounded-none text-sm border',
                lastResult.success
                  ? 'bg-green-500/10 border-green-500/50 text-green-400'
                  : 'bg-red-500/10 border-red-500/50 text-red-400'
              )}>
                <div className="flex items-start gap-2">
                  {lastResult.success ? (
                    <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-medium">
                      {lastResult.success
                        ? t('mockOrderGenerator.resultSuccess', {
                            orders: lastResult.ordersCreated,
                            tickets: lastResult.ticketsCreated,
                            time: (lastResult.executionTimeMs / 1000).toFixed(1),
                          })
                        : t('mockOrderGenerator.resultFailed', {
                            errors: lastResult.errors.length,
                          })
                      }
                    </p>
                    {!lastResult.success && lastResult.errors.length > 0 && (
                      <p className="text-xs mt-1 opacity-80">
                        {lastResult.errors[0]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

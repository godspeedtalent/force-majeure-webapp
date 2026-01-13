import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { FlaskConical, Dices, AlertTriangle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase, logger } from '@/shared';
import { handleError } from '@/shared/services/errorHandler';
import { FmFormSection } from '@/components/common/forms/FmFormSection';
import { FmCommonToggle } from '@/components/common/forms/FmCommonToggle';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmGenerationProgress } from '@/components/common/feedback/FmGenerationProgress';
import { Label } from '@/components/common/shadcn/label';
import { Slider } from '@/components/common/shadcn/slider';
import { EventStatus } from '@/features/events/types';
import { mockOrderService } from '@/services/mockOrders/MockOrderService';
import {
  DEFAULT_MOCK_ORDER_CONFIG,
  type TierSelection,
  type GenerationProgress,
} from '@/services/mockOrders/types';

// LocalStorage key for persisting generation progress
const getProgressStorageKey = (eventId: string) => `fm-mock-generation-progress-${eventId}`;

interface TestEventConfigSectionProps {
  eventId: string;
  eventStatus: EventStatus;
  isTestEvent: boolean;
  orderCount: number;
  onStatusChange?: () => void;
}

export const TestEventConfigSection = ({
  eventId,
  eventStatus,
  isTestEvent,
  orderCount,
  onStatusChange,
}: TestEventConfigSectionProps) => {
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');
  const queryClient = useQueryClient();

  const [isUpdating, setIsUpdating] = useState(false);
  const [isImportingMockData, setIsImportingMockData] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);

  // Load persisted progress from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(getProgressStorageKey(eventId));
      if (stored) {
        const parsed = JSON.parse(stored) as GenerationProgress;
        setGenerationProgress(parsed);
      }
    } catch (error) {
      // Ignore parse errors - just don't restore progress
      logger.warn('Failed to restore mock generation progress from localStorage', { eventId });
    }
  }, [eventId]);

  // Wrapper to update progress and persist to localStorage
  const handleProgressUpdate = useCallback((progress: GenerationProgress) => {
    setGenerationProgress(progress);
    try {
      localStorage.setItem(getProgressStorageKey(eventId), JSON.stringify(progress));
    } catch (error) {
      // Ignore storage errors
    }
  }, [eventId]);

  // Clear persisted progress
  const clearPersistedProgress = useCallback(() => {
    setGenerationProgress(null);
    try {
      localStorage.removeItem(getProgressStorageKey(eventId));
    } catch (error) {
      // Ignore storage errors
    }
  }, [eventId]);

  // Mock data configuration
  const [totalOrders, setTotalOrders] = useState(DEFAULT_MOCK_ORDER_CONFIG.totalOrders ?? 50);
  const [registeredUserRatio, setRegisteredUserRatio] = useState(DEFAULT_MOCK_ORDER_CONFIG.registeredUserRatio ?? 30);
  const [ticketProtectionRatio, setTicketProtectionRatio] = useState(DEFAULT_MOCK_ORDER_CONFIG.ticketProtectionRatio ?? 40);
  const [paidRatio, setPaidRatio] = useState(DEFAULT_MOCK_ORDER_CONFIG.statusDistribution?.paid ?? 90);
  const [refundedRatio, setRefundedRatio] = useState(DEFAULT_MOCK_ORDER_CONFIG.statusDistribution?.refunded ?? 5);

  // Fetch ticket tiers for this event
  const { data: ticketTiers } = useQuery({
    queryKey: ['ticket-tiers', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_tiers')
        .select('id, name, price_cents')
        .eq('event_id', eventId)
        .order('tier_order');

      if (error) throw error;
      return data;
    },
    enabled: eventStatus === 'test' || isTestEvent,
  });

  // Event has "gone live" if it's published or has real (non-test) orders
  const hasGoneLive = eventStatus === 'published';

  // Only allow toggling test mode for draft events that haven't gone live
  const canToggleTestMode = eventStatus === 'draft' && !hasGoneLive;

  const handleToggleTestMode = async (enabled: boolean) => {
    setIsUpdating(true);
    try {
      const newStatus = enabled ? 'test' : 'draft';

      const { error } = await supabase
        .from('events')
        .update({
          status: newStatus,
          test_data: enabled,
        })
        .eq('id', eventId);

      if (error) throw error;

      toast.success(
        enabled
          ? t('eventAdmin.testModeEnabled')
          : t('eventAdmin.testModeDisabled')
      );

      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      onStatusChange?.();
    } catch (error) {
      await handleError(error, {
        title: tToast('events.updateStatusFailed'),
        context: 'TestEventConfigSection.toggleTestMode',
        endpoint: 'events',
        method: 'UPDATE',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGenerateMockData = async () => {
    if (!ticketTiers?.length) {
      toast.error(t('eventAdmin.noTicketTiersError'));
      return;
    }

    setIsImportingMockData(true);
    clearPersistedProgress(); // Reset progress

    try {
      // Build tier selections from available tiers
      const tierSelections: TierSelection[] = ticketTiers.map((tier, idx) => ({
        tierId: tier.id,
        tierName: tier.name,
        minQuantity: 1,
        maxQuantity: 4,
        weight: idx === 0 ? 50 : idx === 1 ? 35 : 15, // Weight by tier order
      }));

      // Calculate date range (from 30 days ago to now)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Use the progress-tracking method
      const result = await mockOrderService.generateMockOrdersWithProgress({
        eventId,
        totalOrders,
        registeredUserRatio,
        tierSelections,
        includeTicketProtection: ticketProtectionRatio > 0,
        ticketProtectionRatio,
        dateRangeStart: thirtyDaysAgo.toISOString(),
        dateRangeEnd: now.toISOString(),
        statusDistribution: {
          paid: paidRatio,
          refunded: refundedRatio,
          cancelled: Math.max(0, 100 - paidRatio - refundedRatio),
        },
        generateRsvps: true,
        generateInterests: true,
        onProgress: handleProgressUpdate,
      });

      if (result.success) {
        toast.success(t('eventAdmin.mockDataImported'), {
          description: t('eventAdmin.mockDataImportedStats', {
            orders: result.ordersCreated,
            tickets: result.ticketsCreated,
          }),
        });
      } else {
        throw new Error(result.errors.join(', '));
      }

      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['ticket-tiers', eventId] });
      queryClient.invalidateQueries({ queryKey: ['orders', eventId] });
      queryClient.invalidateQueries({ queryKey: ['order-count', eventId] });
      onStatusChange?.();
    } catch (error) {
      logger.error('Error generating mock data:', {
        error: error instanceof Error ? error.message : 'Unknown',
        eventId,
      });
      await handleError(error, {
        title: tToast('events.mockDataImportFailed'),
        context: 'TestEventConfigSection.generateMockData',
        endpoint: 'orders',
        method: 'INSERT',
      });
    } finally {
      setIsImportingMockData(false);
    }
  };

  const handlePurgeMockData = async () => {
    setIsPurging(true);
    try {
      const result = await mockOrderService.deleteMockOrdersByEvent(eventId);

      if (result.success) {
        toast.success(t('eventAdmin.mockDataPurged'), {
          description: t('eventAdmin.mockDataPurgedStats', {
            orders: result.deletedOrders,
            tickets: result.deletedTickets,
          }),
        });
        // Clear progress display and persisted progress after successful purge
        clearPersistedProgress();
      } else {
        throw new Error(result.error);
      }

      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['ticket-tiers', eventId] });
      queryClient.invalidateQueries({ queryKey: ['orders', eventId] });
      queryClient.invalidateQueries({ queryKey: ['order-count', eventId] });
      onStatusChange?.();
    } catch (error) {
      logger.error('Error purging mock data:', {
        error: error instanceof Error ? error.message : 'Unknown',
        eventId,
      });
      await handleError(error, {
        title: tToast('events.mockDataPurgeFailed'),
        context: 'TestEventConfigSection.purgeMockData',
        endpoint: 'orders',
        method: 'DELETE',
      });
    } finally {
      setIsPurging(false);
    }
  };

  const isCurrentlyTestEvent = eventStatus === 'test' || isTestEvent;

  return (
    <FmFormSection
      title={t('eventAdmin.testEventMode')}
      description={t('eventAdmin.testEventModeDescription')}
      icon={FlaskConical}
      className={isCurrentlyTestEvent ? 'border-fm-purple/30' : ''}
    >
      <div className='space-y-4'>
        {/* Test Mode Toggle */}
        <div className='flex items-center gap-3 p-4 border border-border bg-card'>
          <FlaskConical className={`h-5 w-5 ${isCurrentlyTestEvent ? 'text-fm-purple' : 'text-muted-foreground'}`} />
          <div className='flex-1'>
            <Label htmlFor='test-mode-toggle' className='cursor-pointer font-medium'>
              {t('eventAdmin.enableTestMode')}
            </Label>
            <p className='text-xs text-muted-foreground mt-1'>
              {hasGoneLive
                ? t('eventAdmin.testModeDisabledReason')
                : t('eventAdmin.enableTestModeDescription')
              }
            </p>
          </div>
          <FmCommonToggle
            id='test-mode-toggle'
            label={t('eventAdmin.enableTestMode')}
            checked={isCurrentlyTestEvent}
            onCheckedChange={handleToggleTestMode}
            disabled={!canToggleTestMode || isUpdating}
            hideLabel
          />
        </div>

        {/* Warning for events that have gone live */}
        {hasGoneLive && (
          <div className='flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20'>
            <AlertTriangle className='h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5' />
            <p className='text-sm text-yellow-200'>
              {orderCount > 0
                ? t('eventAdmin.hasOrdersWarning', { count: orderCount })
                : t('eventAdmin.hasBeenPublishedWarning')
              }
            </p>
          </div>
        )}

        {/* Mock Data Import Tool - only show when test mode is enabled */}
        {isCurrentlyTestEvent && (
          <div className='p-4 bg-fm-purple/5 border border-fm-purple/20 space-y-4'>
            <div>
              <h4 className='text-sm font-medium text-fm-purple'>
                {t('eventAdmin.mockDataTools')}
              </h4>
              <p className='text-xs text-muted-foreground mt-1'>
                {t('eventAdmin.mockDataToolsDescription')}
              </p>
            </div>

            {/* Configurable fields - always visible */}
            <div className='space-y-4 pt-2 border-t border-fm-purple/20'>
                {/* Total Orders */}
                <div className='space-y-2'>
                  <Label className='text-xs text-muted-foreground uppercase'>
                    {t('eventAdmin.totalOrders')} ({totalOrders})
                  </Label>
                  <FmCommonTextField
                    type='number'
                    value={totalOrders.toString()}
                    onChange={(e) => setTotalOrders(Math.max(1, Math.min(500, parseInt(e.target.value) || 1)))}
                    min={1}
                    max={500}
                  />
                </div>

                {/* Registered User Ratio */}
                <div className='space-y-2'>
                  <Label className='text-xs text-muted-foreground uppercase'>
                    {t('eventAdmin.registeredUserRatio')} ({registeredUserRatio}%)
                  </Label>
                  <Slider
                    value={[registeredUserRatio]}
                    onValueChange={([value]) => setRegisteredUserRatio(value)}
                    min={0}
                    max={100}
                    step={5}
                    className='py-2'
                  />
                </div>

                {/* Ticket Protection Ratio */}
                <div className='space-y-2'>
                  <Label className='text-xs text-muted-foreground uppercase'>
                    {t('eventAdmin.ticketProtectionRatio')} ({ticketProtectionRatio}%)
                  </Label>
                  <Slider
                    value={[ticketProtectionRatio]}
                    onValueChange={([value]) => setTicketProtectionRatio(value)}
                    min={0}
                    max={100}
                    step={5}
                    className='py-2'
                  />
                </div>

                {/* Order Status Distribution */}
                <div className='space-y-2'>
                  <Label className='text-xs text-muted-foreground uppercase'>
                    {t('eventAdmin.orderStatusDistribution')}
                  </Label>
                  <div className='grid grid-cols-3 gap-2 text-xs'>
                    <div className='space-y-1'>
                      <span className='text-green-400'>{t('eventAdmin.paidOrders')}: {paidRatio}%</span>
                      <Slider
                        value={[paidRatio]}
                        onValueChange={([value]) => {
                          setPaidRatio(value);
                          // Adjust refunded if needed
                          if (value + refundedRatio > 100) {
                            setRefundedRatio(Math.max(0, 100 - value));
                          }
                        }}
                        min={0}
                        max={100}
                        step={5}
                        className='py-1'
                      />
                    </div>
                    <div className='space-y-1'>
                      <span className='text-yellow-400'>{t('eventAdmin.refundedOrders')}: {refundedRatio}%</span>
                      <Slider
                        value={[refundedRatio]}
                        onValueChange={([value]) => {
                          const maxRefund = 100 - paidRatio;
                          setRefundedRatio(Math.min(value, maxRefund));
                        }}
                        min={0}
                        max={100 - paidRatio}
                        step={5}
                        className='py-1'
                      />
                    </div>
                    <div className='space-y-1'>
                      <span className='text-red-400'>{t('eventAdmin.cancelledOrders')}: {Math.max(0, 100 - paidRatio - refundedRatio)}%</span>
                    </div>
                  </div>
                </div>

                {/* Ticket Tiers Info */}
                {ticketTiers && ticketTiers.length > 0 && (
                  <div className='text-xs text-muted-foreground'>
                    <span className='font-medium'>{t('eventAdmin.availableTiers')}:</span>{' '}
                    {ticketTiers.map(t => t.name).join(', ')}
                  </div>
                )}
              </div>

            {/* Action Buttons */}
            <div className='flex gap-3 pt-2'>
              <FmCommonButton
                variant='secondary'
                icon={Dices}
                onClick={handleGenerateMockData}
                loading={isImportingMockData}
                disabled={!ticketTiers?.length || isImportingMockData}
              >
                {isImportingMockData
                  ? t('eventAdmin.generatingMockData')
                  : t('eventAdmin.generateMockData')
                }
              </FmCommonButton>

              {orderCount > 0 && !isImportingMockData && (
                <FmCommonButton
                  variant='destructive-outline'
                  icon={Trash2}
                  onClick={handlePurgeMockData}
                  loading={isPurging}
                >
                  {isPurging
                    ? t('eventAdmin.purgingMockData')
                    : t('eventAdmin.purgeMockData')
                  }
                </FmCommonButton>
              )}
            </div>

            {/* Generation Progress Display */}
            {(isImportingMockData || generationProgress) && (
              <div className='pt-4 border-t border-fm-purple/20'>
                <FmGenerationProgress progress={generationProgress} />
              </div>
            )}

            {/* No ticket tiers warning */}
            {(!ticketTiers || ticketTiers.length === 0) && (
              <div className='flex items-start gap-2 text-xs text-yellow-400'>
                <AlertTriangle className='h-4 w-4 flex-shrink-0' />
                <span>{t('eventAdmin.noTicketTiersWarning')}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </FmFormSection>
  );
};

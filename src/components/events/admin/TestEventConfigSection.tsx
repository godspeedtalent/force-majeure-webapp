import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import {
  FlaskConical,
  Dices,
  AlertTriangle,
  Trash2,
  Users,
  Calendar,
  Layers,
  DollarSign,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase, logger } from '@/shared';
import { handleError } from '@/shared/services/errorHandler';
import { FmFormSection } from '@/components/common/forms/FmFormSection';
import { FmCommonToggle } from '@/components/common/forms/FmCommonToggle';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonSlider } from '@/components/common/forms/FmCommonSlider';
import { FmCommonFormCheckbox } from '@/components/common/forms/FmCommonFormCheckbox';
import { FmGenerationProgress } from '@/components/common/feedback/FmGenerationProgress';
import { Label } from '@/components/common/shadcn/label';
import { EventStatus } from '@/features/events/types';
import { mockOrderService } from '@/services/mockOrders/MockOrderService';
import {
  DEFAULT_MOCK_ORDER_CONFIG,
  MOCK_ORDER_CONSTANTS,
  type TierSelection,
  type GenerationProgress,
} from '@/services/mockOrders/types';

// LocalStorage key for persisting generation progress
const getProgressStorageKey = (eventId: string) => `fm-mock-generation-progress-${eventId}`;

interface Fee {
  id: string;
  fee_name: string;
  fee_type: 'flat' | 'percentage';
  fee_value: number;
  is_active: boolean;
  environment_id: string;
}

interface TestEventConfigSectionProps {
  eventId: string;
  eventStatus: EventStatus;
  isTestEvent: boolean;
  orderCount: number;
  onStatusChange?: () => void;
}

// Collapsible section component for organizing controls
interface ConfigSectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const ConfigSection = ({ title, icon: Icon, children, defaultOpen = true }: ConfigSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className='border border-white/10 bg-black/20'>
      <button
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        className='w-full flex items-center gap-2 p-3 text-left hover:bg-white/5 transition-colors'
      >
        <Icon className='h-4 w-4 text-fm-purple' />
        <span className='text-sm font-medium flex-1'>{title}</span>
        {isOpen ? (
          <ChevronDown className='h-4 w-4 text-muted-foreground' />
        ) : (
          <ChevronRight className='h-4 w-4 text-muted-foreground' />
        )}
      </button>
      {isOpen && <div className='p-3 pt-0 space-y-3'>{children}</div>}
    </div>
  );
};

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
      logger.warn('Failed to restore mock generation progress from localStorage', { eventId });
    }
  }, [eventId]);

  // Wrapper to update progress and persist to localStorage
  const handleProgressUpdate = useCallback(
    (progress: GenerationProgress) => {
      setGenerationProgress(progress);
      try {
        localStorage.setItem(getProgressStorageKey(eventId), JSON.stringify(progress));
      } catch (error) {
        // Ignore storage errors
      }
    },
    [eventId]
  );

  // Clear persisted progress
  const clearPersistedProgress = useCallback(() => {
    setGenerationProgress(null);
    try {
      localStorage.removeItem(getProgressStorageKey(eventId));
    } catch (error) {
      // Ignore storage errors
    }
  }, [eventId]);

  // === ORDERS & USERS CONFIG ===
  const [totalOrders, setTotalOrders] = useState(DEFAULT_MOCK_ORDER_CONFIG.totalOrders ?? 50);
  const [testUsers, setTestUsers] = useState(DEFAULT_MOCK_ORDER_CONFIG.totalOrders ?? 50);
  const [registeredUserRatio, setRegisteredUserRatio] = useState(
    DEFAULT_MOCK_ORDER_CONFIG.registeredUserRatio ?? 30
  );

  // === DATE RANGE CONFIG ===
  const [dateRangeDays, setDateRangeDays] = useState(30);
  const [randomizeOrderTimes, setRandomizeOrderTimes] = useState(true);

  // === TICKET GROUPS CONFIG ===
  const [ticketGroupCount, setTicketGroupCount] = useState(0);

  // === TICKET PROTECTION CONFIG ===
  const [includeTicketProtection, setIncludeTicketProtection] = useState(false);
  const [ticketProtectionRatio, setTicketProtectionRatio] = useState(
    DEFAULT_MOCK_ORDER_CONFIG.ticketProtectionRatio ?? 40
  );
  const [ticketProtectionPrice, setTicketProtectionPrice] = useState(
    (MOCK_ORDER_CONSTANTS.TICKET_PROTECTION_PRICE_CENTS / 100).toString()
  );

  // === ORDER STATUS CONFIG ===
  const [paidRatio, setPaidRatio] = useState(DEFAULT_MOCK_ORDER_CONFIG.statusDistribution?.paid ?? 90);
  const [refundedRatio, setRefundedRatio] = useState(
    DEFAULT_MOCK_ORDER_CONFIG.statusDistribution?.refunded ?? 5
  );
  const cancelledRatio = Math.max(0, 100 - paidRatio - refundedRatio);

  // === FEE OVERRIDES ===
  const [salesTaxOverride, setSalesTaxOverride] = useState('');
  const [processingFeeOverride, setProcessingFeeOverride] = useState('');
  const [platformFeeOverride, setPlatformFeeOverride] = useState('');

  // Fetch admin fees to show as placeholders
  const { data: adminFees } = useQuery({
    queryKey: ['admin-fees'],
    queryFn: async () => {
      const { data: allEnvData, error: allEnvError } = await supabase
        .from('environments')
        .select('id')
        .eq('name', 'all')
        .single();

      if (allEnvError) throw allEnvError;

      const { data, error } = await supabase
        .from('ticketing_fees')
        .select('*')
        .eq('environment_id', allEnvData.id);

      if (error) throw error;
      return data as Fee[];
    },
  });

  // Helper to get fee placeholder text
  const getFeePlaceholder = (feeName: string): string => {
    const fee = adminFees?.find((f) => f.fee_name === feeName);
    if (!fee) return t('eventAdmin.useDefaultFee');
    return fee.fee_type === 'percentage' ? `${fee.fee_value}%` : `$${fee.fee_value}`;
  };

  // Fetch ticket tiers for this event
  const { data: ticketTiers } = useQuery({
    queryKey: ['ticket-tiers', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_tiers')
        .select('id, name, price_cents, group_id')
        .eq('event_id', eventId)
        .order('tier_order');

      if (error) throw error;
      return data;
    },
    enabled: eventStatus === 'test' || isTestEvent,
  });

  // Fetch existing ticket groups
  const { data: existingGroups } = useQuery({
    queryKey: ['ticket-groups', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_groups')
        .select('id, name')
        .eq('event_id', eventId)
        .order('group_order');

      if (error) throw error;
      return data;
    },
    enabled: eventStatus === 'test' || isTestEvent,
  });

  // Fetch event start time for date range calculation
  const { data: eventData } = useQuery({
    queryKey: ['event-start-time', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('start_time')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: eventStatus === 'test' || isTestEvent,
  });

  // Calculate the earliest order date based on days prior to event
  const earliestOrderDate = useMemo(() => {
    if (!eventData?.start_time) return null;
    const eventDate = new Date(eventData.start_time);
    const earliestDate = new Date(eventDate.getTime() - dateRangeDays * 24 * 60 * 60 * 1000);
    return earliestDate;
  }, [eventData?.start_time, dateRangeDays]);

  // Ensure testUsers >= totalOrders
  useEffect(() => {
    if (testUsers < totalOrders) {
      setTestUsers(totalOrders);
    }
  }, [totalOrders, testUsers]);

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

      toast.success(enabled ? t('eventAdmin.testModeEnabled') : t('eventAdmin.testModeDisabled'));

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
    clearPersistedProgress();

    try {
      // Build tier selections from available tiers
      const tierSelections: TierSelection[] = ticketTiers.map((tier, idx) => ({
        tierId: tier.id,
        tierName: tier.name,
        minQuantity: 1,
        maxQuantity: 4,
        weight: idx === 0 ? 50 : idx === 1 ? 35 : 15,
      }));

      // Calculate date range based on event start time and dateRangeDays
      let startDate: Date;
      let endDate: Date;

      if (eventData?.start_time) {
        // Use event start time as the end date, go back dateRangeDays
        endDate = new Date(eventData.start_time);
        startDate = new Date(endDate.getTime() - dateRangeDays * 24 * 60 * 60 * 1000);
      } else {
        // Fallback: use current time
        endDate = new Date();
        startDate = new Date(endDate.getTime() - dateRangeDays * 24 * 60 * 60 * 1000);
      }

      const result = await mockOrderService.generateMockOrdersWithProgress({
        eventId,
        totalOrders,
        registeredUserRatio,
        tierSelections,
        includeTicketProtection,
        ticketProtectionRatio: includeTicketProtection ? ticketProtectionRatio : 0,
        dateRangeStart: startDate.toISOString(),
        dateRangeEnd: endDate.toISOString(),
        randomizeOrderTimes,
        statusDistribution: {
          paid: paidRatio,
          refunded: refundedRatio,
          cancelled: cancelledRatio,
        },
        generateRsvps: true,
        generateInterests: true,
        onProgress: handleProgressUpdate,
        // Fee overrides
        ...(salesTaxOverride || processingFeeOverride || platformFeeOverride
          ? {
              feeOverrides: {
                ...(salesTaxOverride ? { sales_tax: parseFloat(salesTaxOverride) } : {}),
                ...(processingFeeOverride ? { processing_fee: parseFloat(processingFeeOverride) } : {}),
                ...(platformFeeOverride ? { platform_fee: parseFloat(platformFeeOverride) } : {}),
              },
            }
          : {}),
        // Ticket protection price
        ...(includeTicketProtection && ticketProtectionPrice
          ? {
              ticketProtectionPriceCents: Math.round(parseFloat(ticketProtectionPrice) * 100),
            }
          : {}),
        // Test users count
        testUserCount: testUsers,
        // Ticket groups to generate
        ticketGroupCount: ticketGroupCount > 0 ? ticketGroupCount : undefined,
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
      queryClient.invalidateQueries({ queryKey: ['ticket-groups', eventId] });
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
        clearPersistedProgress();
      } else {
        throw new Error(result.error);
      }

      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['ticket-tiers', eventId] });
      queryClient.invalidateQueries({ queryKey: ['ticket-groups', eventId] });
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
          <FlaskConical
            className={`h-5 w-5 ${isCurrentlyTestEvent ? 'text-fm-purple' : 'text-muted-foreground'}`}
          />
          <div className='flex-1'>
            <Label htmlFor='test-mode-toggle' className='cursor-pointer font-medium'>
              {t('eventAdmin.enableTestMode')}
            </Label>
            <p className='text-xs text-muted-foreground mt-1'>
              {hasGoneLive
                ? t('eventAdmin.testModeDisabledReason')
                : t('eventAdmin.enableTestModeDescription')}
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
                : t('eventAdmin.hasBeenPublishedWarning')}
            </p>
          </div>
        )}

        {/* Mock Data Import Tool - only show when test mode is enabled */}
        {isCurrentlyTestEvent && (
          <div className='p-4 bg-fm-purple/5 border border-fm-purple/20 space-y-4'>
            <div>
              <h4 className='text-sm font-medium text-fm-purple'>{t('eventAdmin.mockDataTools')}</h4>
              <p className='text-xs text-muted-foreground mt-1'>
                {t('eventAdmin.mockDataToolsDescription')}
              </p>
            </div>

            {/* Organized Sections */}
            <div className='space-y-3 pt-2 border-t border-fm-purple/20'>
              {/* === ORDERS & USERS SECTION === */}
              <ConfigSection title={t('eventAdmin.sections.ordersAndUsers')} icon={Users}>
                <FmCommonTextField
                  label={t('eventAdmin.totalOrders')}
                  type='number'
                  value={totalOrders.toString()}
                  onChange={(e) =>
                    setTotalOrders(Math.max(1, Math.min(500, parseInt(e.target.value) || 1)))
                  }
                  min={1}
                  max={500}
                />

                <FmCommonTextField
                  label={t('eventAdmin.testUsers')}
                  type='number'
                  value={testUsers.toString()}
                  onChange={(e) => {
                    const val = Math.max(
                      totalOrders,
                      Math.min(500, parseInt(e.target.value) || totalOrders)
                    );
                    setTestUsers(val);
                  }}
                  min={totalOrders}
                  max={500}
                  description={t('eventAdmin.testUsersDescription')}
                />

                <FmCommonSlider
                  label={t('eventAdmin.registeredUserRatio')}
                  value={registeredUserRatio}
                  onValueChange={setRegisteredUserRatio}
                  min={0}
                  max={100}
                  step={5}
                  valueSuffix='%'
                />

                {/* Order Status Distribution - moved here */}
                <div className='space-y-2 pt-3 border-t border-white/10'>
                  <Label className='text-xs text-muted-foreground uppercase'>
                    {t('eventAdmin.orderStatusDistribution')}
                  </Label>
                  <div className='space-y-2'>
                    <FmCommonSlider
                      label={t('eventAdmin.paidOrders')}
                      labelClassName='!text-green-400'
                      value={paidRatio}
                      onValueChange={(value) => {
                        setPaidRatio(value);
                        if (value + refundedRatio > 100) {
                          setRefundedRatio(Math.max(0, 100 - value));
                        }
                      }}
                      min={0}
                      max={100}
                      step={5}
                      valueSuffix='%'
                      rangeClassName='!bg-green-500/60'
                    />
                    <FmCommonSlider
                      label={t('eventAdmin.refundedOrders')}
                      labelClassName='!text-yellow-400'
                      value={refundedRatio}
                      onValueChange={(value) => {
                        const maxRefund = 100 - paidRatio;
                        setRefundedRatio(Math.min(value, maxRefund));
                      }}
                      min={0}
                      max={100 - paidRatio}
                      step={5}
                      valueSuffix='%'
                      rangeClassName='!bg-yellow-500/60'
                    />
                    <FmCommonSlider
                      label={t('eventAdmin.cancelledOrders')}
                      labelClassName='!text-red-400'
                      value={cancelledRatio}
                      onValueChange={() => {}}
                      min={0}
                      max={100}
                      step={5}
                      valueSuffix='%'
                      rangeClassName='!bg-red-500/60'
                      disabled
                    />
                  </div>
                </div>
              </ConfigSection>

              {/* === DATE RANGE SECTION === */}
              <ConfigSection title={t('eventAdmin.sections.dateRange')} icon={Calendar}>
                <FmCommonSlider
                  label={t('eventAdmin.dateRangeDays')}
                  value={dateRangeDays}
                  onValueChange={setDateRangeDays}
                  min={1}
                  max={90}
                  step={1}
                  formatValue={(v) => `${v} ${t('eventAdmin.days')}`}
                />

                {/* Display the earliest order date */}
                {earliestOrderDate && (
                  <div className='text-xs text-muted-foreground'>
                    {t('eventAdmin.earliestOrderDate')}:{' '}
                    <span className='text-foreground'>
                      {earliestOrderDate.toLocaleDateString(undefined, {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )}

                <div className='space-y-1'>
                  <FmCommonFormCheckbox
                    id='randomize-order-times'
                    label={t('eventAdmin.randomizeOrderTimes')}
                    checked={randomizeOrderTimes}
                    onCheckedChange={setRandomizeOrderTimes}
                  />
                  <p className='text-xs text-muted-foreground ml-8'>
                    {t('eventAdmin.randomizeOrderTimesDescription')}
                  </p>
                </div>
              </ConfigSection>

              {/* === TICKET GROUPS SECTION === */}
              <ConfigSection title={t('eventAdmin.sections.ticketGroups')} icon={Layers}>
                <FmCommonTextField
                  label={t('eventAdmin.ticketGroupCount')}
                  type='number'
                  value={ticketGroupCount.toString()}
                  onChange={(e) =>
                    setTicketGroupCount(Math.max(0, Math.min(10, parseInt(e.target.value) || 0)))
                  }
                  min={0}
                  max={10}
                  description={t('eventAdmin.ticketGroupCountDescription')}
                />

                {existingGroups && existingGroups.length > 0 && (
                  <div className='text-xs text-muted-foreground'>
                    <span className='font-medium'>{t('eventAdmin.existingGroups')}:</span>{' '}
                    {existingGroups.map((g) => g.name).join(', ')}
                  </div>
                )}

                {ticketTiers && ticketTiers.length > 0 && (
                  <div className='text-xs text-muted-foreground'>
                    <span className='font-medium'>{t('eventAdmin.availableTiers')}:</span>{' '}
                    {ticketTiers.map((tier) => tier.name).join(', ')}
                  </div>
                )}
              </ConfigSection>

              {/* === TICKET PROTECTION SECTION === */}
              <ConfigSection
                title={t('eventAdmin.sections.ticketProtection')}
                icon={ShieldCheck}
                defaultOpen={false}
              >
                <div className='space-y-1'>
                  <FmCommonFormCheckbox
                    id='ticket-protection-toggle'
                    label={t('eventAdmin.includeTicketProtection')}
                    checked={includeTicketProtection}
                    onCheckedChange={setIncludeTicketProtection}
                  />
                  <p className='text-xs text-muted-foreground ml-8'>
                    {t('eventAdmin.includeTicketProtectionDescription')}
                  </p>
                </div>

                {includeTicketProtection && (
                  <div className='space-y-3 pl-6 border-l border-fm-purple/20'>
                    <FmCommonTextField
                      label={t('eventAdmin.ticketProtectionPrice')}
                      type='number'
                      value={ticketProtectionPrice}
                      onChange={(e) => setTicketProtectionPrice(e.target.value)}
                      prepend='$'
                      min={0}
                      step={0.01}
                      description={t('eventAdmin.ticketProtectionPriceDescription')}
                    />
                    <FmCommonSlider
                      label={t('eventAdmin.ticketProtectionRatio')}
                      value={ticketProtectionRatio}
                      onValueChange={setTicketProtectionRatio}
                      min={0}
                      max={100}
                      step={5}
                      valueSuffix='%'
                    />
                  </div>
                )}
              </ConfigSection>

              {/* === FEE OVERRIDES SECTION === */}
              <ConfigSection
                title={t('eventAdmin.sections.feeOverrides')}
                icon={DollarSign}
                defaultOpen={false}
              >
                <p className='text-xs text-muted-foreground'>
                  {t('eventAdmin.feeOverridesDescription')}
                </p>
                <div className='grid grid-cols-3 gap-3'>
                  <FmCommonTextField
                    label={t('eventAdmin.salesTaxOverride')}
                    type='number'
                    value={salesTaxOverride}
                    onChange={(e) => setSalesTaxOverride(e.target.value)}
                    placeholder={getFeePlaceholder('sales_tax')}
                    prepend='%'
                    min={0}
                    step={0.1}
                  />
                  <FmCommonTextField
                    label={t('eventAdmin.processingFeeOverride')}
                    type='number'
                    value={processingFeeOverride}
                    onChange={(e) => setProcessingFeeOverride(e.target.value)}
                    placeholder={getFeePlaceholder('processing_fee')}
                    prepend='%'
                    min={0}
                    step={0.1}
                  />
                  <FmCommonTextField
                    label={t('eventAdmin.platformFeeOverride')}
                    type='number'
                    value={platformFeeOverride}
                    onChange={(e) => setPlatformFeeOverride(e.target.value)}
                    placeholder={getFeePlaceholder('platform_fee')}
                    prepend='%'
                    min={0}
                    step={0.1}
                  />
                </div>
              </ConfigSection>
            </div>

            {/* Action Buttons */}
            <div className='flex gap-3 pt-2'>
              <FmCommonButton
                variant='default'
                icon={Dices}
                onClick={handleGenerateMockData}
                loading={isImportingMockData}
                disabled={!ticketTiers?.length || isImportingMockData}
              >
                {isImportingMockData
                  ? t('eventAdmin.generatingMockData')
                  : t('eventAdmin.generateMockData')}
              </FmCommonButton>

              {orderCount > 0 && !isImportingMockData && (
                <FmCommonButton
                  variant='destructive-outline'
                  icon={Trash2}
                  onClick={handlePurgeMockData}
                  loading={isPurging}
                >
                  {isPurging ? t('eventAdmin.purgingMockData') : t('eventAdmin.purgeMockData')}
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

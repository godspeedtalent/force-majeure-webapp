import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Ticket, Users, Gift, Info, Mail, CalendarCheck } from 'lucide-react';
import { FmFormSection } from '@/components/common/forms/FmFormSection';
import { FmCommonToggle } from '@/components/common/forms/FmCommonToggle';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmStickyFormFooter } from '@/components/common/forms/FmStickyFormFooter';
import { Label } from '@/components/common/shadcn/label';
import { TicketGroupManager } from './TicketGroupManager';
import { EventFeeSettings } from './EventFeeSettings';
import { useEventTicketTiers } from './hooks/useEventTicketTiers';
import { useEventRsvpSettings } from '@/features/events/hooks/useEventRsvpSettings';
import { useEventFeeSettings } from '@/features/events/hooks/useEventFeeSettings';
import { useTicketFees } from '@/components/ticketing/hooks/useTicketFees';
import { CompTicketManager } from '@/features/events/components/CompTicketManager';
import type { TicketGroup } from './ticket-group-manager/types';

interface EventTicketTierManagementProps {
  eventId: string;
}

export const EventTicketTierManagement = ({ eventId }: EventTicketTierManagementProps) => {
  const { t } = useTranslation('common');
  const { groups, isLoading, saveGroups, isSaving } = useEventTicketTiers(eventId);
  const [localGroups, setLocalGroups] = useState<TicketGroup[]>([]);

  // RSVP settings
  const {
    isRsvpEnabled,
    isRsvpOnlyEvent,
    rsvpCapacity,
    rsvpButtonSubtitle,
    sendRsvpEmail,
    isLoading: isRsvpLoading,
    isSaving: isRsvpSaving,
    toggleRsvpEnabled,
    toggleRsvpOnlyEvent,
    updateRsvpCapacity,
    updateRsvpButtonSubtitle,
    toggleSendRsvpEmail,
  } = useEventRsvpSettings(eventId);

  // Fee settings
  const {
    settings: feeSettings,
    isLoading: isFeeLoading,
    isSaving: isFeeSaving,
    updateSettings: updateFeeSettings,
  } = useEventFeeSettings(eventId);

  // Global fees for display when using defaults
  const { fees: globalFees } = useTicketFees();

  // Local state for capacity input
  const [localCapacity, setLocalCapacity] = useState<string>('');
  const [capacityDirty, setCapacityDirty] = useState(false);

  // Local state for subtitle input
  const [localSubtitle, setLocalSubtitle] = useState<string>('');
  const [subtitleDirty, setSubtitleDirty] = useState(false);

  // Track initial groups for dirty state detection
  const initialGroupsRef = useRef<string | null>(null);

  // Sync capacity from server
  if (rsvpCapacity !== null && !capacityDirty && localCapacity === '') {
    setLocalCapacity(rsvpCapacity.toString());
  }

  // Sync subtitle from server
  if (rsvpButtonSubtitle !== null && !subtitleDirty && localSubtitle === '') {
    setLocalSubtitle(rsvpButtonSubtitle);
  }

  // Update local groups when data loads
  useEffect(() => {
    if (groups.length > 0 && localGroups.length === 0) {
      setLocalGroups(groups as TicketGroup[]);
      // Store initial state as JSON for comparison
      initialGroupsRef.current = JSON.stringify(groups);
    }
  }, [groups, localGroups.length]);

  // Calculate if ticket tiers have unsaved changes
  const isTiersDirty = useMemo(() => {
    if (!initialGroupsRef.current) return false;
    return JSON.stringify(localGroups) !== initialGroupsRef.current;
  }, [localGroups]);

  // Reset ticket tiers to initial values
  const resetTiers = useCallback(() => {
    if (initialGroupsRef.current) {
      setLocalGroups(JSON.parse(initialGroupsRef.current));
    }
  }, []);

  const handleSave = useCallback(() => {
    saveGroups(localGroups);
    // Update initial state after successful save
    initialGroupsRef.current = JSON.stringify(localGroups);
  }, [saveGroups, localGroups]);

  const handleCapacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalCapacity(e.target.value);
    setCapacityDirty(true);
  };

  const handleCapacityBlur = () => {
    if (!capacityDirty) return;

    const numValue = localCapacity === '' ? null : parseInt(localCapacity, 10);
    if (numValue !== rsvpCapacity) {
      updateRsvpCapacity(isNaN(numValue as number) ? null : numValue);
    }
    setCapacityDirty(false);
  };

  const handleSubtitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSubtitle(e.target.value);
    setSubtitleDirty(true);
  };

  const handleSubtitleBlur = () => {
    if (!subtitleDirty) return;

    const newValue = localSubtitle.trim() || null;
    if (newValue !== rsvpButtonSubtitle) {
      updateRsvpButtonSubtitle(newValue);
    }
    setSubtitleDirty(false);
  };

  if (isLoading || isRsvpLoading || isFeeLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">{t('eventManagement.loadingTicketTiers')}</div>
      </div>
    );
  }

  // Calculate effective event fees for passing to groups/tiers
  const effectiveEventFees = feeSettings.use_default_fees
    ? {
        flatCents: globalFees.filter(f => f.fee_type === 'flat').reduce((sum, f) => sum + f.fee_value * 100, 0),
        pctBps: globalFees.filter(f => f.fee_type === 'percentage').reduce((sum, f) => sum + f.fee_value * 100, 0),
      }
    : {
        flatCents: feeSettings.fee_flat_cents,
        pctBps: feeSettings.fee_pct_bps,
      };

  return (
    <div className="space-y-6">
      {/* Event Fee Settings Section - hidden for RSVP-only events */}
      {!isRsvpOnlyEvent && (
        <EventFeeSettings
          eventId={eventId}
          useDefaultFees={feeSettings.use_default_fees}
          onUseDefaultFeesChange={useDefault => updateFeeSettings({ use_default_fees: useDefault })}
          isLoading={isFeeSaving}
        />
      )}

      {/* RSVP Settings Section */}
      <FmFormSection
        title={t('ticketing.rsvpSettings')}
        description={t('ticketing.rsvpSettingsDescription')}
        icon={Users}
      >
        <div className="space-y-4">
          {/* RSVP Toggle */}
          <div className="flex items-center gap-3 p-4 border border-border bg-card">
            <Users className="h-5 w-5 text-fm-gold" />
            <div className="flex-1">
              <Label htmlFor="rsvp-enabled" className="cursor-pointer font-medium">
                {t('ticketing.rsvpsEnabled')}
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                {t('ticketing.rsvpsEnabledDescription')}
              </p>
            </div>
            <FmCommonToggle
              id="rsvp-enabled"
              label={t('ticketing.rsvpsEnabled')}
              checked={isRsvpEnabled}
              onCheckedChange={toggleRsvpEnabled}
              disabled={isRsvpSaving}
              hideLabel
            />
          </div>

          {/* RSVP Options - only show when enabled */}
          {isRsvpEnabled && (
            <div className="p-4 border border-border bg-card space-y-4">
              {/* RSVP Only Event Toggle */}
              <div className="flex items-center gap-3 p-4 border border-border bg-card/50">
                <CalendarCheck className="h-5 w-5 text-fm-gold" />
                <div className="flex-1">
                  <Label htmlFor="rsvp-only-event" className="cursor-pointer font-medium">
                    {t('ticketing.rsvpOnlyEvent')}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('ticketing.rsvpOnlyEventDescription')}
                  </p>
                </div>
                <FmCommonToggle
                  id="rsvp-only-event"
                  label={t('ticketing.rsvpOnlyEvent')}
                  checked={isRsvpOnlyEvent}
                  onCheckedChange={toggleRsvpOnlyEvent}
                  disabled={isRsvpSaving}
                  hideLabel
                />
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4" />
                <span>{t('ticketing.rsvpCapacityInfo')}</span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  {t('ticketing.rsvpCapacity')}
                </Label>
                <FmCommonTextField
                  value={localCapacity}
                  onChange={handleCapacityChange}
                  onBlur={handleCapacityBlur}
                  placeholder={t('ticketing.unlimited')}
                  type="number"
                  min={1}
                />
                <p className="text-xs text-muted-foreground">
                  {t('ticketing.rsvpCapacityHint')}
                </p>
              </div>

              {/* RSVP Button Subtitle */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                  {t('ticketing.rsvpButtonSubtitle')}
                </Label>
                <FmCommonTextField
                  value={localSubtitle}
                  onChange={handleSubtitleChange}
                  onBlur={handleSubtitleBlur}
                  placeholder={t('ticketing.rsvpButtonSubtitlePlaceholder')}
                />
                <p className="text-xs text-muted-foreground">
                  {t('ticketing.rsvpButtonSubtitleHint')}
                </p>
              </div>

              {/* RSVP Email Notification Toggle */}
              <div className="flex items-center gap-3 p-4 border border-border bg-card/50">
                <Mail className="h-5 w-5 text-fm-gold" />
                <div className="flex-1">
                  <Label htmlFor="send-rsvp-email" className="cursor-pointer font-medium">
                    {t('ticketing.sendRsvpEmail')}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('ticketing.sendRsvpEmailDescription')}
                  </p>
                </div>
                <FmCommonToggle
                  id="send-rsvp-email"
                  label={t('ticketing.sendRsvpEmail')}
                  checked={sendRsvpEmail}
                  onCheckedChange={toggleSendRsvpEmail}
                  disabled={isRsvpSaving}
                  hideLabel
                />
              </div>
            </div>
          )}
        </div>
      </FmFormSection>

      {/* Ticket Tiers Section - hidden for RSVP-only events */}
      {!isRsvpOnlyEvent && (
        <FmFormSection
          title={t('eventManagement.ticketTierManagement')}
          description={t('eventManagement.ticketTierDescription')}
          icon={Ticket}
        >
          <TicketGroupManager
            groups={localGroups}
            onChange={setLocalGroups}
            eventFees={effectiveEventFees}
          />
        </FmFormSection>
      )}

      {/* Complimentary Tickets Section - hidden for RSVP-only events */}
      {!isRsvpOnlyEvent && (
        <FmFormSection
          title={t('ticketing.complimentaryTickets')}
          description={t('ticketing.complimentaryTicketsDescription')}
          icon={Gift}
        >
          <CompTicketManager eventId={eventId} />
        </FmFormSection>
      )}

      {/* Floating Save Button for Ticket Tiers - hidden for RSVP-only events */}
      {!isRsvpOnlyEvent && (
        <FmStickyFormFooter
          isDirty={isTiersDirty}
          isSaving={isSaving}
          onSave={handleSave}
          onUndo={resetTiers}
          hasSidebar
        />
      )}
    </div>
  );
};

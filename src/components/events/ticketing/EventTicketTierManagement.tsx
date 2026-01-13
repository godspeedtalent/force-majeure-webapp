import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Ticket, Users, Gift, Info } from 'lucide-react';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmFormSection } from '@/components/common/forms/FmFormSection';
import { FmCommonToggle } from '@/components/common/forms/FmCommonToggle';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { Label } from '@/components/common/shadcn/label';
import { TicketGroupManager } from './TicketGroupManager';
import { useEventTicketTiers } from './hooks/useEventTicketTiers';
import { useEventRsvpSettings } from '@/features/events/hooks/useEventRsvpSettings';
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
    rsvpCapacity,
    isLoading: isRsvpLoading,
    isSaving: isRsvpSaving,
    toggleRsvpEnabled,
    updateRsvpCapacity,
  } = useEventRsvpSettings(eventId);

  // Local state for capacity input
  const [localCapacity, setLocalCapacity] = useState<string>('');
  const [capacityDirty, setCapacityDirty] = useState(false);

  // Sync capacity from server
  if (rsvpCapacity !== null && !capacityDirty && localCapacity === '') {
    setLocalCapacity(rsvpCapacity.toString());
  }

  // Update local groups when data loads
  if (groups.length > 0 && localGroups.length === 0) {
    setLocalGroups(groups as TicketGroup[]);
  }

  const handleSave = () => {
    saveGroups(localGroups);
  };

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

  if (isLoading || isRsvpLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">{t('eventManagement.loadingTicketTiers')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
                {t('ticketing.rsvpsAvailable')}
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                {t('ticketing.rsvpsAvailableDescription')}
              </p>
            </div>
            <FmCommonToggle
              id="rsvp-enabled"
              label={t('ticketing.rsvpsAvailable')}
              checked={isRsvpEnabled}
              onCheckedChange={toggleRsvpEnabled}
              disabled={isRsvpSaving}
              hideLabel
            />
          </div>

          {/* RSVP Capacity - only show when enabled */}
          {isRsvpEnabled && (
            <div className="p-4 border border-border bg-card space-y-4">
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
            </div>
          )}
        </div>
      </FmFormSection>

      {/* Ticket Tiers Section */}
      <FmFormSection
        title={t('eventManagement.ticketTierManagement')}
        description={t('eventManagement.ticketTierDescription')}
        icon={Ticket}
      >
        <div className="space-y-4">
          <div className="flex justify-end">
            <FmCommonButton
              onClick={handleSave}
              loading={isSaving}
              icon={Save}
              variant="gold"
            >
              {isSaving ? t('buttons.saving') : t('buttons.saveChanges')}
            </FmCommonButton>
          </div>

          <TicketGroupManager
            groups={localGroups}
            onChange={setLocalGroups}
          />
        </div>
      </FmFormSection>

      {/* Complimentary Tickets Section */}
      <FmFormSection
        title={t('ticketing.complimentaryTickets')}
        description={t('ticketing.complimentaryTicketsDescription')}
        icon={Gift}
      >
        <CompTicketManager eventId={eventId} />
      </FmFormSection>
    </div>
  );
};

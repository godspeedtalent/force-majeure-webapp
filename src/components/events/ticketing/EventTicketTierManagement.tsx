import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Ticket } from 'lucide-react';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmFormSection } from '@/components/common/forms/FmFormSection';
import { TicketGroupManager } from './TicketGroupManager';
import { useEventTicketTiers } from './hooks/useEventTicketTiers';
import type { TicketGroup } from './ticket-group-manager/types';

interface EventTicketTierManagementProps {
  eventId: string;
}

export const EventTicketTierManagement = ({ eventId }: EventTicketTierManagementProps) => {
  const { t } = useTranslation('common');
  const { groups, isLoading, saveGroups, isSaving } = useEventTicketTiers(eventId);
  const [localGroups, setLocalGroups] = useState<TicketGroup[]>([]);

  // Update local groups when data loads
  if (groups.length > 0 && localGroups.length === 0) {
    setLocalGroups(groups as any);
  }

  const handleSave = () => {
    saveGroups(localGroups);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">{t('eventManagement.loadingTicketTiers')}</div>
      </div>
    );
  }

  return (
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
  );
};

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/common/shadcn/button';
import { Save } from 'lucide-react';
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{t('eventManagement.ticketTierManagement')}</h2>
          <p className="text-muted-foreground">
            {t('eventManagement.ticketTierDescription')}
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? t('buttons.saving') : t('buttons.saveChanges')}
        </Button>
      </div>

      <TicketGroupManager
        groups={localGroups}
        onChange={setLocalGroups}
      />
    </div>
  );
};

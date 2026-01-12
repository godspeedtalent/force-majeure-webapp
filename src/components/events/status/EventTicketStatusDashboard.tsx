import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, Users } from 'lucide-react';
import {
  FmCommonTabs,
  FmCommonTabsContent,
  FmCommonTabsList,
  FmCommonTabsTrigger,
} from '@/components/common/navigation/FmCommonTabs';
import { EventInventoryDashboard } from '@/components/events/inventory';
import { EventCheckInDashboard } from '@/components/events/checkin';

interface EventTicketStatusDashboardProps {
  eventId: string;
}

type StatusTab = 'inventory' | 'checkin';

/**
 * EventTicketStatusDashboard
 *
 * Main orchestrator component for the Ticket Status tab.
 * Provides tabbed navigation between:
 * - Inventory Dashboard (capacity, sold, remaining)
 * - Check-In Dashboard (attendees, scans, real-time feed)
 */
export const EventTicketStatusDashboard = ({
  eventId,
}: EventTicketStatusDashboardProps) => {
  const { t } = useTranslation('common');
  const [activeTab, setActiveTab] = useState<StatusTab>('inventory');

  return (
    <div className="space-y-6">
      <FmCommonTabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as StatusTab)}
        className="w-full"
      >
        <FmCommonTabsList className="grid w-full grid-cols-2 max-w-md">
          <FmCommonTabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            {t('ticketStatus.inventory')}
          </FmCommonTabsTrigger>
          <FmCommonTabsTrigger value="checkin" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            {t('ticketStatus.checkIn')}
          </FmCommonTabsTrigger>
        </FmCommonTabsList>

        <FmCommonTabsContent value="inventory" className="mt-6">
          <EventInventoryDashboard eventId={eventId} />
        </FmCommonTabsContent>

        <FmCommonTabsContent value="checkin" className="mt-6">
          <EventCheckInDashboard eventId={eventId} />
        </FmCommonTabsContent>
      </FmCommonTabs>
    </div>
  );
};

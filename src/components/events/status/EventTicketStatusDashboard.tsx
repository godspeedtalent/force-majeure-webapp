import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/common/shadcn/tabs';
import { EventInventoryDashboard } from '@/components/events/inventory';
import { EventCheckInDashboard } from '@/components/events/checkin';
import { cn } from '@/shared';

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
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as StatusTab)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 max-w-md bg-white/5 rounded-none p-1">
          <TabsTrigger
            value="inventory"
            className={cn(
              'flex items-center gap-2 rounded-none transition-all',
              'data-[state=active]:bg-fm-gold data-[state=active]:text-black',
              'data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground'
            )}
          >
            <Package className="w-4 h-4" />
            {t('ticketStatus.inventory')}
          </TabsTrigger>
          <TabsTrigger
            value="checkin"
            className={cn(
              'flex items-center gap-2 rounded-none transition-all',
              'data-[state=active]:bg-fm-gold data-[state=active]:text-black',
              'data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground'
            )}
          >
            <Users className="w-4 h-4" />
            {t('ticketStatus.checkIn')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="mt-6">
          <EventInventoryDashboard eventId={eventId} />
        </TabsContent>

        <TabsContent value="checkin" className="mt-6">
          <EventCheckInDashboard eventId={eventId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

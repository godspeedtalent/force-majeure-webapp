import { Label } from '@/components/ui/label';
import { FmEventSearchDropdown } from '@/components/ui/FmEventSearchDropdown';
import { FmCreateEventButton } from '@/components/ui/FmCreateEventButton';
import { FmEditEventButton } from '@/components/ui/FmEditEventButton';

interface EventCheckoutDemoToolsProps {
  selectedEventId: string | undefined;
  onEventChange: (eventId: string) => void;
}

export const EventCheckoutDemoTools = ({
  selectedEventId,
  onEventChange,
}: EventCheckoutDemoToolsProps) => {
  const handleEventCreated = (eventId: string) => {
    onEventChange(eventId);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label htmlFor="event-select" className="text-white">
          Select Event
        </Label>
        <FmEventSearchDropdown
          value={selectedEventId}
          onChange={onEventChange}
          placeholder="Search for an event..."
        />
      </div>

      <div className="space-y-3">
        <Label className="text-white">Quick Actions</Label>
        <div className="flex gap-2">
          <FmCreateEventButton 
            onEventCreated={handleEventCreated}
            variant="outline"
            className="flex-1"
          />
          {selectedEventId && (
            <FmEditEventButton
              eventId={selectedEventId}
              onEventUpdated={() => {
                // Refresh the event selection to show updated data
                onEventChange(selectedEventId);
              }}
              trigger={
                <button className="flex-1 inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-white/20 bg-white/5 hover:bg-white/10 text-white h-10 px-4 py-2 rounded-md">
                  Edit Event
                </button>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
};


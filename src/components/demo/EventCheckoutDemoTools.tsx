import { Label } from '@/components/ui/label';
import { FmEventSearchDropdown } from '@/components/ui/FmEventSearchDropdown';
import { FmCreateEventButton } from '@/components/ui/FmCreateEventButton';

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
        <FmCreateEventButton 
          onEventCreated={handleEventCreated}
          variant="outline"
          className="w-full"
        />
      </div>
    </div>
  );
};


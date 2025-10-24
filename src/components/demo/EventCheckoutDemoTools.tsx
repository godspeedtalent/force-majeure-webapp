import { Label } from '@/components/ui/label';
import { FmEventSearchDropdown } from '@/components/ui/FmEventSearchDropdown';

interface EventCheckoutDemoToolsProps {
  selectedEventId: string | undefined;
  onEventChange: (eventId: string) => void;
}

export const EventCheckoutDemoTools = ({
  selectedEventId,
  onEventChange,
}: EventCheckoutDemoToolsProps) => {
  return (
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
  );
};

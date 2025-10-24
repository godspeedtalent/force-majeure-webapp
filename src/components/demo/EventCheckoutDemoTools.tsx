import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEvents } from '@/features/events/hooks/useEvents';
import { format } from 'date-fns';

interface EventCheckoutDemoToolsProps {
  selectedEventId: string | undefined;
  onEventChange: (eventId: string) => void;
}

export const EventCheckoutDemoTools = ({
  selectedEventId,
  onEventChange,
}: EventCheckoutDemoToolsProps) => {
  const { data: events, isLoading } = useEvents();

  if (isLoading) {
    return <div className="text-white/60 text-sm">Loading events...</div>;
  }

  if (!events || events.length === 0) {
    return <div className="text-white/60 text-sm">No events available</div>;
  }

  return (
    <div className="space-y-3">
      <Label htmlFor="event-select" className="text-white">
        Select Event
      </Label>
      <Select value={selectedEventId} onValueChange={onEventChange}>
        <SelectTrigger
          id="event-select"
          className="bg-white/5 border-white/30 text-white hover:bg-white/10 hover:border-fm-gold hover:text-fm-gold transition-all"
        >
          <SelectValue placeholder="Choose an event" />
        </SelectTrigger>
        <SelectContent className="bg-black/90 backdrop-blur-md border-white/20">
          {events.map((event) => (
            <SelectItem
              key={event.id}
              value={event.id}
              className="text-white hover:bg-white/10 hover:text-fm-gold"
            >
              <div className="flex flex-col">
                <span className="font-medium">{event.title}</span>
                <span className="text-xs text-white/60">
                  {format(new Date(event.date), 'MMM d, yyyy')}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

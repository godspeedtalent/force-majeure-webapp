import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileEdit, Dices } from 'lucide-react';
import { Label } from '@/components/ui/shadcn/label';
import { Button } from '@/components/ui/shadcn/button';
import { FmEventSearchDropdown } from '@/components/ui/search/FmEventSearchDropdown';
import { FmCreateEventButton } from '@/components/ui/buttons/FmCreateEventButton';
import { FmEditEventButton } from '@/components/ui/buttons/FmEditEventButton';
import { TestEventDataService } from '@/services/testData/TestEventDataService';
import { toast } from 'sonner';

interface EventCheckoutDemoToolsProps {
  selectedEventId: string | undefined;
  onEventChange: (eventId: string) => void;
  onEventUpdated?: () => void;
}

export const EventCheckoutDemoTools = ({
  selectedEventId,
  onEventChange,
  onEventUpdated,
}: EventCheckoutDemoToolsProps) => {
  const navigate = useNavigate();
  const [isCreatingRandomEvent, setIsCreatingRandomEvent] = useState(false);

  const handleEventCreated = (eventId: string) => {
    onEventChange(eventId);
  };

  const handleCreateRandomEvent = async () => {
    setIsCreatingRandomEvent(true);
    try {
      const testService = new TestEventDataService();
      const eventId = await testService.createTestEvent();

      toast.success('Random test event created!', {
        description: 'Event has been generated with randomized data',
      });

      // Select the newly created event
      onEventChange(eventId);
      onEventUpdated?.();
    } catch (error) {
      console.error('Error creating random event:', error);
      toast.error('Failed to create random event', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setIsCreatingRandomEvent(false);
    }
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
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleCreateRandomEvent}
            disabled={isCreatingRandomEvent}
          >
            <Dices className="h-4 w-4 mr-2" />
            {isCreatingRandomEvent ? 'Creating...' : 'Random Event'}
          </Button>
          <FmCreateEventButton
            onEventCreated={handleEventCreated}
            variant="outline"
            className="flex-1"
          />
          {selectedEventId && (
            <>
              <FmEditEventButton
                eventId={selectedEventId}
                onEventUpdated={() => {
                  onEventChange(selectedEventId);
                  onEventUpdated?.();
                }}
                trigger={
                  <button className="flex-1 inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-white/20 bg-white/5 hover:bg-white/10 text-white h-10 px-4 py-2 rounded-md">
                    Quick Edit
                  </button>
                }
              />
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate(`/event/${selectedEventId}/manage`)}
              >
                <FileEdit className="h-4 w-4 mr-2" />
                Manage Event
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};


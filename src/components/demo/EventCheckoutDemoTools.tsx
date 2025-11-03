import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileEdit, Dices } from 'lucide-react';
import { Label } from '@/components/common/shadcn/label';
import { Button } from '@/components/common/shadcn/button';
import { FmEventSearchDropdown } from '@/components/common/search/FmEventSearchDropdown';
import { FmCreateEventButton } from '@/components/common/buttons/FmCreateEventButton';
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
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate(`/event/${selectedEventId}/manage`)}
            >
              <FileEdit className="h-4 w-4 mr-2" />
              Manage Event
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};


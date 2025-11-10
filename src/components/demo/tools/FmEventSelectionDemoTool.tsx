import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileEdit, Dices, Shuffle } from 'lucide-react';
import { Label } from '@/components/common/shadcn/label';
import { Button } from '@/components/common/shadcn/button';
import { FmEventSearchDropdown } from '@/components/common/search/FmEventSearchDropdown';
import { FmCreateEventButton } from '@/components/common/buttons/FmCreateEventButton';
import { TestEventDataService } from '@/services/testData/TestEventDataService';
import { supabase } from '@/shared/api/supabase/client';
import { toast } from 'sonner';
import { FmCommonDemoTool } from '../types/FmCommonDemoTool';

interface FmEventSelectionDemoToolProps {
  selectedEventId: string | undefined;
  onEventChange: (eventId: string) => void;
  onEventUpdated?: () => void;
}

export const FmEventSelectionDemoTool = ({
  selectedEventId,
  onEventChange,
  onEventUpdated,
}: FmEventSelectionDemoToolProps): FmCommonDemoTool => {
  const navigate = useNavigate();
  const [isCreatingRandomEvent, setIsCreatingRandomEvent] = useState(false);
  const [isSelectingRandom, setIsSelectingRandom] = useState(false);

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

      onEventChange(eventId);
      onEventUpdated?.();
    } catch (error) {
      logger.error('Error creating random event:', error);
      toast.error('Failed to create random event', {
        description:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      });
    } finally {
      setIsCreatingRandomEvent(false);
    }
  };

  const handleSelectRandomEvent = async () => {
    setIsSelectingRandom(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      if (data && data.length > 0) {
        const randomEvent = data[Math.floor(Math.random() * data.length)];
        onEventChange(randomEvent.id);
        toast.success('Random event selected');
      } else {
        toast.error('No events found in database');
      }
    } catch (error) {
      logger.error('Error selecting random event:', error);
      toast.error('Failed to select random event');
    } finally {
      setIsSelectingRandom(false);
    }
  };

  return {
    id: 'event-selection',
    label: 'Event Selection',
    render: () => (
      <div className='space-y-6'>
        <div className='space-y-3'>
          <Label htmlFor='event-select' className='text-white'>
            Select Event
          </Label>
          <div className='flex gap-2'>
            <div className='flex-1'>
              <FmEventSearchDropdown
                value={selectedEventId}
                onChange={onEventChange}
                placeholder='Search for an event...'
              />
            </div>
            <Button
              variant='outline'
              onClick={handleSelectRandomEvent}
              disabled={isSelectingRandom}
              className='flex-shrink-0'
            >
              <Shuffle className='h-4 w-4 mr-2' />
              {isSelectingRandom ? 'Selecting...' : 'Select Random Event'}
            </Button>
          </div>
        </div>

        <div className='space-y-3'>
          <Label className='text-white'>Quick Actions</Label>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              className='flex-1'
              onClick={handleCreateRandomEvent}
              disabled={isCreatingRandomEvent}
            >
              <Dices className='h-4 w-4 mr-2' />
              {isCreatingRandomEvent ? 'Creating...' : 'Create Random Event'}
            </Button>
            <FmCreateEventButton
              onEventCreated={handleEventCreated}
              variant='outline'
              className='flex-1 justify-center'
            />
            {selectedEventId && (
              <Button
                variant='outline'
                className='flex-1'
                onClick={() => navigate(`/event/${selectedEventId}/manage`)}
              >
                <FileEdit className='h-4 w-4 mr-2' />
                Manage Event
              </Button>
            )}
          </div>
        </div>
      </div>
    ),
  };
};

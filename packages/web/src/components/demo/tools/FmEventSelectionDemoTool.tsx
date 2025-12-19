import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FileEdit, Dices, Shuffle, Plus } from 'lucide-react';
import { Label } from '@/components/common/shadcn/label';
import { Button } from '@/components/common/shadcn/button';
import { FmEventSearchDropdown } from '@/components/common/search/FmEventSearchDropdown';
import { logger } from '@force-majeure/shared';
import { TestEventDataService } from '@/services/testData/TestEventDataService';
import { supabase } from '@force-majeure/shared';
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
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [isCreatingRandomEvent, setIsCreatingRandomEvent] = useState(false);
  const [isSelectingRandom, setIsSelectingRandom] = useState(false);


  const handleCreateRandomEvent = async () => {
    setIsCreatingRandomEvent(true);
    try {
      const testService = new TestEventDataService();
      const eventId = await testService.createTestEvent();

      toast.success(t('demoTools.randomEventCreated'), {
        description: t('demoTools.randomEventDescription'),
      });

      onEventChange(eventId);
      onEventUpdated?.();
    } catch (error) {
      logger.error('Error creating random event:', { error: error instanceof Error ? error.message : 'Unknown' });
      toast.error(t('demoTools.randomEventFailed'), {
        description:
          error instanceof Error
            ? error.message
            : t('errors.genericError'),
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
        toast.success(t('demoTools.randomEventSelected'));
      } else {
        toast.error(t('demoTools.noEventsFound'));
      }
    } catch (error) {
      logger.error('Error selecting random event:', { error: error instanceof Error ? error.message : 'Unknown' });
      toast.error(t('demoTools.selectRandomFailed'));
    } finally {
      setIsSelectingRandom(false);
    }
  };

  return {
    id: 'event-selection',
    label: t('demoTools.eventSelection'),
    render: () => (
      <div className='space-y-6'>
        <div className='space-y-3'>
          <Label htmlFor='event-select' className='text-white'>
            {t('demoTools.selectEvent')}
          </Label>
          <div className='flex gap-2'>
            <div className='flex-1'>
              <FmEventSearchDropdown
                value={selectedEventId}
                onChange={onEventChange}
                placeholder={t('placeholders.searchEvent')}
              />
            </div>
            <Button
              variant='outline'
              onClick={handleSelectRandomEvent}
              disabled={isSelectingRandom}
              className='flex-shrink-0'
            >
              <Shuffle className='h-4 w-4 mr-2' />
              {isSelectingRandom ? t('status.selecting') : t('demoTools.selectRandomEvent')}
            </Button>
          </div>
        </div>

        <div className='space-y-3'>
          <Label className='text-white'>{t('demoTools.quickActions')}</Label>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              className='flex-1'
              onClick={handleCreateRandomEvent}
              disabled={isCreatingRandomEvent}
            >
              <Dices className='h-4 w-4 mr-2' />
              {isCreatingRandomEvent ? t('status.creating') : t('demoTools.createRandomEvent')}
            </Button>
            <Button
              variant='outline'
              className='flex-1'
              onClick={() => navigate('/events/create')}
            >
              <Plus className='h-4 w-4 mr-2' />
              {t('demoTools.createEvent')}
            </Button>
            {selectedEventId && (
              <Button
                variant='outline'
                className='flex-1'
                onClick={() => navigate(`/event/${selectedEventId}/manage`)}
              >
                <FileEdit className='h-4 w-4 mr-2' />
                {t('demoTools.manageEvent')}
              </Button>
            )}
          </div>
        </div>
      </div>
    ),
  };
};

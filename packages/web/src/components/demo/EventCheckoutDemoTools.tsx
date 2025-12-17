import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '@force-majeure/shared';
import { useNavigate } from 'react-router-dom';
import { FileEdit, Dices } from 'lucide-react';
import { Label } from '@/components/common/shadcn/label';
import { Button } from '@/components/common/shadcn/button';
import { FmEventSearchDropdown } from '@/components/common/search/FmEventSearchDropdown';
import { Plus } from 'lucide-react';
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
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [isCreatingRandomEvent, setIsCreatingRandomEvent] = useState(false);


  const handleCreateRandomEvent = async () => {
    setIsCreatingRandomEvent(true);
    try {
      const testService = new TestEventDataService();
      const eventId = await testService.createTestEvent();

      toast.success(t('demoTools.randomEventCreated'), {
        description: t('demoTools.randomEventDescription'),
      });

      // Select the newly created event
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

  return (
    <div className='space-y-6'>
      <div className='space-y-3'>
        <Label htmlFor='event-select' className='text-white'>
          {t('demoTools.selectEvent')}
        </Label>
        <FmEventSearchDropdown
          value={selectedEventId}
          onChange={onEventChange}
          placeholder={t('placeholders.searchEvent')}
        />
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
            {isCreatingRandomEvent ? t('status.creating') : t('demoTools.randomEvent')}
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
  );
};

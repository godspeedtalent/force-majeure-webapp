import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/common/shadcn/label';
import { Input } from '@/components/common/shadcn/input';
import { FmCommonCheckbox } from '@/components/common/forms/FmCommonCheckbox';
import { FmArtistSearchDropdown } from '@/components/common/search/FmArtistSearchDropdown';
import { FmVenueSearchDropdown } from '@/components/common/search/FmVenueSearchDropdown';
import { FmCommonDatePicker } from '@/components/common/forms/FmCommonDatePicker';
import { FmCommonTimePicker } from '@/components/common/forms/FmCommonTimePicker';
import { EventFormState } from '../hooks/useEventData';

/**
 * EventDetailsSection Component
 *
 * Reusable form section for event basic details:
 * - Headliner selection
 * - Date and time
 * - Venue selection
 * - Hero image URL
 *
 * Shared between create and edit event flows.
 */

interface EventDetailsSectionProps {
  formState: EventFormState;
  setFormState: React.Dispatch<React.SetStateAction<EventFormState>>;
}

export const EventDetailsSection = ({
  formState,
  setFormState,
}: EventDetailsSectionProps) => {
  const { t } = useTranslation('common');

  const handleStartTimeChange = (time: string) => {
    if (formState.eventDate) {
      const [hours, minutes] = time.split(':');
      const newDate = new Date(formState.eventDate);
      newDate.setHours(parseInt(hours), parseInt(minutes));
      setFormState(prev => ({ ...prev, eventDate: newDate }));
    }
  };

  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <Label className='text-white'>{t('formLabels.headliner')}</Label>
        <FmArtistSearchDropdown
          value={formState.headlinerId}
          onChange={value =>
            setFormState(prev => ({ ...prev, headlinerId: value }))
          }
          placeholder={t('placeholders.events.searchHeadliner')}
        />
      </div>

      <div className='space-y-2'>
        <Label className='text-white'>{t('formLabels.date')}</Label>
        <FmCommonDatePicker
          value={formState.eventDate}
          onChange={value =>
            setFormState(prev => ({ ...prev, eventDate: value }))
          }
          placeholder={t('placeholders.events.selectEventDate')}
        />
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label className='text-white'>{t('formLabels.startTime')}</Label>
          <FmCommonTimePicker
            value={
              formState.eventDate
                ? format(formState.eventDate, 'HH:mm')
                : '20:00'
            }
            onChange={handleStartTimeChange}
            placeholder={t('placeholders.events.selectStartTime')}
          />
        </div>
        <div className='space-y-2'>
          <Label className='text-white'>{t('formLabels.endTime')}</Label>
          <FmCommonTimePicker
            value={formState.endTime}
            onChange={value =>
              setFormState(prev => ({ ...prev, endTime: value }))
            }
            disabled={formState.isAfterHours}
            placeholder={t('placeholders.events.selectEndTime')}
          />
        </div>
      </div>

      <div className='flex items-center gap-2'>
        <FmCommonCheckbox
          id='after-hours'
          checked={formState.isAfterHours}
          onCheckedChange={checked =>
            setFormState(prev => ({ ...prev, isAfterHours: checked }))
          }
        />
        <Label htmlFor='after-hours' className='text-white/70 cursor-pointer'>
          {t('formLabels.afterHoursEvent')}
        </Label>
      </div>

      <div className='space-y-2'>
        <Label className='text-white'>{t('formLabels.venue')}</Label>
        <FmVenueSearchDropdown
          value={formState.venueId}
          onChange={value =>
            setFormState(prev => ({ ...prev, venueId: value }))
          }
          placeholder={t('placeholders.searchVenue')}
        />
      </div>

      <div className='space-y-2'>
        <Label className='text-white'>{t('eventOverview.heroImage')}</Label>
        <Input
          value={formState.heroImage}
          onChange={e =>
            setFormState(prev => ({ ...prev, heroImage: e.target.value }))
          }
          placeholder={t('placeholders.exampleImageUrl')}
          className='bg-black/40 border-white/20 text-white'
        />
      </div>
    </div>
  );
};

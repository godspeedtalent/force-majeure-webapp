import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/common/shadcn/label';
import { FmCommonCheckbox } from '@/components/common/forms/FmCommonCheckbox';
import { FmArtistSearchDropdown } from '@/components/common/search/FmArtistSearchDropdown';
import { FmVenueSearchDropdown } from '@/components/common/search/FmVenueSearchDropdown';
import { FmCommonDatePicker } from '@/components/common/forms/FmCommonDatePicker';
import { FmCommonTimePicker } from '@/components/common/forms/FmCommonTimePicker';
import { FmFlexibleImageUpload } from '@/components/common/forms/FmFlexibleImageUpload';
import { EventFormState, EventFormActions } from '../hooks/useEventFormState';

interface EventDetailsFormSectionProps {
  state: EventFormState;
  actions: EventFormActions;
  onImageUploadStateChange?: (isUploading: boolean) => void;
}

/**
 * EventDetailsFormSection
 *
 * Shared form section for event details (headliner, date/time, venue, hero image).
 * Used by both FmCreateEventButton and FmEditEventButton.
 */
export function EventDetailsFormSection({
  state,
  actions,
  onImageUploadStateChange
}: EventDetailsFormSectionProps) {
  const { t } = useTranslation('common');

  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <Label className='text-white'>
          {t('formLabels.eventTitle')} <span className='text-fm-danger'>*</span>
        </Label>
        <input
          type='text'
          value={state.title}
          onChange={e => actions.setTitle(e.target.value)}
          placeholder={t('forms.events.titlePlaceholder')}
          className='w-full px-3 py-2 bg-white/5 border border-white/20 rounded-md text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-fm-gold/50'
        />
      </div>

      <div className='space-y-2'>
        <Label className='text-white'>
          {t('formLabels.subtitleOptional')}
        </Label>
        <input
          type='text'
          value={state.subtitle}
          onChange={e => actions.setSubtitle(e.target.value)}
          placeholder={t('forms.events.subtitlePlaceholder')}
          className='w-full px-3 py-2 bg-white/5 border border-white/20 rounded-md text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-fm-gold/50'
        />
      </div>

      <div className='space-y-2'>
        <Label className='text-white'>
          {t('formLabels.headliner')} <span className='text-fm-danger'>*</span>
        </Label>
        <FmArtistSearchDropdown
          value={state.headlinerId}
          onChange={actions.setHeadlinerId}
          placeholder={t('forms.events.searchHeadliner')}
        />
      </div>

      <div className='space-y-2'>
        <Label className='text-white'>
          {t('formLabels.date')} <span className='text-fm-danger'>*</span>
        </Label>
        <FmCommonDatePicker
          value={state.eventDate}
          onChange={actions.setEventDate}
          placeholder={t('forms.events.selectEventDate')}
        />
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label className='text-white'>
            {t('formLabels.startTime')} <span className='text-fm-danger'>*</span>
          </Label>
          <FmCommonTimePicker
            value={state.eventDate ? format(state.eventDate, 'HH:mm') : '20:00'}
            onChange={time => {
              if (state.eventDate) {
                const [hours, minutes] = time.split(':');
                const newDate = new Date(state.eventDate);
                newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
                actions.setEventDate(newDate);
              }
            }}
            placeholder={t('forms.events.selectStartTime')}
          />
        </div>
        <div className='space-y-2'>
          <Label className='text-white'>
            {t('formLabels.endTime')} <span className='text-fm-danger'>*</span>
          </Label>
          <FmCommonTimePicker
            value={state.endTime}
            onChange={actions.setEndTime}
            disabled={state.isAfterHours}
            placeholder={t('forms.events.selectEndTime')}
          />
        </div>
      </div>

      <div className='space-y-1'>
        <div className='flex items-center gap-2'>
          <FmCommonCheckbox
            id='after-hours'
            checked={state.isAfterHours}
            onCheckedChange={checked => actions.setIsAfterHours(checked)}
          />
          <Label htmlFor='after-hours' className='text-white/70 cursor-pointer'>
            {t('formLabels.afterHoursEvent')}
          </Label>
        </div>
        <p className='text-xs text-white/50 ml-6'>
          {t('formLabels.afterHoursHelp')}
        </p>
      </div>

      <div className='space-y-1'>
        <div className='flex items-center gap-2'>
          <FmCommonCheckbox
            id='tba-event'
            checked={state.isTba}
            onCheckedChange={checked => actions.setIsTba(checked)}
          />
          <Label htmlFor='tba-event' className='text-white/70 cursor-pointer'>
            {t('formLabels.tbaEvent')}
          </Label>
        </div>
        <p className='text-xs text-white/50 ml-6'>
          {t('formLabels.tbaEventHelp')}
        </p>
      </div>

      <div className='space-y-2'>
        <Label className='text-white'>
          {t('formLabels.venue')} <span className='text-fm-danger'>*</span>
        </Label>
        <FmVenueSearchDropdown
          value={state.venueId}
          onChange={actions.setVenueId}
          placeholder={t('placeholders.searchVenue')}
        />
      </div>

      <div className='space-y-2'>
        <FmFlexibleImageUpload
          label={t('formLabels.mainEventImage')}
          value={state.heroImage}
          onChange={actions.setHeroImage}
          bucket='event-images'
          pathPrefix='events'
          onUploadStateChange={onImageUploadStateChange}
        />
      </div>
    </div>
  );
}

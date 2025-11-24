import { format } from 'date-fns';
import { Label } from '@/components/common/shadcn/label';
import { Checkbox } from '@/components/common/shadcn/checkbox';
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
  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <Label className='text-white'>
          Headliner <span className='text-fm-danger'>*</span>
        </Label>
        <FmArtistSearchDropdown
          value={state.headlinerId}
          onChange={actions.setHeadlinerId}
          placeholder='Search for headliner artist...'
        />
      </div>

      <div className='space-y-2'>
        <Label className='text-white'>
          Date <span className='text-fm-danger'>*</span>
        </Label>
        <FmCommonDatePicker
          value={state.eventDate}
          onChange={actions.setEventDate}
          placeholder='Select event date'
        />
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label className='text-white'>
            Start Time <span className='text-fm-danger'>*</span>
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
            placeholder='Select start time'
          />
        </div>
        <div className='space-y-2'>
          <Label className='text-white'>
            End Time <span className='text-fm-danger'>*</span>
          </Label>
          <FmCommonTimePicker
            value={state.endTime}
            onChange={actions.setEndTime}
            disabled={state.isAfterHours}
            placeholder='Select end time'
          />
        </div>
      </div>

      <div className='space-y-1'>
        <div className='flex items-center gap-2'>
          <Checkbox
            id='after-hours'
            checked={state.isAfterHours}
            onCheckedChange={checked => actions.setIsAfterHours(checked === true)}
          />
          <Label htmlFor='after-hours' className='text-white/70 cursor-pointer'>
            After Hours Event
          </Label>
        </div>
        <p className='text-xs text-white/50 ml-6'>
          Check this if the event has no defined end time (end time not required)
        </p>
      </div>

      <div className='space-y-2'>
        <Label className='text-white'>
          Venue <span className='text-fm-danger'>*</span>
        </Label>
        <FmVenueSearchDropdown
          value={state.venueId}
          onChange={actions.setVenueId}
          placeholder='Search for venue...'
        />
      </div>

      <div className='space-y-2'>
        <FmFlexibleImageUpload
          label='Main Event Image'
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

import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, AlertTriangle, FileText, Calendar } from 'lucide-react';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmVenueSearchDropdown } from '@/components/common/search/FmVenueSearchDropdown';
import { FmArtistSearchDropdown } from '@/components/common/search/FmArtistSearchDropdown';
import { FmCommonDatePicker } from '@/components/common/forms/FmCommonDatePicker';
import { FmCommonTimePicker } from '@/components/common/forms/FmCommonTimePicker';
import { FmCommonModal } from '@/components/common/modals/FmCommonModal';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { Label } from '@/components/common/shadcn/label';
import { FmCommonCheckbox } from '@/components/common/forms/FmCommonCheckbox';
import { FmFormSection } from '@/components/common/forms/FmFormSection';
import { useEventOverviewForm } from '@/features/events/hooks';

interface EventOverviewFormProps {
  eventId: string;
  event: {
    headliner_id?: string | null;
    venue_id?: string | null;
    start_time?: string | null;
    end_time?: string | null;
    is_after_hours?: boolean;
    title?: string | null;
    description?: string | null;
    about_event?: string | null;
    display_subtitle?: boolean;
    status?: string;
  };
  orderCount: number;
  onMakeInvisible: () => Promise<void>;
  /** Callback to expose form state for parent save button */
  onFormStateChange?: (state: { isDirty: boolean; isSaving: boolean; onSave: () => void }) => void;
}

export const EventOverviewForm = ({
  eventId,
  event,
  orderCount,
  onMakeInvisible,
  onFormStateChange,
}: EventOverviewFormProps) => {
  const { t } = useTranslation('common');

  // State for past date confirmation modal
  const [pendingPastDate, setPendingPastDate] = useState<Date | null>(null);
  const [isPastDateModalOpen, setIsPastDateModalOpen] = useState(false);

  const {
    formState,
    setHeadlinerId,
    setVenueId,
    setEventDate,
    setEndTime,
    setIsAfterHours,
    setCustomTitle,
    setEventSubtitle,
    setAboutEvent,
    isSaving,
    isDirty,
    handleSave,
    triggerAutoSave,
    formattedStartTime,
  } = useEventOverviewForm({
    eventId,
    initialData: event,
  });

  // Expose form state to parent for sticky footer
  useEffect(() => {
    onFormStateChange?.({ isDirty, isSaving, onSave: handleSave });
  }, [isDirty, isSaving, handleSave, onFormStateChange]);

  const {
    headlinerId,
    venueId,
    eventDate,
    endTime,
    isAfterHours,
    customTitle,
    eventSubtitle,
    aboutEvent,
  } = formState;

  // Handle date change with past date confirmation
  const handleDateChange = useCallback((value: Date | undefined) => {
    if (!value) {
      setEventDate(undefined);
      triggerAutoSave();
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(value);
    selectedDate.setHours(0, 0, 0, 0);

    // Check if selected date is in the past
    if (selectedDate < today) {
      setPendingPastDate(value);
      setIsPastDateModalOpen(true);
    } else {
      setEventDate(value);
      triggerAutoSave();
    }
  }, [setEventDate, triggerAutoSave]);

  // Confirm past date selection
  const handleConfirmPastDate = useCallback(() => {
    if (pendingPastDate) {
      setEventDate(pendingPastDate);
      triggerAutoSave();
    }
    setPendingPastDate(null);
    setIsPastDateModalOpen(false);
  }, [pendingPastDate, setEventDate, triggerAutoSave]);

  // Cancel past date selection
  const handleCancelPastDate = useCallback(() => {
    setPendingPastDate(null);
    setIsPastDateModalOpen(false);
  }, []);

  return (
    <div className='space-y-6'>
      {/* Basic Information Section */}
      <FmFormSection
        title={t('eventOverview.eventOverview')}
        description={t('eventOverview.basicEventInfo')}
        icon={FileText}
      >
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {/* Event Title */}
          <FmCommonTextField
            label={t('eventOverview.eventTitle')}
            required
            id='event-title'
            value={customTitle}
            onChange={e => {
              setCustomTitle(e.target.value);
              triggerAutoSave();
            }}
            placeholder={t('eventOverview.enterEventTitle')}
          />

          {/* Event Subtitle */}
          <FmCommonTextField
            label={t('eventOverview.subtitleOptional')}
            id='event-subtitle'
            value={eventSubtitle}
            onChange={e => {
              setEventSubtitle(e.target.value);
              triggerAutoSave();
            }}
            placeholder={t('eventOverview.enterEventSubtitle')}
          />

          {/* Headliner */}
          <div className='space-y-2'>
            <Label htmlFor='headliner' className='text-xs uppercase tracking-wider text-muted-foreground'>
              {t('eventOverview.headliner')} <span className='text-destructive'>*</span>
            </Label>
            <FmArtistSearchDropdown
              value={headlinerId}
              onChange={value => {
                setHeadlinerId(value);
                triggerAutoSave();
              }}
              placeholder={t('placeholders.selectHeadliner')}
            />
          </div>

          {/* Venue */}
          <div className='space-y-2'>
            <Label htmlFor='venue' className='text-xs uppercase tracking-wider text-muted-foreground'>
              {t('eventOverview.venue')} <span className='text-destructive'>*</span>
            </Label>
            <FmVenueSearchDropdown
              value={venueId}
              onChange={value => {
                setVenueId(value);
                triggerAutoSave();
              }}
              placeholder={t('placeholders.selectVenue')}
            />
          </div>

          {/* About This Event Description */}
          <div className='md:col-span-2'>
            <FmCommonTextField
              label={t('eventOverview.aboutEventOptional')}
              id='about-event'
              multiline
              autoSize
              minRows={3}
              maxRows={10}
              value={aboutEvent}
              onChange={e => {
                setAboutEvent(e.target.value);
                triggerAutoSave();
              }}
              placeholder={t('eventOverview.enterEventDescription')}
            />
          </div>
        </div>
      </FmFormSection>

      {/* Date & Time Section */}
      <FmFormSection
        title={t('eventOverview.dateAndTime')}
        description={t('eventOverview.dateAndTimeDescription')}
        icon={Calendar}
      >
        <div className='space-y-4'>
          {/* Event Date */}
          <div className='space-y-2'>
            <Label className='text-xs uppercase tracking-wider text-muted-foreground'>
              {t('eventOverview.eventDate')}{' '}
              <span className='text-destructive'>*</span>
            </Label>
            <FmCommonDatePicker
              value={eventDate}
              onChange={handleDateChange}
              disablePastDates={false}
            />
          </div>

          {/* Start Time & End Time row - stacked on mobile, side by side on desktop */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {/* Start Time */}
            <div className='space-y-2'>
              <Label className='text-xs uppercase tracking-wider text-muted-foreground'>
                {t('eventOverview.startTime')}{' '}
                <span className='text-destructive'>*</span>
              </Label>
              <FmCommonTimePicker
                value={formattedStartTime}
                onChange={(time: string) => {
                  if (eventDate) {
                    const [hours, minutes] = time.split(':');
                    const newDate = new Date(eventDate);
                    newDate.setHours(
                      parseInt(hours),
                      parseInt(minutes)
                    );
                    setEventDate(newDate);
                    triggerAutoSave();
                  }
                }}
              />
            </div>

            {/* End Time */}
            <div className='space-y-2'>
              <Label className='text-xs uppercase tracking-wider text-muted-foreground'>
                {t('eventOverview.endTime')}
              </Label>
              <FmCommonTimePicker
                value={endTime}
                onChange={value => {
                  setEndTime(value);
                  triggerAutoSave();
                }}
                disabled={isAfterHours}
              />
            </div>
          </div>

          {/* After Hours Checkbox */}
          <div className='flex items-center gap-2'>
            <FmCommonCheckbox
              id='after-hours'
              checked={isAfterHours}
              onCheckedChange={checked => {
                setIsAfterHours(checked);
                triggerAutoSave();
              }}
            />
            <Label htmlFor='after-hours' className='cursor-pointer text-sm'>
              {t('eventOverview.afterHours')}
            </Label>
          </div>
        </div>
      </FmFormSection>

      {/* Event Visibility Control - only show if published */}
      {event.status === 'published' && (
        <FmFormSection
          title={t('eventOverview.eventVisibility')}
          description={t('eventOverview.eventVisibilityDescription')}
          icon={Eye}
          className='border-yellow-500/30'
        >
          <div className='p-4 bg-yellow-500/5 border border-yellow-500/20'>
            <p className='text-sm text-muted-foreground mb-4'>
              {orderCount > 0 && t('eventOverview.eventHasOrders', { count: orderCount, plural: orderCount === 1 ? '' : 's' })}
            </p>
            <FmCommonButton
              variant='secondary'
              icon={Eye}
              onClick={onMakeInvisible}
            >
              {t('eventOverview.makeInvisible')}
            </FmCommonButton>
          </div>
        </FmFormSection>
      )}

      {/* Past Date Confirmation Modal */}
      <FmCommonModal
        open={isPastDateModalOpen}
        onOpenChange={setIsPastDateModalOpen}
        title={t('eventOverview.pastDateConfirmation.title')}
        className='max-w-md'
      >
        <div className='flex flex-col gap-4'>
          <div className='flex items-start gap-3'>
            <div className='p-2 rounded-none bg-yellow-500/10'>
              <AlertTriangle className='h-5 w-5 text-yellow-500' />
            </div>
            <p className='text-sm text-muted-foreground'>
              {t('eventOverview.pastDateConfirmation.message')}
            </p>
          </div>
          <div className='flex justify-end gap-3'>
            <FmCommonButton
              variant='secondary'
              onClick={handleCancelPastDate}
            >
              {t('buttons.cancel')}
            </FmCommonButton>
            <FmCommonButton
              variant='default'
              onClick={handleConfirmPastDate}
            >
              {t('buttons.confirm')}
            </FmCommonButton>
          </div>
        </div>
      </FmCommonModal>
    </div>
  );
};

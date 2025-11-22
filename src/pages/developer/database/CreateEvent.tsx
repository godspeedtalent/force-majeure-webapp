import { Calendar, Mic2, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common/shadcn/button';
import { DemoLayout } from '@/components/demo/DemoLayout';
import { FmCommonLoadingOverlay } from '@/components/common/feedback/FmCommonLoadingOverlay';
import { FmFormFieldGroup } from '@/components/common/forms/FmFormFieldGroup';
import { useEventFormState } from '@/features/events/hooks/useEventFormState';
import { useEventFormSubmit } from '@/features/events/hooks/useEventFormSubmit';
import { EventDetailsFormSection } from '@/features/events/components/EventDetailsFormSection';
import { UndercardArtistsFormSection } from '@/features/events/components/UndercardArtistsFormSection';
import { TicketTiersFormSection } from '@/features/events/components/TicketTiersFormSection';

const DeveloperCreateEventPage = () => {
  const navigate = useNavigate();

  // Shared form state
  const { state, actions } = useEventFormState();

  // Shared submit logic
  const { submitEvent, isLoading } = useEventFormSubmit({
    mode: 'create',
    onSuccess: _eventId => {
      actions.resetForm();
      navigate('/developer/database');
    },
    onError: () => {
      // Stay on page on error
    },
  });

  const handleSubmit = async () => {
    await submitEvent(state);
  };

  const handleCancel = () => {
    actions.resetForm();
    navigate('/developer/database');
  };

  return (
    <>
      {isLoading && <FmCommonLoadingOverlay message='Creating event...' />}
      <DemoLayout
        title='Create Event'
        description='Configure a new event with headliners, ticket tiers, and venue details.'
        icon={Calendar}
        condensed
      >
        <div className='space-y-6'>
          <p className='text-sm text-muted-foreground'>
            Complete the form to add a new event to the database.
          </p>

          <div className='space-y-6'>
            <FmFormFieldGroup
              title='Event Details'
              icon={Calendar}
              layout='stack'
            >
              <EventDetailsFormSection state={state} actions={actions} />
            </FmFormFieldGroup>

            <FmFormFieldGroup
              title='Undercard Artists'
              icon={Mic2}
              layout='stack'
            >
              <UndercardArtistsFormSection state={state} actions={actions} />
            </FmFormFieldGroup>

            <FmFormFieldGroup
              title='Ticket Tiers'
              icon={Ticket}
              layout='stack'
            >
              <TicketTiersFormSection state={state} actions={actions} />
            </FmFormFieldGroup>
          </div>

          {/* Form Actions */}
          <div className='flex gap-3 justify-end pt-4 border-t border-white/20'>
            <Button
              variant='outline'
              onClick={handleCancel}
              disabled={isLoading}
              className='bg-white/5 border-white/20 hover:bg-white/10'
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className='bg-fm-gold hover:bg-fm-gold/90 text-black'
            >
              {isLoading ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </div>
      </DemoLayout>
    </>
  );
};

export default DeveloperCreateEventPage;

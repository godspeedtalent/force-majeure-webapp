import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Mic2, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { DemoLayout } from '@/components/demo/DemoLayout';
import { FmCommonLoadingOverlay } from '@/components/common/feedback/FmCommonLoadingOverlay';
import { FmFormFieldGroup } from '@/components/common/forms/FmFormFieldGroup';
import { useEventFormState } from '@/features/events/hooks/useEventFormState';
import { useEventFormSubmit } from '@/features/events/hooks/useEventFormSubmit';
import { EventDetailsFormSection } from '@/features/events/components/EventDetailsFormSection';
import { UndercardArtistsFormSection } from '@/features/events/components/UndercardArtistsFormSection';
import { TicketTiersFormSection } from '@/features/events/components/TicketTiersFormSection';

const DeveloperCreateEventPage = () => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [isImageUploading, setIsImageUploading] = useState(false);

  // Shared form state
  const { state, actions } = useEventFormState();

  // Shared submit logic
  const { submitEvent, isLoading } = useEventFormSubmit({
    mode: 'create',
    onSuccess: _eventId => {
      actions.resetForm();
      navigate('/developer/database?table=events');
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
    navigate('/developer/database?table=events');
  };

  return (
    <>
      {isLoading && <FmCommonLoadingOverlay message={t('developerPages.createEvent.loading')} />}
      <DemoLayout
        title={t('developerPages.createEvent.title')}
        description={t('developerPages.createEvent.description')}
        icon={Calendar}
        condensed
      >
        <div className='space-y-6'>
          <p className='text-sm text-muted-foreground'>
            {t('developerPages.createEvent.formDescription')}
          </p>

          <div className='space-y-6'>
            <FmFormFieldGroup
              title={t('developerPages.createEvent.sections.eventDetails')}
              icon={Calendar}
              layout='stack'
            >
              <EventDetailsFormSection
                state={state}
                actions={actions}
                onImageUploadStateChange={setIsImageUploading}
              />
            </FmFormFieldGroup>

            <FmFormFieldGroup
              title={t('developerPages.createEvent.sections.undercardArtists')}
              icon={Mic2}
              layout='stack'
            >
              <UndercardArtistsFormSection state={state} actions={actions} />
            </FmFormFieldGroup>

            <FmFormFieldGroup
              title={t('developerPages.createEvent.sections.ticketTiers')}
              icon={Ticket}
              layout='stack'
            >
              <TicketTiersFormSection state={state} actions={actions} />
            </FmFormFieldGroup>
          </div>

          {/* Form Actions */}
          <div className='flex gap-3 justify-end pt-4 border-t border-white/20'>
            <FmCommonButton
              variant='default'
              onClick={handleCancel}
              disabled={isLoading}
            >
              {t('buttons.cancel')}
            </FmCommonButton>
            <FmCommonButton
              variant='gold'
              onClick={handleSubmit}
              disabled={isLoading || isImageUploading}
              loading={isLoading}
            >
              {isImageUploading ? t('developerPages.createEvent.uploadingImage') : t('developerPages.createEvent.createButton')}
            </FmCommonButton>
          </div>
        </div>
      </DemoLayout>
    </>
  );
};

export default DeveloperCreateEventPage;

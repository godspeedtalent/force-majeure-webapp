import { useState } from 'react';
import { Button } from '@/components/common/shadcn/button';
import { FmCommonCreateButton } from '@/components/common/buttons/FmCommonCreateButton';
import { FmCommonFormModal } from '@/components/common/modals/FmCommonFormModal';
import { FmCommonLoadingOverlay } from '@/components/common/feedback/FmCommonLoadingOverlay';
import { useEventFormState } from '@/features/events/hooks/useEventFormState';
import { useEventFormSubmit } from '@/features/events/hooks/useEventFormSubmit';
import { EventDetailsFormSection } from '@/features/events/components/EventDetailsFormSection';
import { UndercardArtistsFormSection } from '@/features/events/components/UndercardArtistsFormSection';
import { TicketTiersFormSection } from '@/features/events/components/TicketTiersFormSection';

interface FmCreateEventButtonProps {
  onModalOpen?: () => void;
  onEventCreated?: (eventId: string) => void;
  variant?: 'default' | 'outline';
  className?: string;
  mode?: 'button' | 'standalone';
  onClose?: () => void;
}

/**
 * FmCreateEventButton
 *
 * Button and modal for creating new events.
 * Refactored to use shared form hooks and components.
 *
 * @see FmEditEventButton for the edit variant
 */

export const FmCreateEventButton = ({
  onModalOpen,
  onEventCreated,
  variant = 'outline',
  className,
  mode = 'button',
  onClose,
}: FmCreateEventButtonProps) => {
  const isStandalone = mode === 'standalone';
  const [isModalOpen, setIsModalOpen] = useState(isStandalone);

  // Shared form state
  const { state, actions } = useEventFormState();

  // Shared submit logic
  const { submitEvent, isLoading } = useEventFormSubmit({
    mode: 'create',
    onSuccess: eventId => {
      onEventCreated?.(eventId);
      actions.resetForm();
      setIsModalOpen(false);
      if (isStandalone) {
        onClose?.();
      }
    },
    onError: () => {
      // Keep modal open on error
      if (isStandalone) {
        setIsModalOpen(true);
      }
    },
  });

  const handleCreateEvent = () => {
    if (isStandalone) return;
    setIsModalOpen(true);
    onModalOpen?.();
  };

  const handleModalOpenChange = (open: boolean) => {
    setIsModalOpen(open);
    if (!open && isStandalone) {
      onClose?.();
    }
  };

  const handleSubmit = async () => {
    // Close modal before submitting (loading overlay will show)
    setIsModalOpen(false);
    await submitEvent(state);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    actions.resetForm();
    if (isStandalone) {
      onClose?.();
    }
  };

  return (
    <>
      {mode === 'button' && (
        <FmCommonCreateButton
          onClick={handleCreateEvent}
          label='Create Event'
          variant={variant}
          className={className}
        />
      )}

      {/* Loading Overlay */}
      {isLoading && <FmCommonLoadingOverlay message='Creating event...' />}

      <FmCommonFormModal
        open={isModalOpen}
        onOpenChange={handleModalOpenChange}
        title='Create New Event'
        description='Set up a new event with ticket tiers and details'
        className='max-w-3xl max-h-[90vh] overflow-y-auto'
        sections={[
          {
            title: 'Event Details',
            content: <EventDetailsFormSection state={state} actions={actions} />,
          },
          {
            title: 'Undercard Artists',
            content: <UndercardArtistsFormSection state={state} actions={actions} />,
          },
          {
            title: 'Ticket Tiers',
            content: <TicketTiersFormSection state={state} actions={actions} />,
          },
        ]}
        actions={
          <div className='flex gap-3'>
            <Button
              onClick={handleCancel}
              variant='outline'
              className='flex-1 border-white/20 hover:bg-white/10'
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className='flex-1 bg-fm-gold hover:bg-fm-gold/90 text-black'
            >
              Create Event
            </Button>
          </div>
        }
      />
    </>
  );
};

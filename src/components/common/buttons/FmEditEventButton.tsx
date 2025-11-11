import { useState, useEffect } from 'react';
import { parse } from 'date-fns';
import { Edit } from 'lucide-react';
import { Button } from '@/components/common/shadcn/button';
import { FmCommonFormModal } from '@/components/common/modals/FmCommonFormModal';
import { FmCommonLoadingOverlay } from '@/components/common/feedback/FmCommonLoadingOverlay';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { supabase } from '@/shared/api/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/shared/services/logger';
import { useEventFormState } from '@/features/events/hooks/useEventFormState';
import { useEventFormSubmit } from '@/features/events/hooks/useEventFormSubmit';
import { EventDetailsFormSection } from '@/features/events/components/EventDetailsFormSection';
import { UndercardArtistsFormSection } from '@/features/events/components/UndercardArtistsFormSection';
import { TicketTiersFormSection } from '@/features/events/components/TicketTiersFormSection';

interface FmEditEventButtonProps {
  eventId: string;
  onEventUpdated?: () => void;
  trigger?: React.ReactNode;
  autoOpen?: boolean;
}

/**
 * FmEditEventButton
 *
 * Button and modal for editing existing events.
 * Refactored to use shared form hooks and components.
 *
 * @see FmCreateEventButton for the create variant
 */
export const FmEditEventButton = ({
  eventId,
  onEventUpdated,
  trigger,
  autoOpen = false,
}: FmEditEventButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Shared form state
  const { state, actions } = useEventFormState();

  // Shared submit logic
  const { submitEvent, isLoading } = useEventFormSubmit({
    mode: 'edit',
    eventId,
    onSuccess: () => {
      onEventUpdated?.();
      setIsModalOpen(false);
      toast.success('Event updated successfully!');
    },
    onError: () => {
      // Keep modal open on error
      setIsModalOpen(true);
    },
  });

  // Auto-open modal if autoOpen is true
  useEffect(() => {
    if (autoOpen && eventId) {
      setIsModalOpen(true);
    }
  }, [autoOpen, eventId]);

  // Load event data when modal opens
  useEffect(() => {
    if (isModalOpen && eventId) {
      loadEventData();
    }
  }, [isModalOpen, eventId]);

  const loadEventData = async () => {
    setIsLoadingData(true);
    try {
      // Fetch event with related data
      const { data: event, error: eventError } = await (supabase as any)
        .from('events')
        .select(
          `
          *,
          ticket_tiers(*)
        `
        )
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;

      if (event) {
        // Populate form with existing data
        const headlinerId = (event as any).headliner_id || '';
        const venueId = (event as any).venue_id || '';
        const heroImage = (event as any).hero_image || '';
        const isAfterHours = (event as any).is_after_hours || false;
        const endTime = (event as any).end_time || '02:00';
        
        actions.setHeadlinerId(headlinerId);
        actions.setVenueId(venueId);
        actions.setHeroImage(heroImage);
        actions.setIsAfterHours(isAfterHours);
        actions.setEndTime(endTime);

        // Parse date and time
        const eventDate = (event as any).date;
        const eventTime = (event as any).time;
        if (eventDate) {
          const parsedDate = parse(
            `${eventDate} ${eventTime || '20:00'}`,
            'yyyy-MM-dd HH:mm',
            new Date()
          );
          actions.setEventDate(parsedDate);
        }

        // Load undercard artists
        const undercardIds = (event as any).undercard_ids;
        if (undercardIds && Array.isArray(undercardIds)) {
          actions.setUndercardArtists(
            undercardIds.map((artistId: string) => ({ artistId }))
          );
        }

        // Load ticket tiers
        if (event.ticket_tiers && Array.isArray(event.ticket_tiers)) {
          const tiers = event.ticket_tiers.map((tier: any) => ({
            id: tier.id,
            name: tier.name,
            description: tier.description || '',
            priceInCents: tier.price_cents,
            quantity: tier.total_tickets,
            hideUntilPreviousSoldOut: tier.hide_until_previous_sold_out || false,
          }));
          actions.setTicketTiers(tiers);
        }
      }
    } catch (error) {
      logger.error('Error loading event data:', { error: error instanceof Error ? error.message : 'Unknown' });
      toast.error('Failed to load event data', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleModalOpenChange = (open: boolean) => {
    setIsModalOpen(open);
  };

  const handleSubmit = async () => {
    // Close modal before submitting (loading overlay will show)
    setIsModalOpen(false);
    await submitEvent(state);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    actions.resetForm();
  };

  return (
    <>
      {trigger ? (
        <div onClick={handleOpenModal}>{trigger}</div>
      ) : (
        <Button
          onClick={handleOpenModal}
          variant='outline'
          className='border-white/20 hover:bg-white/10'
        >
          <Edit className='h-4 w-4 mr-2' />
          Edit Event
        </Button>
      )}

      {/* Loading Overlay */}
      {isLoading && <FmCommonLoadingOverlay message='Updating event...' />}

      <FmCommonFormModal
        open={isModalOpen}
        onOpenChange={handleModalOpenChange}
        title='Edit Event'
        description='Update event details, ticket tiers, and artists'
        className='max-w-3xl max-h-[90vh] overflow-y-auto'
        sections={
          isLoadingData
            ? [
                {
                  title: 'Loading...',
                  content: (
                    <div className='flex items-center justify-center py-12'>
                      <FmCommonLoadingSpinner size='lg' />
                    </div>
                  ),
                },
              ]
            : [
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
              ]
        }
        actions={
          isLoadingData ? null : (
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
                Update Event
              </Button>
            </div>
          )
        }
      />
    </>
  );
};

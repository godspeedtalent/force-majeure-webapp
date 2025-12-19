import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '@/shared';
import { supabase } from '@/shared';
import { toast } from 'sonner';
/**
 * useEventFormState
 *
 * Shared hook for managing event form state (both create and edit).
 * Eliminates duplicate state management code between FmCreateEventButton and FmEditEventButton.
 *
 * @param initialState - Optional initial state for editing existing events
 */
export function useEventFormState(initialState) {
    const { t } = useTranslation('common');
    const [title, setTitle] = useState(initialState?.title || '');
    const [subtitle, setSubtitle] = useState(initialState?.subtitle || '');
    const [headlinerId, setHeadlinerId] = useState(initialState?.headlinerId || '');
    const [eventDate, setEventDate] = useState(initialState?.eventDate);
    const [endTime, setEndTime] = useState(initialState?.endTime || '02:00');
    const [isAfterHours, setIsAfterHours] = useState(initialState?.isAfterHours || false);
    const [isTba, setIsTba] = useState(initialState?.isTba || false);
    const [venueId, setVenueId] = useState(initialState?.venueId || '');
    const [venueCapacity, setVenueCapacity] = useState(initialState?.venueCapacity || 0);
    const [undercardArtists, setUndercardArtists] = useState(initialState?.undercardArtists || []);
    const [ticketTiers, setTicketTiers] = useState(initialState?.ticketTiers || []);
    const [heroImage, setHeroImage] = useState(initialState?.heroImage || '');
    // Fetch venue capacity when venue changes
    useEffect(() => {
        if (venueId) {
            supabase
                .from('venues')
                .select('capacity')
                .eq('id', venueId)
                .single()
                .then(({ data, error }) => {
                if (error) {
                    logger.error('Error fetching venue capacity:', { error, venueId });
                    toast.error(t('eventForm.venueCapacityFailed'), {
                        description: t('eventForm.venueCapacityDefault'),
                    });
                    setVenueCapacity(100);
                    return;
                }
                if (data && data.capacity) {
                    setVenueCapacity(data.capacity);
                    // Only initialize default tiers if no tiers exist (for create mode)
                    if (ticketTiers.length === 0) {
                        const capacity = data.capacity;
                        setTicketTiers([
                            {
                                name: 'GA',
                                description: '',
                                priceInCents: 0,
                                quantity: capacity,
                                hideUntilPreviousSoldOut: false,
                            },
                        ]);
                    }
                }
            });
        }
    }, [venueId]); // Don't include ticketTiers to avoid infinite loop
    // Reset form helper
    const resetForm = useCallback(() => {
        setTitle('');
        setSubtitle('');
        setHeadlinerId('');
        setEventDate(undefined);
        setEndTime('02:00');
        setIsAfterHours(false);
        setIsTba(false);
        setVenueId('');
        setVenueCapacity(0);
        setUndercardArtists([]);
        setTicketTiers([]);
        setHeroImage('');
    }, []);
    const state = {
        title,
        subtitle,
        headlinerId,
        eventDate,
        endTime,
        isAfterHours,
        isTba,
        venueId,
        venueCapacity,
        undercardArtists,
        ticketTiers,
        heroImage,
    };
    const actions = {
        setTitle,
        setSubtitle,
        setHeadlinerId,
        setEventDate,
        setEndTime,
        setIsAfterHours,
        setIsTba,
        setVenueId,
        setVenueCapacity,
        setUndercardArtists,
        setTicketTiers,
        setHeroImage,
        resetForm,
    };
    return { state, actions };
}

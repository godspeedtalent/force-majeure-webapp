import { useQuery } from '@tanstack/react-query';
import { ticketTierService } from '@/features/ticketing/services/ticketTierService';
export const useTicketTiers = (eventId) => {
    return useQuery({
        queryKey: ['ticket-tiers', eventId],
        queryFn: async () => {
            if (!eventId)
                return [];
            return ticketTierService.getActiveTiersByEventId(eventId);
        },
        enabled: !!eventId,
    });
};

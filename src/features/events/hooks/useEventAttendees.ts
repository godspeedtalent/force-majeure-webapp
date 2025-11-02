import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase/client';

export function useEventAttendees(eventId: string) {
  return useQuery({
    queryKey: ['eventAttendees', eventId],
    queryFn: async () => {
      // Get total attendee count
      const { data: attendeeCount, error: countError } = await supabase
        .rpc('get_event_attendee_count', { p_event_id: eventId });

      if (countError) {
        console.error('Error fetching attendee count:', countError);
        throw countError;
      }

      // Get total ticket count
      const { data: ticketCount, error: ticketError } = await supabase
        .rpc('get_event_ticket_count', { p_event_id: eventId });

      if (ticketError) {
        console.error('Error fetching ticket count:', ticketError);
        throw ticketError;
      }

      return {
        attendeeCount: attendeeCount || 0,
        ticketCount: ticketCount || 0,
      };
    },
    enabled: !!eventId,
    // Refetch every 30 seconds for live updates
    refetchInterval: 30000,
    staleTime: 20000,
  });
}

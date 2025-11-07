import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase/client';

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  description?: string;
  hero_image?: string;
  venue_id?: string;
}

export const useEvents = () => {
  return useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select(
          `
          *,
          venue:venues(name),
          headliner:artists(name)
        `
        )
        .order('date', { ascending: true });

      if (error) throw error;
      return data as Event[];
    },
  });
};

export const useEvent = (eventId: string | undefined) => {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      if (!eventId) return null;

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      return data as Event;
    },
    enabled: !!eventId,
  });
};

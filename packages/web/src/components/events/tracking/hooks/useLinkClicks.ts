import { useQuery } from '@tanstack/react-query';
import { supabase } from '@force-majeure/shared/api/supabase/client';
import { LinkClick } from '@/types/tracking';

export function useLinkClicks(linkId: string | null) {
  return useQuery({
    queryKey: ['link-clicks', linkId],
    queryFn: async () => {
      if (!linkId) return [];

      const { data, error } = await supabase
        .from('link_clicks')
        .select('*')
        .eq('link_id', linkId)
        .order('clicked_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data || []) as LinkClick[];
    },
    enabled: !!linkId,
  });
}

export function useClickAnalytics(eventId: string) {
  return useQuery({
    queryKey: ['click-analytics', eventId],
    queryFn: async () => {
      // Get all links for this event
      const { data: links, error: linksError } = await supabase
        .from('tracking_links')
        .select('id, name, click_count, utm_source')
        .eq('event_id', eventId);

      if (linksError) throw linksError;

      // Get click data for the past 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: clicks, error: clicksError } = await supabase
        .from('link_clicks')
        .select('link_id, clicked_at, device_info')
        .in('link_id', links?.map((l) => l.id) || [])
        .gte('clicked_at', thirtyDaysAgo.toISOString());

      if (clicksError) throw clicksError;

      return { links, clicks };
    },
    enabled: !!eventId,
  });
}

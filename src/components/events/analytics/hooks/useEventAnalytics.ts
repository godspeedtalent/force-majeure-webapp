import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, parseISO } from 'date-fns';

interface AnalyticsDateRange {
  start: Date;
  end: Date;
}

export interface EventAnalyticsData {
  // Sales & Revenue
  totalRevenue: number;
  totalTicketsSold: number;
  averageOrderValue: number;
  totalFees: number;
  refundRate: number;
  revenueByTier: { tier: string; revenue: number; tickets: number }[];

  // Traffic & Engagement
  totalViews: number;
  uniqueVisitors: number;
  conversionRate: number;

  // RSVP Stats
  rsvpCount: number;
  rsvpCapacity: number | null;
  isRsvpEnabled: boolean;

  // Time-based data for charts
  salesOverTime: { date: string; revenue: number; tickets: number }[];
  viewsOverTime: { date: string; views: number }[];
  hourlyDistribution: { hour: number; orders: number }[];
}

export const useEventAnalytics = (eventId: string, dateRange: AnalyticsDateRange) => {
  return useQuery({
    queryKey: ['event-analytics', eventId, dateRange.start.toISOString(), dateRange.end.toISOString()],
    queryFn: async () => {
      const startDate = startOfDay(dateRange.start).toISOString();
      const endDate = endOfDay(dateRange.end).toISOString();

      // Fetch orders with items
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(
            *,
            ticket_tier:ticket_tiers(name)
          )
        `)
        .eq('event_id', eventId)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (ordersError) throw ordersError;

      // Fetch event views
      const { data: views, error: viewsError } = await supabase
        .from('event_views')
        .select('*')
        .eq('event_id', eventId)
        .gte('viewed_at', startDate)
        .lte('viewed_at', endDate);

      if (viewsError) throw viewsError;

      // Fetch event RSVP settings and count
      const { data: eventData } = await supabase
        .from('events')
        .select('is_free_event, rsvp_capacity')
        .eq('id', eventId)
        .single();

      const isRsvpEnabled = eventData?.is_free_event ?? false;
      const rsvpCapacity = eventData?.rsvp_capacity ?? null;

      // Get RSVP count if enabled
      let rsvpCount = 0;
      if (isRsvpEnabled) {
        const { data: rsvpData } = await supabase.rpc('get_event_rsvp_count', {
          p_event_id: eventId,
        });
        rsvpCount = rsvpData ?? 0;
      }

      // Calculate metrics
      const completedOrders = orders?.filter(o => o.status === 'completed') || [];
      const refundedOrders = orders?.filter(o => o.status === 'refunded') || [];

      const totalRevenue = completedOrders.reduce((sum, o) => sum + o.subtotal_cents, 0);
      const totalFees = completedOrders.reduce((sum, o) => sum + o.fees_cents, 0);
      const totalTicketsSold = completedOrders.reduce((sum, o) => {
        return sum + (o.items?.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0) || 0);
      }, 0);

      const averageOrderValue = completedOrders.length > 0 
        ? totalRevenue / completedOrders.length 
        : 0;

      const refundRate = orders && orders.length > 0
        ? (refundedOrders.length / orders.length) * 100
        : 0;

      // Traffic metrics
      const totalViews = views?.length || 0;
      const uniqueVisitors = new Set(
        views?.map(v => v.viewer_id || v.session_id).filter(Boolean)
      ).size;

      const conversionRate = totalViews > 0 
        ? (completedOrders.length / totalViews) * 100 
        : 0;

      // Revenue by tier
      const tierRevenue = new Map<string, { revenue: number; tickets: number }>();
      completedOrders.forEach(order => {
        order.items?.forEach((item: any) => {
          const tierName = item.ticket_tier?.name || 'Unknown';
          const existing = tierRevenue.get(tierName) || { revenue: 0, tickets: 0 };
          tierRevenue.set(tierName, {
            revenue: existing.revenue + (item.subtotal_cents || 0),
            tickets: existing.tickets + item.quantity,
          });
        });
      });

      const revenueByTier = Array.from(tierRevenue.entries()).map(([tier, data]) => ({
        tier,
        revenue: data.revenue,
        tickets: data.tickets,
      }));

      // Sales over time (daily)
      const salesByDate = new Map<string, { revenue: number; tickets: number }>();
      completedOrders.forEach(order => {
        const date = startOfDay(parseISO(order.created_at)).toISOString().split('T')[0];
        const existing = salesByDate.get(date) || { revenue: 0, tickets: 0 };
        const orderTickets = order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
        salesByDate.set(date, {
          revenue: existing.revenue + order.subtotal_cents,
          tickets: existing.tickets + orderTickets,
        });
      });

      const salesOverTime = Array.from(salesByDate.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Views over time (daily)
      const viewsByDate = new Map<string, number>();
      views?.forEach(view => {
        const date = startOfDay(parseISO(view.viewed_at)).toISOString().split('T')[0];
        viewsByDate.set(date, (viewsByDate.get(date) || 0) + 1);
      });

      const viewsOverTime = Array.from(viewsByDate.entries())
        .map(([date, views]) => ({ date, views }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Hourly distribution
      const hourlyOrders = new Array(24).fill(0);
      completedOrders.forEach(order => {
        const hour = parseISO(order.created_at).getHours();
        hourlyOrders[hour]++;
      });

      const hourlyDistribution = hourlyOrders.map((orders, hour) => ({ hour, orders }));

      const analyticsData: EventAnalyticsData = {
        totalRevenue,
        totalTicketsSold,
        averageOrderValue,
        totalFees,
        refundRate,
        revenueByTier,
        totalViews,
        uniqueVisitors,
        conversionRate,
        rsvpCount,
        rsvpCapacity,
        isRsvpEnabled,
        salesOverTime,
        viewsOverTime,
        hourlyDistribution,
      };

      return analyticsData;
    },
    enabled: !!eventId,
  });
};

import { supabase } from '@/shared';
import { logger } from '@/shared';
import type { Order } from '@/features/orders/services/orderService';
import type {
  IEventDataRepository,
  AttendeeData,
  GuestAttendeeData,
  ProfileData,
  GuestData,
} from './types';

/**
 * Production Event Data Repository
 *
 * Queries production tables:
 * - orders → profiles
 * - event_rsvps → profiles
 * - user_event_interests → profiles
 * - guests
 */
export class ProductionEventDataRepository implements IEventDataRepository {
  async getOrdersByEventId(eventId: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        profile:profiles!orders_user_id_fkey(
          id,
          display_name,
          full_name,
          email,
          avatar_url
        ),
        guest:guests!orders_guest_id_fkey(
          id,
          email,
          full_name,
          phone
        ),
        items:order_items(
          id,
          order_id,
          ticket_tier_id,
          quantity,
          unit_price_cents,
          unit_fee_cents,
          subtotal_cents,
          fees_cents,
          total_cents,
          ticket_tier:ticket_tiers(
            id,
            name,
            description
          )
        )
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching orders by event', {
        error: error.message,
        source: 'ProductionEventDataRepository.getOrdersByEventId',
        eventId,
      });
      throw error;
    }

    return (data || []) as unknown as Order[];
  }

  async getRsvpCount(eventId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('get_event_rsvp_count', {
        p_event_id: eventId,
      });

      if (error) throw error;
      return data ?? 0;
    } catch (error) {
      logger.error('Failed to get RSVP count', {
        error: error instanceof Error ? error.message : 'Unknown',
        source: 'ProductionEventDataRepository.getRsvpCount',
        event_id: eventId,
      });
      return 0;
    }
  }

  async getRsvpHolders(eventId: string): Promise<AttendeeData[]> {
    try {
      const { data, error } = await supabase
        .from('event_rsvps')
        .select(`
          user_id,
          profiles!event_rsvps_user_id_fkey (
            id,
            display_name,
            full_name,
            avatar_url,
            guest_list_visible
          )
        `)
        .eq('event_id', eventId)
        .eq('status', 'confirmed');

      if (error) throw error;

      return (data || []).map((rsvp) => ({
        userId: rsvp.user_id,
        profile: rsvp.profiles as unknown as ProfileData | null,
      }));
    } catch (error) {
      logger.debug('Failed to fetch RSVPs', {
        error: error instanceof Error ? error.message : 'Unknown',
        source: 'ProductionEventDataRepository.getRsvpHolders',
        event_id: eventId,
      });
      return [];
    }
  }

  async getInterestCount(eventId: string): Promise<number> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await supabase.rpc('get_event_interest_count' as any, {
        p_event_id: eventId,
      });

      if (error) throw error;
      return (data as number) || 0;
    } catch (error) {
      logger.error('Failed to get interest count', {
        error: error instanceof Error ? error.message : 'Unknown',
        source: 'ProductionEventDataRepository.getInterestCount',
        event_id: eventId,
      });
      return 0;
    }
  }

  async getInterestedUsers(eventId: string): Promise<AttendeeData[]> {
    try {
      const { data, error } = await supabase
        .from('user_event_interests')
        .select(`
          user_id,
          profiles!user_event_interests_user_id_fkey (
            id,
            display_name,
            full_name,
            avatar_url,
            guest_list_visible
          )
        `)
        .eq('event_id', eventId);

      if (error) throw error;

      return (data || []).map((interest) => ({
        userId: interest.user_id,
        profile: interest.profiles as unknown as ProfileData | null,
      }));
    } catch (error) {
      logger.error('Failed to fetch interested users', {
        error: error instanceof Error ? error.message : 'Unknown',
        source: 'ProductionEventDataRepository.getInterestedUsers',
        event_id: eventId,
      });
      return [];
    }
  }

  async getTicketHolders(eventId: string): Promise<AttendeeData[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          user_id,
          profiles!orders_user_id_fkey (
            id,
            display_name,
            full_name,
            avatar_url,
            guest_list_visible
          )
        `)
        .eq('event_id', eventId)
        .eq('status', 'completed')
        .not('user_id', 'is', null);

      if (error) throw error;

      // Deduplicate by user_id (a user might have multiple orders)
      const seen = new Set<string>();
      return (data || [])
        .filter(order => {
          if (!order.user_id || seen.has(order.user_id)) return false;
          seen.add(order.user_id);
          return true;
        })
        .map(order => ({
          userId: order.user_id as string,
          profile: order.profiles as unknown as ProfileData | null,
        }));
    } catch (error) {
      logger.error('Failed to fetch ticket holders', {
        error: error instanceof Error ? error.message : 'Unknown',
        source: 'ProductionEventDataRepository.getTicketHolders',
        event_id: eventId,
      });
      return [];
    }
  }

  async getGuestTicketHolders(eventId: string): Promise<GuestAttendeeData[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          guest_id,
          guests!orders_guest_id_fkey (
            id,
            full_name,
            email
          )
        `)
        .eq('event_id', eventId)
        .eq('status', 'completed')
        .not('guest_id', 'is', null);

      if (error) throw error;

      // Deduplicate by guest_id (a guest might have multiple orders)
      const seen = new Set<string>();
      return (data || [])
        .filter(order => {
          if (!order.guest_id || seen.has(order.guest_id)) return false;
          seen.add(order.guest_id);
          return true;
        })
        .map(order => ({
          guestId: order.guest_id as string,
          guest: order.guests as unknown as GuestData | null,
        }))
        .filter(holder => holder.guest !== null);
    } catch (error) {
      logger.error('Failed to fetch guest ticket holders', {
        error: error instanceof Error ? error.message : 'Unknown',
        source: 'ProductionEventDataRepository.getGuestTicketHolders',
        event_id: eventId,
      });
      return [];
    }
  }
}

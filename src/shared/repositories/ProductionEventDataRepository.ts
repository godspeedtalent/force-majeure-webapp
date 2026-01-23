import { supabase } from '@/shared';
import { logger } from '@/shared';
import type { Order } from '@/features/orders/services/orderService';
import type {
  IEventDataRepository,
  AttendeeData,
  GuestAttendeeData,
  ProfileData,
  GuestData,
  ConsolidatedAttendeesResult,
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
        profile:profiles!orders_user_id_profiles_fkey(
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
      // First fetch RSVPs
      const { data: rsvpData, error: rsvpError } = await supabase
        .from('event_rsvps')
        .select('user_id')
        .eq('event_id', eventId)
        .eq('status', 'confirmed');

      if (rsvpError) {
        logger.error('Failed to fetch RSVPs', {
          error: rsvpError.message,
          code: rsvpError.code,
          details: rsvpError.details,
          source: 'ProductionEventDataRepository.getRsvpHolders',
          event_id: eventId,
        });
        throw rsvpError;
      }

      if (!rsvpData || rsvpData.length === 0) {
        logger.debug('No confirmed RSVPs found', {
          source: 'ProductionEventDataRepository.getRsvpHolders',
          event_id: eventId,
        });
        return [];
      }

      // Extract unique user IDs
      const userIds = [...new Set(rsvpData.map(r => r.user_id))];

      // Fetch profiles for these users
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, full_name, avatar_url, guest_list_visible')
        .in('id', userIds);

      if (profileError) {
        logger.error('Failed to fetch profiles for RSVPs', {
          error: profileError.message,
          code: profileError.code,
          source: 'ProductionEventDataRepository.getRsvpHolders',
          event_id: eventId,
          userIds,
        });
        throw profileError;
      }

      // Create a map of profiles by ID
      const profileMap = new Map(
        (profileData || []).map(p => [p.id, p])
      );

      // Map RSVPs to AttendeeData with their profiles
      return rsvpData.map((rsvp) => ({
        userId: rsvp.user_id,
        profile: profileMap.get(rsvp.user_id) as ProfileData | null ?? null,
      }));
    } catch (error) {
      logger.error('Failed to fetch RSVPs for guest list', {
        error: error instanceof Error ? error.message : 'Unknown',
        source: 'ProductionEventDataRepository.getRsvpHolders',
        event_id: eventId,
      });
      return [];
    }
  }

  async getInterestCount(eventId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('get_event_interest_count', {
        event_id_param: eventId,
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
      // First get the interested user IDs
      const { data: interests, error: interestsError } = await supabase
        .from('user_event_interests')
        .select('user_id')
        .eq('event_id', eventId);

      if (interestsError) throw interestsError;
      if (!interests || interests.length === 0) return [];

      // Then fetch profiles for those users
      const userIds = interests.map(i => i.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, full_name, avatar_url, guest_list_visible')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Map profiles by ID for easy lookup
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      return interests.map((interest) => ({
        userId: interest.user_id,
        profile: (profileMap.get(interest.user_id) as ProfileData | undefined) ?? null,
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
          profiles!orders_user_id_profiles_fkey (
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

  async getAllAttendees(eventId: string): Promise<ConsolidatedAttendeesResult> {
    try {
      // Use the consolidated RPC that fetches all attendees in one call
      type RpcFn = (
        fn: string,
        params: { p_event_id: string }
      ) => Promise<{
        data: ConsolidatedAttendeesResult | null;
        error: { message: string } | null;
      }>;

      const { data, error } = await (supabase.rpc as unknown as RpcFn)(
        'get_event_attendees',
        { p_event_id: eventId }
      );

      if (error) throw error;

      // Return the result or empty structure
      return data ?? {
        ticket_holders: [],
        rsvp_holders: [],
        interested_users: [],
        guest_holders: [],
      };
    } catch (error) {
      logger.error('Failed to fetch all attendees', {
        error: error instanceof Error ? error.message : 'Unknown',
        source: 'ProductionEventDataRepository.getAllAttendees',
        event_id: eventId,
      });

      // Fall back to individual queries if RPC fails
      logger.info('Falling back to individual attendee queries', {
        source: 'ProductionEventDataRepository.getAllAttendees',
        event_id: eventId,
      });

      const [ticketHolders, rsvpHolders, interestedUsers, guestHolders] =
        await Promise.all([
          this.getTicketHolders(eventId),
          this.getRsvpHolders(eventId),
          this.getInterestedUsers(eventId),
          this.getGuestTicketHolders(eventId),
        ]);

      return {
        ticket_holders: ticketHolders,
        rsvp_holders: rsvpHolders,
        interested_users: interestedUsers,
        guest_holders: guestHolders,
      };
    }
  }
}

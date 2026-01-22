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
 * Test profile data from test_profiles table
 */
interface TestProfileRow {
  id: string;
  email: string;
  display_name: string | null;
  guest_list_visible: boolean | null;
  avatar_url: string | null;
}

/**
 * Map test_profile to standard ProfileData shape
 * Test profiles support guest_list_visible for public/private variation
 */
function mapTestProfileToProfileData(testProfile: TestProfileRow): ProfileData {
  return {
    id: testProfile.id,
    display_name: testProfile.display_name,
    full_name: testProfile.display_name, // Test profiles don't have separate full_name
    email: testProfile.email,
    avatar_url: testProfile.avatar_url,
    guest_list_visible: testProfile.guest_list_visible ?? true, // Default to visible if null
  };
}

/**
 * Test Event Data Repository
 *
 * Queries test_* tables:
 * - test_orders → test_profiles
 * - test_event_rsvps → test_profiles
 * - test_event_interests → test_profiles
 *
 * Test profiles use "test-{id}" prefix for userId to distinguish from real users.
 */
export class TestEventDataRepository implements IEventDataRepository {
  async getOrdersByEventId(eventId: string): Promise<Order[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('test_orders')
      .select(`
        *,
        test_profile:test_profiles(
          id,
          email,
          display_name
        ),
        guest:guests(
          id,
          email,
          full_name,
          phone
        ),
        items:test_order_items(
          id,
          test_order_id,
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
      logger.error('Error fetching test orders by event', {
        error: error.message,
        source: 'TestEventDataRepository.getOrdersByEventId',
        eventId,
      });
      throw error;
    }

    // Map test_profile to profile shape for UI compatibility
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((order: any) => ({
      ...order,
      // Map test_profile to profile shape for UI compatibility
      profile: order.test_profile ? {
        id: order.test_profile.id,
        display_name: order.test_profile.display_name,
        full_name: order.test_profile.display_name,
        email: order.test_profile.email,
        avatar_url: null,
      } : null,
      // Map test_order_id to order_id in items for compatibility
      items: (order.items || []).map((item: { test_order_id: string; [key: string]: unknown }) => ({
        ...item,
        order_id: item.test_order_id,
      })),
      // Mark as test data for UI indication
      test_data: true,
    })) as unknown as Order[];
  }

  async getRsvpCount(eventId: string): Promise<number> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count, error } = await (supabase as any)
        .from('test_event_rsvps')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('status', 'confirmed');

      if (error) throw error;
      return count ?? 0;
    } catch (error) {
      logger.error('Failed to get test RSVP count', {
        error: error instanceof Error ? error.message : 'Unknown',
        source: 'TestEventDataRepository.getRsvpCount',
        event_id: eventId,
      });
      return 0;
    }
  }

  async getRsvpHolders(eventId: string): Promise<AttendeeData[]> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('test_event_rsvps')
        .select(`
          test_profile_id,
          test_profile:test_profiles(
            id,
            email,
            display_name,
            guest_list_visible,
            avatar_url
          )
        `)
        .eq('event_id', eventId)
        .eq('status', 'confirmed');

      if (error) throw error;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((rsvp: any) => rsvp.test_profile !== null)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((rsvp: any) => ({
          // Prefix test user IDs to distinguish from real users
          userId: `test-${rsvp.test_profile.id}`,
          profile: mapTestProfileToProfileData(rsvp.test_profile),
        }));
    } catch (error) {
      logger.debug('Failed to fetch test RSVPs', {
        error: error instanceof Error ? error.message : 'Unknown',
        source: 'TestEventDataRepository.getRsvpHolders',
        event_id: eventId,
      });
      return [];
    }
  }

  async getInterestCount(eventId: string): Promise<number> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count, error } = await (supabase as any)
        .from('test_event_interests')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId);

      if (error) throw error;
      return count ?? 0;
    } catch (error) {
      logger.error('Failed to get test interest count', {
        error: error instanceof Error ? error.message : 'Unknown',
        source: 'TestEventDataRepository.getInterestCount',
        event_id: eventId,
      });
      return 0;
    }
  }

  async getInterestedUsers(eventId: string): Promise<AttendeeData[]> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('test_event_interests')
        .select(`
          test_profile_id,
          test_profile:test_profiles(
            id,
            email,
            display_name,
            guest_list_visible,
            avatar_url
          )
        `)
        .eq('event_id', eventId);

      if (error) throw error;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((interest: any) => interest.test_profile !== null)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((interest: any) => ({
          // Prefix test user IDs to distinguish from real users
          userId: `test-${interest.test_profile.id}`,
          profile: mapTestProfileToProfileData(interest.test_profile),
        }));
    } catch (error) {
      logger.error('Failed to fetch test interested users', {
        error: error instanceof Error ? error.message : 'Unknown',
        source: 'TestEventDataRepository.getInterestedUsers',
        event_id: eventId,
      });
      return [];
    }
  }

  async getTicketHolders(eventId: string): Promise<AttendeeData[]> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('test_orders')
        .select(`
          test_profile_id,
          test_profile:test_profiles(
            id,
            email,
            display_name,
            guest_list_visible,
            avatar_url
          )
        `)
        .eq('event_id', eventId)
        .eq('status', 'paid')
        .not('test_profile_id', 'is', null);

      if (error) throw error;

      // Deduplicate by test_profile_id (a test user might have multiple orders)
      const seen = new Set<string>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((order: any) => {
          if (!order.test_profile_id || seen.has(order.test_profile_id)) return false;
          seen.add(order.test_profile_id);
          return order.test_profile !== null;
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((order: any) => ({
          // Prefix test user IDs to distinguish from real users
          userId: `test-${order.test_profile.id}`,
          profile: mapTestProfileToProfileData(order.test_profile),
        }));
    } catch (error) {
      logger.error('Failed to fetch test ticket holders', {
        error: error instanceof Error ? error.message : 'Unknown',
        source: 'TestEventDataRepository.getTicketHolders',
        event_id: eventId,
      });
      return [];
    }
  }

  async getGuestTicketHolders(eventId: string): Promise<GuestAttendeeData[]> {
    try {
      // Test orders can also have guest checkouts
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('test_orders')
        .select(`
          guest_id,
          guests(
            id,
            full_name,
            email
          )
        `)
        .eq('event_id', eventId)
        .eq('status', 'paid')
        .not('guest_id', 'is', null);

      if (error) throw error;

      // Deduplicate by guest_id
      const seen = new Set<string>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((order: any) => {
          if (!order.guest_id || seen.has(order.guest_id)) return false;
          seen.add(order.guest_id);
          return order.guests !== null;
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((order: any) => ({
          guestId: order.guest_id as string,
          guest: order.guests as GuestData | null,
        }))
        .filter((holder: { guestId: string; guest: GuestData | null }) => holder.guest !== null);
    } catch (error) {
      logger.error('Failed to fetch test guest ticket holders', {
        error: error instanceof Error ? error.message : 'Unknown',
        source: 'TestEventDataRepository.getGuestTicketHolders',
        event_id: eventId,
      });
      return [];
    }
  }

  async getAllAttendees(eventId: string): Promise<ConsolidatedAttendeesResult> {
    // For test data, we run all queries in parallel since there's no consolidated RPC
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

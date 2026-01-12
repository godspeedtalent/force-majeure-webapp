import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared';
import { useAuth } from '@/features/auth/services/AuthContext';
import { logger } from '@/shared';

export interface Attendee {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  avatarUrl?: string | null;
  isFriend: boolean;
  type: 'ticket_holder' | 'rsvp' | 'interested';
}

interface ProfileData {
  id: string;
  display_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  guest_list_visible: boolean | null;
}

/**
 * Generate initials from a name
 */
function getInitials(name: string | null | undefined): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Convert profile data to Attendee format
 */
function profileToAttendee(
  userId: string,
  profile: ProfileData | null,
  type: Attendee['type'],
  friendIds: string[]
): Attendee | null {
  // Skip if profile opted out of guest list
  if (profile?.guest_list_visible === false) {
    return null;
  }

  const displayName = profile?.display_name || profile?.full_name || 'Anonymous';

  return {
    id: profile?.id || userId,
    userId,
    name: displayName,
    avatar: getInitials(displayName),
    avatarUrl: profile?.avatar_url,
    isFriend: friendIds.includes(userId),
    type,
  };
}

/**
 * useAttendeeList - Fetches real attendee data for an event
 *
 * Returns ticket holders, RSVPs, and interested users with friend indicators.
 */
export function useAttendeeList(eventId: string) {
  const { user } = useAuth();

  // Fetch ticket holders (completed orders)
  const { data: ticketHolders = [], isLoading: loadingTickets } = useQuery({
    queryKey: ['event-attendees-tickets', eventId],
    queryFn: async () => {
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
          source: 'useAttendeeList.ticketHolders',
          event_id: eventId,
        });
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch RSVPs (for free events)
  const { data: rsvpHolders = [], isLoading: loadingRsvps } = useQuery({
    queryKey: ['event-attendees-rsvp', eventId],
    queryFn: async () => {
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
        // Table might not exist yet - silently fail
        logger.debug('Failed to fetch RSVPs (table may not exist)', {
          error: error instanceof Error ? error.message : 'Unknown',
          source: 'useAttendeeList.rsvpHolders',
          event_id: eventId,
        });
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  // Fetch interested users
  const { data: interestedHolders = [], isLoading: loadingInterested } = useQuery({
    queryKey: ['event-attendees-interested', eventId],
    queryFn: async () => {
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
          source: 'useAttendeeList.interestedHolders',
          event_id: eventId,
        });
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  // Fetch user's friends (rave family connections)
  const { data: friendIds = [] } = useQuery({
    queryKey: ['user-friends', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      try {
        // Get friends where user is either user_id or family_member_id (bidirectional)
        const { data, error } = await supabase
          .from('rave_family')
          .select('user_id, family_member_id')
          .or(`user_id.eq.${user.id},family_member_id.eq.${user.id}`);

        if (error) throw error;

        // Extract the friend's ID (the one that's not the current user)
        return (data || []).map(conn =>
          conn.user_id === user.id ? conn.family_member_id : conn.user_id
        );
      } catch (error) {
        logger.debug('Failed to fetch friends', {
          error: error instanceof Error ? error.message : 'Unknown',
          source: 'useAttendeeList.friendIds',
        });
        return [];
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Combine ticket holders and RSVPs into "going" attendees
  const goingAttendees: Attendee[] = [];
  const seenGoingIds = new Set<string>();

  // Add ticket holders
  for (const holder of ticketHolders) {
    if (seenGoingIds.has(holder.userId)) continue;
    seenGoingIds.add(holder.userId);

    const attendee = profileToAttendee(holder.userId, holder.profile, 'ticket_holder', friendIds);
    if (attendee) goingAttendees.push(attendee);
  }

  // Add RSVPs (skip if already in ticket holders)
  for (const holder of rsvpHolders) {
    if (seenGoingIds.has(holder.userId)) continue;
    seenGoingIds.add(holder.userId);

    const attendee = profileToAttendee(holder.userId, holder.profile, 'rsvp', friendIds);
    if (attendee) goingAttendees.push(attendee);
  }

  // Convert interested users (excluding those already going)
  const interestedAttendees: Attendee[] = [];
  for (const holder of interestedHolders) {
    if (seenGoingIds.has(holder.userId)) continue; // Skip if already going

    const attendee = profileToAttendee(holder.userId, holder.profile, 'interested', friendIds);
    if (attendee) interestedAttendees.push(attendee);
  }

  // Separate friends going
  const friendsGoing = goingAttendees.filter(a => a.isFriend);
  const allGoing = goingAttendees;

  // Preview for the card (first 5 attendees, prioritize friends)
  const attendeePreview = [...friendsGoing, ...allGoing.filter(a => !a.isFriend)]
    .slice(0, 5)
    .map(a => ({ name: a.name, avatar: a.avatar }));

  return {
    // For backward compatibility with existing EventGuestList component
    attendeePreview,
    attendeeList: allGoing,

    // New structured data for AttendeeModal
    friendsGoing,
    allGoing,
    interestedUsers: interestedAttendees,

    // Counts
    totalGoingCount: allGoing.length,
    friendsGoingCount: friendsGoing.length,
    interestedCount: interestedAttendees.length,

    // Loading state
    isLoading: loadingTickets || loadingRsvps || loadingInterested,
  };
}

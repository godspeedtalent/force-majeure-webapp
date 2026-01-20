import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/shared';
import { useAuth } from '@/features/auth/services/AuthContext';
import { logger } from '@/shared';
import { getEventDataRepository } from '@/shared/repositories';
import type { ProfileData } from '@/shared/repositories';

export interface Attendee {
  id: string;
  userId: string;
  name: string;
  avatar: string;
  avatarUrl?: string | null;
  isFriend: boolean;
  type: 'ticket_holder' | 'rsvp' | 'interested' | 'guest';
}

interface GuestData {
  id: string;
  full_name: string | null;
  email: string | null;
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
 * Convert guest data to Attendee format
 */
function guestToAttendee(guest: GuestData): Attendee {
  const displayName = guest.full_name || 'Guest';

  return {
    id: guest.id,
    userId: `guest-${guest.id}`, // Prefix to distinguish from real user IDs
    name: displayName,
    avatar: getInitials(displayName),
    avatarUrl: null,
    isFriend: false, // Guests can't be friends
    type: 'guest',
  };
}

/**
 * useAttendeeList - Fetches real attendee data for an event
 *
 * Returns ticket holders, RSVPs, and interested users with friend indicators.
 * Uses the repository pattern to automatically query the correct tables
 * (production or test) based on event status.
 *
 * @param eventId - Event ID
 * @param eventStatus - Event status (e.g., 'test', 'published', 'draft')
 */
export function useAttendeeList(eventId: string, eventStatus?: string) {
  const { user } = useAuth();

  // Get the appropriate repository based on event status
  // This is the SINGLE decision point - all queries go through the same interface
  const repository = useMemo(
    () => getEventDataRepository(eventStatus),
    [eventStatus]
  );

  // Fetch ticket holders (from orders)
  const { data: ticketHolders = [], isLoading: loadingTickets } = useQuery({
    queryKey: ['event-attendees-tickets', eventId, eventStatus],
    queryFn: () => repository.getTicketHolders(eventId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch RSVPs (for free events)
  const { data: rsvpHolders = [], isLoading: loadingRsvps } = useQuery({
    queryKey: ['event-attendees-rsvp', eventId, eventStatus],
    queryFn: () => repository.getRsvpHolders(eventId),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch interested users
  const { data: interestedHolders = [], isLoading: loadingInterested } = useQuery({
    queryKey: ['event-attendees-interested', eventId, eventStatus],
    queryFn: () => repository.getInterestedUsers(eventId),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch guest ticket holders (anonymous checkouts)
  const { data: guestHolders = [], isLoading: loadingGuests } = useQuery({
    queryKey: ['event-attendees-guests', eventId, eventStatus],
    queryFn: () => repository.getGuestTicketHolders(eventId),
    staleTime: 1000 * 60 * 5,
  });

  // Fetch user's friends (rave family connections)
  // This always queries production tables - friends are real users only
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

  // ============================================================================
  // AGGREGATE ATTENDEES
  // This logic is IDENTICAL for test and production - the repository handles
  // the data source differences
  // ============================================================================

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

  // Add guest ticket holders (these are anonymous guests)
  const guestAttendees: Attendee[] = [];
  for (const holder of guestHolders) {
    if (!holder.guest) continue;
    const guestId = `guest-${holder.guest.id}`;
    if (seenGoingIds.has(guestId)) continue;
    seenGoingIds.add(guestId);

    const attendee = guestToAttendee(holder.guest);
    guestAttendees.push(attendee);
  }

  // Convert interested users (excluding those already going)
  const interestedAttendees: Attendee[] = [];
  for (const holder of interestedHolders) {
    if (seenGoingIds.has(holder.userId)) continue; // Skip if already going

    const attendee = profileToAttendee(holder.userId, holder.profile, 'interested', friendIds);
    if (attendee) interestedAttendees.push(attendee);
  }

  // Separate by category for modal sections
  // Friends = any going attendee that is a friend (not guests)
  const friendsGoing = goingAttendees.filter(a => a.isFriend);

  // Other Users = going attendees that are NOT friends AND are real users (not guests)
  // These are users with profiles who opted into the guest list
  const otherUsers = goingAttendees.filter(a => !a.isFriend);

  // Private users = users who opted out of visibility (guest_list_visible === false)
  // These are tracked separately - we count them but show as "Private"
  // Guests and Private Users are grouped together for display
  const guestsAndPrivate = guestAttendees;

  // All going includes everyone
  const allGoing = [...goingAttendees, ...guestAttendees];

  // Preview for the card (first 5 attendees, prioritize friends)
  const attendeePreview = [...friendsGoing, ...otherUsers]
    .slice(0, 5)
    .map(a => ({ name: a.name, avatar: a.avatar }));

  return {
    // For backward compatibility with existing EventGuestList component
    attendeePreview,
    attendeeList: allGoing,

    // New structured data for AttendeeModal sections
    friendsGoing,
    otherUsers,
    guestsAndPrivate,
    interestedUsers: interestedAttendees,

    // Legacy alias
    allGoing,

    // Counts
    totalGoingCount: allGoing.length,
    friendsGoingCount: friendsGoing.length,
    otherUsersCount: otherUsers.length,
    guestsAndPrivateCount: guestsAndPrivate.length,
    interestedCount: interestedAttendees.length,

    // Loading state
    isLoading: loadingTickets || loadingRsvps || loadingInterested || loadingGuests,
  };
}

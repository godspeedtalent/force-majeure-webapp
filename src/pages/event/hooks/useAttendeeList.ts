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
  isPrivate?: boolean;
  /** Display category for ordering in the unified list */
  displayCategory: 'public_ticket' | 'public_rsvp' | 'private_ticket' | 'private_rsvp' | 'public_interested' | 'private_interested' | 'guest';
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
 * Get display category based on type and privacy
 */
function getDisplayCategory(
  type: Attendee['type'],
  isPrivate: boolean
): Attendee['displayCategory'] {
  if (type === 'guest') return 'guest';
  if (type === 'ticket_holder') return isPrivate ? 'private_ticket' : 'public_ticket';
  if (type === 'rsvp') return isPrivate ? 'private_rsvp' : 'public_rsvp';
  if (type === 'interested') return isPrivate ? 'private_interested' : 'public_interested';
  return 'public_ticket'; // fallback
}

/**
 * Convert profile data to Attendee format
 */
function profileToAttendee(
  userId: string,
  profile: ProfileData | null,
  type: Attendee['type'],
  friendIds: string[]
): Attendee {
  // Check if profile opted out of guest list visibility
  const isPrivate = profile?.guest_list_visible === false;
  const displayCategory = getDisplayCategory(type, isPrivate);

  if (isPrivate) {
    // Return a private attendee placeholder with blurred info
    return {
      id: profile?.id || userId,
      userId,
      name: 'Private',
      avatar: '??',
      avatarUrl: profile?.avatar_url, // Keep avatar for blurring
      isFriend: false, // Don't reveal friend status for private users
      type,
      isPrivate: true,
      displayCategory,
    };
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
    isPrivate: false,
    displayCategory,
  };
}

/**
 * Convert guest data to Attendee format
 */
function guestToAttendee(guest: GuestData): Attendee {
  return {
    id: guest.id,
    userId: `guest-${guest.id}`, // Prefix to distinguish from real user IDs
    name: 'Guest', // Don't display actual guest names
    avatar: '??',
    avatarUrl: null,
    isFriend: false,
    type: 'guest',
    isPrivate: true, // Guests are treated as private
    displayCategory: 'guest',
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

  const allAttendees: Attendee[] = [];
  const seenIds = new Set<string>();

  // Add ticket holders
  for (const holder of ticketHolders) {
    if (seenIds.has(holder.userId)) continue;
    seenIds.add(holder.userId);
    allAttendees.push(profileToAttendee(holder.userId, holder.profile, 'ticket_holder', friendIds));
  }

  // Add RSVPs (skip if already in ticket holders)
  for (const holder of rsvpHolders) {
    if (seenIds.has(holder.userId)) continue;
    seenIds.add(holder.userId);
    allAttendees.push(profileToAttendee(holder.userId, holder.profile, 'rsvp', friendIds));
  }

  // Add guest ticket holders (these are anonymous guests)
  for (const holder of guestHolders) {
    if (!holder.guest) continue;
    const guestId = `guest-${holder.guest.id}`;
    if (seenIds.has(guestId)) continue;
    seenIds.add(guestId);
    allAttendees.push(guestToAttendee(holder.guest));
  }

  // Add interested users (excluding those already going)
  for (const holder of interestedHolders) {
    if (seenIds.has(holder.userId)) continue;
    allAttendees.push(profileToAttendee(holder.userId, holder.profile, 'interested', friendIds));
  }

  // Define display order for categories
  const categoryOrder: Record<Attendee['displayCategory'], number> = {
    public_ticket: 1,
    public_rsvp: 2,
    private_ticket: 3,
    private_rsvp: 4,
    guest: 5,
    public_interested: 6,
    private_interested: 7,
  };

  // Sort by category order, then by friend status (friends first within each category)
  const sortedAttendees = [...allAttendees].sort((a, b) => {
    const orderDiff = categoryOrder[a.displayCategory] - categoryOrder[b.displayCategory];
    if (orderDiff !== 0) return orderDiff;
    // Within same category, friends first
    if (a.isFriend && !b.isFriend) return -1;
    if (!a.isFriend && b.isFriend) return 1;
    return 0;
  });

  // Separate going vs interested for counts
  const goingAttendees = sortedAttendees.filter(a => a.type !== 'interested');
  const interestedAttendees = sortedAttendees.filter(a => a.type === 'interested');

  // Guest count for display
  const guestCount = sortedAttendees.filter(a => a.displayCategory === 'guest').length;

  // Preview for the card (first 5 public attendees, prioritize friends)
  const publicGoingAttendees = goingAttendees.filter(a => !a.isPrivate);
  const attendeePreview = publicGoingAttendees
    .slice(0, 5)
    .map(a => ({ name: a.name, avatar: a.avatar }));

  return {
    // For backward compatibility with existing EventGuestList component
    attendeePreview,
    attendeeList: goingAttendees,

    // Unified sorted list for the modal (going + interested, in display order)
    sortedAttendees,

    // Separate lists for going vs interested
    goingAttendees,
    interestedAttendees,

    // Guest count for grouped display
    guestCount,

    // Counts
    totalGoingCount: goingAttendees.length,
    interestedCount: interestedAttendees.length,

    // Loading state
    isLoading: loadingTickets || loadingRsvps || loadingInterested || loadingGuests,
  };
}

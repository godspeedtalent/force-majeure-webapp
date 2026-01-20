import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getEventDataRepository } from '@/shared/repositories';
import type { ProfileData } from '@/shared/repositories';

export interface RsvpAttendee {
  id: string;
  userId: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  type: 'rsvp' | 'interested';
  createdAt?: string;
}

/**
 * Hook for fetching RSVP and Interested users for event management
 * Uses the repository pattern to automatically query the correct tables
 * (production or test) based on event status.
 */
export function useEventRsvpManagement(eventId: string, eventStatus?: string) {
  // Get the appropriate repository based on event status
  const repository = useMemo(
    () => getEventDataRepository(eventStatus),
    [eventStatus]
  );

  // Fetch RSVPs (confirmed)
  const {
    data: rsvpHolders = [],
    isLoading: loadingRsvps,
    refetch: refetchRsvps,
  } = useQuery({
    queryKey: ['event-rsvp-management', eventId, eventStatus],
    queryFn: () => repository.getRsvpHolders(eventId),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Fetch interested users
  const {
    data: interestedHolders = [],
    isLoading: loadingInterested,
    refetch: refetchInterested,
  } = useQuery({
    queryKey: ['event-interest-management', eventId, eventStatus],
    queryFn: () => repository.getInterestedUsers(eventId),
    staleTime: 1000 * 60 * 2,
  });

  // Convert to RsvpAttendee format
  const profileToAttendee = (
    userId: string,
    profile: ProfileData | null,
    type: 'rsvp' | 'interested'
  ): RsvpAttendee => {
    const displayName = profile?.display_name || profile?.full_name || 'Anonymous';
    return {
      id: profile?.id || userId,
      userId,
      name: displayName,
      email: profile?.email || null,
      avatarUrl: profile?.avatar_url || null,
      type,
    };
  };

  // Build RSVP list
  const rsvpList: RsvpAttendee[] = rsvpHolders.map((holder) =>
    profileToAttendee(holder.userId, holder.profile, 'rsvp')
  );

  // Build interested list (excluding those who have RSVP'd)
  const rsvpUserIds = new Set(rsvpHolders.map((h) => h.userId));
  const interestedList: RsvpAttendee[] = interestedHolders
    .filter((holder) => !rsvpUserIds.has(holder.userId))
    .map((holder) => profileToAttendee(holder.userId, holder.profile, 'interested'));

  // Combined list for unified view
  const allAttendees: RsvpAttendee[] = [...rsvpList, ...interestedList];

  const refetch = () => {
    refetchRsvps();
    refetchInterested();
  };

  return {
    // Separate lists
    rsvpList,
    interestedList,

    // Combined list
    allAttendees,

    // Counts
    rsvpCount: rsvpList.length,
    interestedCount: interestedList.length,
    totalCount: allAttendees.length,

    // Loading state
    isLoading: loadingRsvps || loadingInterested,

    // Refetch function
    refetch,
  };
}
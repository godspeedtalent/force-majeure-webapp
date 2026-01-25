import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/shared/services/logger';
import { UpcomingEvent } from '@/components/profile/types';

/**
 * User Queries
 *
 * Centralized React Query hooks for user-related data operations.
 *
 * Usage:
 * ```ts
 * const { data, isLoading } = useUserEvents(userId);
 * // data = { upcoming: UpcomingEvent[], past: UpcomingEvent[] }
 * ```
 */

// ============================================================================
// Query Keys
// ============================================================================

export const userKeys = {
  all: ['users'] as const,
  events: (userId: string) => [...userKeys.all, 'events', userId] as const,
};

// ============================================================================
// Types
// ============================================================================

export interface UserEventsData {
  upcoming: UpcomingEvent[];
  past: UpcomingEvent[];
}

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch events (upcoming and past) for a user based on their paid orders
 *
 * This hook consolidates the logic previously duplicated in Profile.tsx
 * and PublicUserProfile.tsx. It fetches all events the user has tickets for,
 * groups them by event, counts tickets, and separates into upcoming/past.
 *
 * @param userId - User ID to fetch events for
 * @returns Object with upcoming and past events arrays
 */
export function useUserEvents(userId: string | undefined) {
  return useQuery<UserEventsData, Error>({
    queryKey: userKeys.events(userId || ''),
    queryFn: async () => {
      if (!userId) {
        return { upcoming: [], past: [] };
      }

      try {
        // Get events with paid orders for this user
        const { data, error } = await supabase
          .from('orders')
          .select(
            `
            event_id,
            events (
              id,
              title,
              date,
              location,
              cover_image_url
            )
          `
          )
          .eq('user_id', userId)
          .eq('status', 'paid');

        if (error) {
          logger.error('Error fetching user events', {
            error: error.message,
            source: 'useUserEvents',
            details: { userId },
          });
          return { upcoming: [], past: [] };
        }

        // Group by event and count tickets, separating future and past events
        const upcomingEventMap = new Map<string, UpcomingEvent>();
        const pastEventMap = new Map<string, UpcomingEvent>();
        const now = new Date();

        data?.forEach((order: any) => {
          if (order.events) {
            const event = order.events;
            const eventDate = new Date(event.date);
            const isFutureEvent = eventDate >= now;
            const targetMap = isFutureEvent ? upcomingEventMap : pastEventMap;

            if (targetMap.has(event.id)) {
              const existing = targetMap.get(event.id)!;
              existing.ticket_count += 1;
            } else {
              targetMap.set(event.id, {
                id: event.id,
                title: event.title,
                date: event.date,
                location: event.location,
                cover_image_url: event.cover_image_url,
                ticket_count: 1,
              });
            }
          }
        });

        // Convert maps to arrays and sort by date
        const upcoming = Array.from(upcomingEventMap.values()).sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        // Sort past events by date descending (most recent first)
        const past = Array.from(pastEventMap.values()).sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        return { upcoming, past };
      } catch (error) {
        logger.error('Error in useUserEvents', {
          error: error instanceof Error ? error.message : 'Unknown error',
          source: 'useUserEvents',
          details: { userId },
        });
        return { upcoming: [], past: [] };
      }
    },
    enabled: Boolean(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes - events don't change frequently
  });
}
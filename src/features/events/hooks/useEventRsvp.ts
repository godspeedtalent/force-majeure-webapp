import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { rsvpService, RsvpStats } from '../services/rsvpService';
import { useAuth } from '@/features/auth/services/AuthContext';
import { logger } from '@/shared';

export function useEventRsvp(eventId: string, eventTitle?: string, eventStatus?: string) {
  const { t } = useTranslation('toasts');
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Query: Get RSVP stats (count, capacity, isFull) - includes test RSVPs for test events
  const { data: rsvpStats = { count: 0, capacity: null, isFull: false } } = useQuery<RsvpStats>({
    queryKey: ['event-rsvp-stats', eventId, eventStatus],
    queryFn: () => rsvpService.getRsvpStats(eventId, eventStatus),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Query: Check if user has RSVP'd
  const { data: hasRsvp = false, isLoading: isCheckingRsvp } = useQuery({
    queryKey: ['user-rsvp', eventId, user?.id],
    queryFn: () => rsvpService.hasUserRsvp(eventId, user?.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Mutation: Toggle RSVP
  const toggleRsvpMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      return rsvpService.toggleRsvp(eventId);
    },
    onMutate: async () => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: ['user-rsvp', eventId, user?.id],
      });
      await queryClient.cancelQueries({
        queryKey: ['event-rsvp-stats', eventId],
      });

      // Snapshot previous values
      const previousHasRsvp = queryClient.getQueryData<boolean>([
        'user-rsvp',
        eventId,
        user?.id,
      ]);
      const previousStats = queryClient.getQueryData<RsvpStats>([
        'event-rsvp-stats',
        eventId,
      ]);

      // Optimistic update
      const newHasRsvp = !previousHasRsvp;
      queryClient.setQueryData(['user-rsvp', eventId, user?.id], newHasRsvp);

      if (previousStats) {
        const countDelta = newHasRsvp ? 1 : -1;
        const newCount = Math.max(0, previousStats.count + countDelta);
        queryClient.setQueryData<RsvpStats>(['event-rsvp-stats', eventId], {
          ...previousStats,
          count: newCount,
          isFull: previousStats.capacity !== null && newCount >= previousStats.capacity,
        });
      }

      return { previousHasRsvp, previousStats };
    },
    onSuccess: (result) => {
      if (result.success) {
        if (result.action === 'confirmed') {
          toast.success(t('events.rsvpConfirmed', { eventTitle: eventTitle || 'event' }));
          logger.info('User confirmed RSVP', {
            event_id: eventId,
            event_title: eventTitle,
          });
        } else {
          toast.success(t('events.rsvpCancelled', { eventTitle: eventTitle || 'event' }));
          logger.info('User cancelled RSVP', {
            event_id: eventId,
            event_title: eventTitle,
          });
        }
      } else {
        throw new Error(result.error || 'RSVP failed');
      }
    },
    onError: (error, _variables, context) => {
      // Rollback optimistic update
      if (context?.previousHasRsvp !== undefined) {
        queryClient.setQueryData(
          ['user-rsvp', eventId, user?.id],
          context.previousHasRsvp
        );
      }
      if (context?.previousStats !== undefined) {
        queryClient.setQueryData(
          ['event-rsvp-stats', eventId],
          context.previousStats
        );
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      if (message.includes('capacity')) {
        toast.error(t('events.rsvpAtCapacity'));
      } else {
        toast.error(t('events.rsvpFailed'));
      }

      logger.error('Failed to toggle RSVP', {
        error: message,
        source: 'useEventRsvp.toggleRsvp',
        event_id: eventId,
      });
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['user-rsvp', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-rsvp-stats', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-attendees', eventId] });
    },
  });

  return {
    hasRsvp,
    rsvpCount: rsvpStats.count,
    rsvpCapacity: rsvpStats.capacity,
    isFull: rsvpStats.isFull,
    isCheckingRsvp,
    toggleRsvp: () => toggleRsvpMutation.mutate(),
    isLoading: toggleRsvpMutation.isPending,
  };
}

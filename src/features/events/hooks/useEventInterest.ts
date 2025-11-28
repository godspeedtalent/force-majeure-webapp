import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { eventInterestService } from '../services/eventInterestService';
import { useAuth } from '@/features/auth/services/AuthContext';
import { logger } from '@/shared/services/logger';

export function useEventInterest(eventId: string, eventTitle?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Query: Get interest count
  const { data: interestCount = 0 } = useQuery({
    queryKey: ['event-interest-count', eventId],
    queryFn: () => eventInterestService.getInterestCount(eventId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Query: Check if user is interested
  const { data: isInterested = false, isLoading: isCheckingInterest } =
    useQuery({
      queryKey: ['user-interested', eventId, user?.id],
      queryFn: () =>
        eventInterestService.isUserInterested(eventId, user?.id),
      enabled: !!user,
      staleTime: 1000 * 60 * 5, // 5 minutes
    });

  // Mutation: Mark interested
  const markInterestedMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      return eventInterestService.markInterested(eventId, user.id);
    },
    onMutate: async () => {
      // Optimistic update
      await queryClient.cancelQueries({
        queryKey: ['user-interested', eventId, user?.id],
      });
      await queryClient.cancelQueries({
        queryKey: ['event-interest-count', eventId],
      });

      const previousInterested = queryClient.getQueryData([
        'user-interested',
        eventId,
        user?.id,
      ]);
      const previousCount = queryClient.getQueryData([
        'event-interest-count',
        eventId,
      ]);

      queryClient.setQueryData(
        ['user-interested', eventId, user?.id],
        true
      );
      queryClient.setQueryData(
        ['event-interest-count', eventId],
        (old: number = 0) => old + 1
      );

      return { previousInterested, previousCount };
    },
    onSuccess: () => {
      toast.success(`Marked ${eventTitle || 'event'} as Interested!`);
      logger.info('User marked event as interested', {
        event_id: eventId,
        event_title: eventTitle,
      });
    },
    onError: (_error, _variables, context) => {
      // Rollback optimistic update
      if (context?.previousInterested !== undefined) {
        queryClient.setQueryData(
          ['user-interested', eventId, user?.id],
          context.previousInterested
        );
      }
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(
          ['event-interest-count', eventId],
          context.previousCount
        );
      }

      toast.error('Failed to mark event as interested. Please try again.');
      logger.error('Failed to mark event as interested', {
        error: _error instanceof Error ? _error.message : 'Unknown',
        source: 'useEventInterest.markInterested',
        event_id: eventId,
      });
    },
  });

  // Mutation: Unmark interested
  const unmarkInterestedMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      return eventInterestService.unmarkInterested(eventId, user.id);
    },
    onMutate: async () => {
      // Optimistic update
      await queryClient.cancelQueries({
        queryKey: ['user-interested', eventId, user?.id],
      });
      await queryClient.cancelQueries({
        queryKey: ['event-interest-count', eventId],
      });

      const previousInterested = queryClient.getQueryData([
        'user-interested',
        eventId,
        user?.id,
      ]);
      const previousCount = queryClient.getQueryData([
        'event-interest-count',
        eventId,
      ]);

      queryClient.setQueryData(
        ['user-interested', eventId, user?.id],
        false
      );
      queryClient.setQueryData(
        ['event-interest-count', eventId],
        (old: number = 0) => Math.max(0, old - 1)
      );

      return { previousInterested, previousCount };
    },
    onSuccess: () => {
      toast.success(`Removed interest in ${eventTitle || 'event'}`);
      logger.info('User removed interest in event', {
        event_id: eventId,
        event_title: eventTitle,
      });
    },
    onError: (_error, _variables, context) => {
      // Rollback optimistic update
      if (context?.previousInterested !== undefined) {
        queryClient.setQueryData(
          ['user-interested', eventId, user?.id],
          context.previousInterested
        );
      }
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(
          ['event-interest-count', eventId],
          context.previousCount
        );
      }

      toast.error('Failed to remove interest. Please try again.');
      logger.error('Failed to remove interest in event', {
        error: _error instanceof Error ? _error.message : 'Unknown',
        source: 'useEventInterest.unmarkInterested',
        event_id: eventId,
      });
    },
  });

  const toggleInterest = () => {
    if (isInterested) {
      unmarkInterestedMutation.mutate();
    } else {
      markInterestedMutation.mutate();
    }
  };

  return {
    interestCount,
    isInterested,
    isCheckingInterest,
    toggleInterest,
    isLoading:
      markInterestedMutation.isPending || unmarkInterestedMutation.isPending,
  };
}

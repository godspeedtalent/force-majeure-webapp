import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { eventInterestService } from '../services/eventInterestService';
import { rsvpService } from '../services/rsvpService';
import { useAuth } from '@/features/auth/services/AuthContext';
import { logger, supabase, handleError } from '@/shared';

export function useEventInterest(eventId: string, eventTitle?: string, eventStatus?: string) {
  const { t } = useTranslation('toasts');
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Query: Check if user has tickets for this event (completed orders)
  const { data: hasTickets = false, isLoading: isCheckingTickets } = useQuery({
    queryKey: ['user-has-tickets', eventId, user?.id],
    queryFn: async () => {
      if (!user?.id) return false;

      // Check if user has any completed orders for this event
      const { count, error } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .eq('status', 'completed');

      if (error) {
        logger.error('Failed to check user tickets', {
          error: error.message,
          source: 'useEventInterest.hasTickets',
          event_id: eventId,
        });
        return false;
      }

      return (count ?? 0) > 0;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Query: Check if user has an RSVP for this event
  const { data: hasRsvp = false, isLoading: isCheckingRsvp } = useQuery({
    queryKey: ['user-has-rsvp', eventId, user?.id],
    queryFn: () => rsvpService.hasUserRsvp(eventId, user?.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Combined: User is "attending" if they have tickets OR an RSVP
  const isAttending = hasTickets || hasRsvp;
  const isCheckingAttendance = isCheckingTickets || isCheckingRsvp;

  // Query: Get interest count (includes test interests for test events)
  const { data: interestCount = 0 } = useQuery({
    queryKey: ['event-interest-count', eventId, eventStatus],
    queryFn: () => eventInterestService.getInterestCount(eventId, eventStatus),
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
      toast.success(t('events.interestMarked', { eventTitle: eventTitle || 'event' }));
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

      handleError(_error, {
        title: t('events.interestFailed'),
        context: 'useEventInterest.markInterested',
        showToast: true,
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
      toast.success(t('events.interestRemoved', { eventTitle: eventTitle || 'event' }));
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

      handleError(_error, {
        title: t('events.removeInterestFailed'),
        context: 'useEventInterest.unmarkInterested',
        showToast: true,
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
    // Attendance status - users with tickets OR RSVPs are automatically "going"
    // and cannot toggle their interest state
    isAttending,
    isCheckingAttendance,
    // Individual checks for backward compatibility
    hasTickets,
    hasRsvp,
  };
}

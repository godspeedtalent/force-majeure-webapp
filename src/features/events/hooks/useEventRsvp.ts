import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { rsvpService, RsvpStats } from '../services/rsvpService';
import { useAuth } from '@/features/auth/services/AuthContext';
import { logger, supabase } from '@/shared';
import { EmailService } from '@/services/email/EmailService';

export interface RsvpEventData {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: {
    name: string;
    address?: string;
    city?: string;
  };
  imageUrl?: string;
}

export function useEventRsvp(
  eventId: string,
  eventTitle?: string,
  eventStatus?: string,
  eventData?: RsvpEventData
) {
  const { t } = useTranslation('toasts');
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

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
    onSuccess: async (result) => {
      if (result.success) {
        if (result.action === 'confirmed') {
          toast.success(
            t('events.rsvpConfirmed', { eventTitle: eventTitle || 'event' })
          );
          logger.info('User confirmed RSVP', {
            event_id: eventId,
            event_title: eventTitle,
          });

          // Send RSVP confirmation email with PDF ticket
          if (result.rsvpId && user?.email) {
            try {
              // Get full event data if not provided
              let fullEventData = eventData;
              if (!fullEventData) {
                const { data: fetchedEvent } = await supabase
                  .from('events')
                  .select(
                    `
                    id,
                    title,
                    start_time,
                    hero_image,
                    venues (
                      name,
                      address,
                      city
                    )
                  `
                  )
                  .eq('id', eventId)
                  .single();

                if (fetchedEvent) {
                  // Parse the event data
                  const startTime = new Date(fetchedEvent.start_time || '');
                  fullEventData = {
                    id: fetchedEvent.id,
                    title: fetchedEvent.title,
                    date: startTime.toISOString().split('T')[0],
                    time: startTime.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    }),
                    venue: {
                      name:
                        (fetchedEvent.venues as { name?: string } | null)
                          ?.name || 'TBA',
                      address: (
                        fetchedEvent.venues as { address?: string } | null
                      )?.address,
                      city: (fetchedEvent.venues as { city?: string } | null)
                        ?.city,
                    },
                    imageUrl: fetchedEvent.hero_image ?? undefined,
                  };
                }
              }

              if (fullEventData) {
                // Send confirmation email
                const emailResult = await EmailService.sendRsvpConfirmation({
                  rsvpId: result.rsvpId,
                  event: fullEventData,
                  attendee: {
                    fullName: profile?.full_name || user.email.split('@')[0],
                    email: user.email,
                  },
                });

                if (emailResult.success) {
                  logger.info('RSVP confirmation email sent successfully', {
                    rsvpId: result.rsvpId,
                    eventId,
                  });
                } else {
                  logger.warn('Failed to send RSVP confirmation email', {
                    rsvpId: result.rsvpId,
                    eventId,
                    error: emailResult.error,
                  });
                }
              }
            } catch (emailError) {
              // Don't fail the RSVP if email fails - just log it
              logger.error('Error sending RSVP confirmation email', {
                error:
                  emailError instanceof Error
                    ? emailError.message
                    : 'Unknown error',
                rsvpId: result.rsvpId,
                eventId,
              });
            }
          }
        } else {
          toast.success(
            t('events.rsvpCancelled', { eventTitle: eventTitle || 'event' })
          );
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
    // Guard against rapid clicks - only allow toggle if no mutation is pending
    toggleRsvp: () => {
      if (!toggleRsvpMutation.isPending) {
        toggleRsvpMutation.mutate();
      }
    },
    isLoading: toggleRsvpMutation.isPending,
  };
}

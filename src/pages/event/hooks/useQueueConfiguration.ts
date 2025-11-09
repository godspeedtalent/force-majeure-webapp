import { useQuery } from '@tanstack/react-query';
import {
  fetchQueueConfiguration,
  QueueConfiguration,
} from '@/services/queueConfigurationService';
import { logger } from '@/shared/services/logger';

/**
 * Hook to fetch and cache queue configuration for an event.
 * Returns default configuration if no custom config exists.
 *
 * @param eventId - The event ID to fetch configuration for
 * @returns React Query result with queue configuration
 */
export function useQueueConfiguration(eventId: string | undefined) {
  return useQuery<QueueConfiguration, Error>({
    queryKey: ['queue-configuration', eventId],
    queryFn: async () => {
      if (!eventId) {
        throw new Error('Event ID is required');
      }
      return fetchQueueConfiguration(eventId);
    },
    enabled: Boolean(eventId),
    staleTime: 5 * 60 * 1000, // 5 minutes - config doesn't change often
    gcTime: 10 * 60 * 1000, // 10 minutes cache
    retry: 2,
    onError: (error: Error) => {
      logger.error('Failed to fetch queue configuration', {
        error,
        eventId,
      });
    },
  });
}

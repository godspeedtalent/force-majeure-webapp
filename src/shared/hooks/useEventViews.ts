import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/shared';
import { logger } from '@/shared';

/**
 * Hook to fetch and track event view count.
 * Uses simple counter on events table (not row-per-view).
 * Every page load increments the counter - cumulative across all users.
 */
export function useEventViews(eventId: string | undefined) {
  const [viewCount, setViewCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasRecordedRef = useRef(false);

  // Fetch current view count from events.view_count column
  useEffect(() => {
    if (!eventId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchViewCount = async () => {
      try {
        setIsLoading(true);

        const { data, error: fetchError } = await supabase
          .from('events')
          .select('view_count')
          .eq('id', eventId)
          .single();

        if (!isMounted) return;

        if (fetchError) {
          logger.warn('Error fetching view count', {
            eventId,
            error: fetchError.message,
            source: 'useEventViews',
          });
          setError(fetchError.message);
          setViewCount(0);
        } else {
          setViewCount(data?.view_count ?? 0);
          setError(null);
        }
      } catch (err) {
        if (!isMounted) return;
        logger.warn('Error fetching view count', {
          eventId,
          error: err instanceof Error ? err.message : String(err),
          source: 'useEventViews',
        });
        setError(String(err));
        setViewCount(0);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchViewCount();

    return () => {
      isMounted = false;
    };
  }, [eventId]);

  // Increment view count - call once per page load
  const recordView = useCallback(async () => {
    if (!eventId || hasRecordedRef.current) return;
    hasRecordedRef.current = true;

    try {
      const { data, error: rpcError } = await supabase.rpc('increment_event_view', {
        p_event_id: eventId,
      });

      if (rpcError) {
        logger.warn('Failed to increment event view', {
          eventId,
          error: rpcError.message,
          source: 'useEventViews',
        });
      } else if (data) {
        // Update local count with the new value from DB
        setViewCount(Number(data));
      }
    } catch (err) {
      logger.warn('Failed to increment event view', {
        eventId,
        error: err instanceof Error ? err.message : String(err),
        source: 'useEventViews',
      });
    }
  }, [eventId]);

  return {
    viewCount,
    isLoading,
    error,
    recordView,
  };
}

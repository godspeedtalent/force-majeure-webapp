import { useEffect, useState } from 'react';
import { supabase } from '../api/supabase/client';
import { logger } from '../services/logger';

/**
 * Hook to fetch and track event view count
 */
export function useEventViews(eventId: string | undefined) {
  const [viewCount, setViewCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasRecorded, setHasRecorded] = useState(false);

  useEffect(() => {
    if (!eventId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchViewCount = async () => {
      try {
        setIsLoading(true);

        // Fetch view count using raw query
        const { count, error: countError } = await supabase
          .from('event_views')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId);

        if (!isMounted) return;

        if (countError) {
          logger.error('Error fetching view count:', { error: countError });
          setError(countError.message);
          setViewCount(0);
        } else {
          setViewCount(count || 0);
          setError(null);
        }
      } catch (err) {
        if (!isMounted) return;
        logger.error('Error fetching view count:', { error: err });
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

  const recordView = async () => {
    if (!eventId || hasRecorded) return;

    try {
      const sessionId =
        sessionStorage.getItem('session_id') || crypto.randomUUID();
      sessionStorage.setItem('session_id', sessionId);

      const { error: insertError } = await supabase
        .from('event_views')
        .insert({
          event_id: eventId,
          session_id: sessionId,
          user_agent: navigator.userAgent,
        });

      if (insertError) {
        logger.error('Error recording view:', { error: insertError });
      } else {
        setHasRecorded(true);
        // Increment the local count
        setViewCount(prev => prev + 1);
      }
    } catch (err) {
      logger.error('Error recording view:', { error: err });
    }
  };

  return {
    viewCount,
    isLoading,
    error,
    recordView,
  };
}

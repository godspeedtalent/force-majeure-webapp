import { supabase } from '@/shared';
import { logger } from '@/shared';

/**
 * Increment the view count for an event.
 * Uses atomic increment - every call adds 1 to the count.
 */
export async function incrementEventView(
  eventId: string
): Promise<{ success: boolean; newCount?: number; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('increment_event_view', {
      p_event_id: eventId,
    });

    if (error) {
      logger.warn('Failed to increment event view', {
        eventId,
        error: error.message,
        source: 'eventViewsService',
      });
      return { success: false, error: error.message };
    }

    return { success: true, newCount: Number(data) || 0 };
  } catch (error) {
    logger.warn('Failed to increment event view', {
      eventId,
      error: error instanceof Error ? error.message : String(error),
      source: 'eventViewsService',
    });
    return { success: false, error: String(error) };
  }
}

/**
 * @deprecated Use incrementEventView instead. This function will be removed.
 */
export async function recordEventView({
  eventId,
}: {
  eventId: string;
}): Promise<{ success: boolean; error?: string }> {
  const result = await incrementEventView(eventId);
  return { success: result.success, error: result.error };
}

/**
 * Get the total view count for an event
 */
export async function getEventViewCount(
  eventId: string
): Promise<{ count: number; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_event_view_count', {
      p_event_id: eventId,
    });

    if (error) {
      logger.error('Error fetching event view count:', { error });
      return { count: 0, error: error.message };
    }

    return { count: Number(data) || 0 };
  } catch (error) {
    logger.error('Error fetching event view count:', { error });
    return { count: 0, error: String(error) };
  }
}

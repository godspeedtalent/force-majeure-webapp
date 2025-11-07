import { supabase } from '@/shared/api/supabase/client';

export interface RecordEventViewParams {
  eventId: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Record a page view for an event
 */
export async function recordEventView({
  eventId,
  sessionId,
  ipAddress,
  userAgent,
}: RecordEventViewParams): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('record_event_view', {
      p_event_id: eventId,
      p_session_id: sessionId || null,
      p_ip_address: ipAddress || null,
      p_user_agent: userAgent || null,
    });

    if (error) {
      console.error('Error recording event view:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error recording event view:', error);
    return { success: false, error: String(error) };
  }
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
      console.error('Error fetching event view count:', error);
      return { count: 0, error: error.message };
    }

    return { count: Number(data) || 0 };
  } catch (error) {
    console.error('Error fetching event view count:', error);
    return { count: 0, error: String(error) };
  }
}

import { supabase } from '@/shared';
import { logger } from '@/shared';

export interface EventRsvp {
  id: string;
  event_id: string;
  user_id: string;
  status: 'confirmed' | 'cancelled' | 'waitlisted';
  created_at: string;
  updated_at: string;
}

export interface RsvpStats {
  count: number;
  capacity: number | null;
  isFull: boolean;
}

export const rsvpService = {
  /**
   * Toggle RSVP for an event (confirm or cancel)
   */
  async toggleRsvp(eventId: string): Promise<{ success: boolean; action: 'confirmed' | 'cancelled'; rsvpId?: string; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('toggle_event_rsvp', {
        p_event_id: eventId,
      });

      if (error) throw error;

      const result = data?.[0] as { rsvp_id: string; action: string } | undefined;
      if (!result) throw new Error('No result returned from toggle_event_rsvp');

      logger.info('User toggled RSVP', {
        event_id: eventId,
        action: result.action,
        rsvp_id: result.rsvp_id,
      });

      return {
        success: true,
        action: result.action as 'confirmed' | 'cancelled',
        rsvpId: result.rsvp_id,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to toggle RSVP', {
        error: message,
        source: 'rsvpService.toggleRsvp',
        event_id: eventId,
      });
      return {
        success: false,
        action: 'cancelled',
        error: message,
      };
    }
  },

  /**
   * Get RSVP count for an event
   */
  async getRsvpCount(eventId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('get_event_rsvp_count', {
        p_event_id: eventId,
      });

      if (error) throw error;
      return data ?? 0;
    } catch (error) {
      logger.error('Failed to get RSVP count', {
        error: error instanceof Error ? error.message : 'Unknown',
        source: 'rsvpService.getRsvpCount',
        event_id: eventId,
      });
      return 0;
    }
  },

  /**
   * Check if user has RSVP'd to an event
   */
  async hasUserRsvp(eventId: string, userId: string | undefined): Promise<boolean> {
    if (!userId) return false;

    try {
      const { data, error } = await supabase.rpc('has_user_rsvp', {
        p_user_id: userId,
        p_event_id: eventId,
      });

      if (error) throw error;
      return data ?? false;
    } catch (error) {
      logger.error('Failed to check user RSVP', {
        error: error instanceof Error ? error.message : 'Unknown',
        source: 'rsvpService.hasUserRsvp',
        event_id: eventId,
        user_id: userId,
      });
      return false;
    }
  },

  /**
   * Get RSVP stats including capacity info
   */
  async getRsvpStats(eventId: string): Promise<RsvpStats> {
    try {
      // Get event capacity
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('rsvp_capacity')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;

      const capacity = eventData?.rsvp_capacity ?? null;

      // Get current count
      const count = await this.getRsvpCount(eventId);

      return {
        count,
        capacity,
        isFull: capacity !== null && count >= capacity,
      };
    } catch (error) {
      logger.error('Failed to get RSVP stats', {
        error: error instanceof Error ? error.message : 'Unknown',
        source: 'rsvpService.getRsvpStats',
        event_id: eventId,
      });
      return { count: 0, capacity: null, isFull: false };
    }
  },

  /**
   * Get all RSVPs for an event (for guest list)
   */
  async getEventRsvps(eventId: string): Promise<EventRsvp[]> {
    try {
      const { data, error } = await supabase
        .from('event_rsvps')
        .select('*')
        .eq('event_id', eventId)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as EventRsvp[];
    } catch (error) {
      logger.error('Failed to get event RSVPs', {
        error: error instanceof Error ? error.message : 'Unknown',
        source: 'rsvpService.getEventRsvps',
        event_id: eventId,
      });
      return [];
    }
  },
};

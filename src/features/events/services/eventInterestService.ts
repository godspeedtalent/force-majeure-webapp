import { supabase } from '@/shared';
import { logger } from '@/shared';

export interface UserEventInterest {
  id: string;
  user_id: string;
  event_id: string;
  created_at: string;
}

export const eventInterestService = {
  /**
   * Mark an event as interesting for the current user
   */
  async markInterested(eventId: string, userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_event_interests' as any)
        .insert([{ event_id: eventId, user_id: userId }])
        .select()
        .single();

      if (error) throw error;

      logger.info('User marked event as interested', {
        event_id: eventId,
        user_id: userId,
      });

      return { success: true, data };
    } catch (error) {
      logger.error('Failed to mark event as interested', {
        error: error instanceof Error ? error.message : 'Unknown',
        source: 'eventInterestService.markInterested',
        event_id: eventId,
        user_id: userId,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Remove interest in an event for the current user
   */
  async unmarkInterested(eventId: string, userId: string) {
    try {
      const { error } = await supabase
        .from('user_event_interests' as any)
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userId);

      if (error) throw error;

      logger.info('User removed interest in event', {
        event_id: eventId,
        user_id: userId,
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to remove interest in event', {
        error: error instanceof Error ? error.message : 'Unknown',
        source: 'eventInterestService.unmarkInterested',
        event_id: eventId,
        user_id: userId,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Get total interest count for an event
   */
  async getInterestCount(eventId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('get_event_interest_count' as any, {
        p_event_id: eventId,
      });

      if (error) throw error;
      return (data as number) || 0;
    } catch (error) {
      logger.error('Failed to get interest count', {
        error: error instanceof Error ? error.message : 'Unknown',
        source: 'eventInterestService.getInterestCount',
        event_id: eventId,
      });
      return 0;
    }
  },

  /**
   * Check if current user is interested in an event
   */
  async isUserInterested(
    eventId: string,
    userId: string | undefined
  ): Promise<boolean> {
    if (!userId) return false;

    try {
      const { data, error } = await supabase.rpc('is_user_interested' as any, {
        p_user_id: userId,
        p_event_id: eventId,
      });

      if (error) throw error;
      return (data as boolean) || false;
    } catch (error) {
      logger.error('Failed to check if user is interested', {
        error: error instanceof Error ? error.message : 'Unknown',
        source: 'eventInterestService.isUserInterested',
        event_id: eventId,
        user_id: userId,
      });
      return false;
    }
  },
};

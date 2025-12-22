/**
 * Event Share Service
 *
 * Handles event sharing analytics and tracking.
 * Centralizes Supabase RPC calls for share count management.
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/shared/services/logger';

export const eventShareService = {
  /**
   * Increment the share count for an event
   * Uses a database RPC function to safely increment
   */
  async incrementShareCount(eventId: string): Promise<number | null> {
    try {
      const { data, error } = await supabase.rpc(
        'increment_event_share_count' as any,
        {
          event_id: eventId,
        }
      );

      if (error) {
        logger.error('Failed to increment share count', {
          error: error.message,
          source: 'eventShareService',
          eventId,
        });
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Error incrementing share count', {
        error: error instanceof Error ? error.message : 'Unknown',
        source: 'eventShareService',
        eventId,
      });
      throw error;
    }
  },

  /**
   * Get the share count for an event
   */
  async getShareCount(eventId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('share_count')
        .eq('id', eventId)
        .single();

      if (error) {
        logger.error('Failed to get share count', {
          error: error.message,
          source: 'eventShareService',
          eventId,
        });
        return 0;
      }

      return data?.share_count ?? 0;
    } catch (error) {
      logger.error('Error getting share count', {
        error: error instanceof Error ? error.message : 'Unknown',
        source: 'eventShareService',
        eventId,
      });
      return 0;
    }
  },
};

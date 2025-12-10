import { supabase } from '@force-majeure/shared';
import { logger } from '@force-majeure/shared';

export interface QueueConfiguration {
  id: string;
  event_id: string;
  max_concurrent_users: number;
  checkout_timeout_minutes: number;
  session_timeout_minutes: number;
  enable_queue: boolean;
  created_at: string;
  updated_at: string;
}

export interface QueueConfigInput {
  event_id: string;
  max_concurrent_users?: number;
  checkout_timeout_minutes?: number;
  session_timeout_minutes?: number;
  enable_queue?: boolean;
}

// Default configuration values
export const DEFAULT_QUEUE_CONFIG = {
  max_concurrent_users: 50,
  checkout_timeout_minutes: 9,
  session_timeout_minutes: 30,
  enable_queue: true,
} as const;

/**
 * Fetches queue configuration for a specific event.
 * Returns default configuration if no custom config exists.
 */
export async function fetchQueueConfiguration(
  eventId: string
): Promise<QueueConfiguration> {
  try {
    const { data, error } = await supabase
      .from('queue_configurations')
      .select('*')
      .eq('event_id', eventId)
      .maybeSingle();

    if (error) {
      logger.error('Error fetching queue configuration', {
        error,
        eventId,
      });
      throw error;
    }

    // If no configuration exists, return default values
    if (!data) {
      logger.info('No queue configuration found, using defaults', {
        eventId,
      });
      return {
        id: '', // No ID for default config
        event_id: eventId,
        ...DEFAULT_QUEUE_CONFIG,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    return data;
  } catch (error) {
    logger.error('Failed to fetch queue configuration', {
      error,
      eventId,
    });
    // Return default config on error to prevent blocking ticketing
    return {
      id: '',
      event_id: eventId,
      ...DEFAULT_QUEUE_CONFIG,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
}

/**
 * Creates or updates queue configuration for an event.
 * Admin-only function.
 */
export async function upsertQueueConfiguration(
  config: QueueConfigInput
): Promise<QueueConfiguration> {
  try {
    const { data, error } = await supabase
      .from('queue_configurations')
      .upsert(
        {
          event_id: config.event_id,
          max_concurrent_users:
            config.max_concurrent_users ?? DEFAULT_QUEUE_CONFIG.max_concurrent_users,
          checkout_timeout_minutes:
            config.checkout_timeout_minutes ??
            DEFAULT_QUEUE_CONFIG.checkout_timeout_minutes,
          session_timeout_minutes:
            config.session_timeout_minutes ??
            DEFAULT_QUEUE_CONFIG.session_timeout_minutes,
          enable_queue: config.enable_queue ?? DEFAULT_QUEUE_CONFIG.enable_queue,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'event_id',
        }
      )
      .select()
      .single();

    if (error) {
      logger.error('Error upserting queue configuration', {
        error,
        config,
      });
      throw error;
    }

    logger.info('Queue configuration updated', {
      eventId: config.event_id,
    });

    return data;
  } catch (error) {
    logger.error('Failed to upsert queue configuration', {
      error,
      config,
    });
    throw error;
  }
}

/**
 * Deletes queue configuration for an event.
 * Reverts to default configuration.
 * Admin-only function.
 */
export async function deleteQueueConfiguration(
  eventId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('queue_configurations')
      .delete()
      .eq('event_id', eventId);

    if (error) {
      logger.error('Error deleting queue configuration', {
        error,
        eventId,
      });
      throw error;
    }

    logger.info('Queue configuration deleted', { eventId });
  } catch (error) {
    logger.error('Failed to delete queue configuration', {
      error,
      eventId,
    });
    throw error;
  }
}

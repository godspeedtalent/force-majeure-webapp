/**
 * Delphi - Channel and Metric Types
 *
 * Defines data sources (channels) and their metrics used for ticket sales forecasting.
 */

/** Category of data source channel */
export type ChannelCategory = 'streaming' | 'social' | 'historical' | 'market' | 'custom';

/**
 * A data source channel (e.g., Spotify, Instagram, Ticketmaster history)
 */
export interface DelphiChannel {
  id: string;
  name: string;
  category: ChannelCategory;
  description?: string;
  metrics: DelphiMetric[];
  enabled: boolean;
}

/**
 * A single metric from a channel
 */
export interface DelphiMetric {
  id: string;
  channelId: string;
  name: string;
  value: number;
  unit?: string; // e.g., 'listeners', 'followers', 'tickets'
  description?: string;
}

/**
 * Predefined channel categories with metadata
 */
export const CHANNEL_CATEGORIES: Record<ChannelCategory, { label: string; description: string }> = {
  streaming: {
    label: 'Streaming',
    description: 'Music streaming platforms (Spotify, Apple Music, etc.)',
  },
  social: {
    label: 'Social Media',
    description: 'Social media engagement metrics (Instagram, TikTok, etc.)',
  },
  historical: {
    label: 'Historical Data',
    description: 'Past ticket sales and event performance',
  },
  market: {
    label: 'Market Data',
    description: 'Venue capacity, market size, competition',
  },
  custom: {
    label: 'Custom',
    description: 'User-defined metrics and data sources',
  },
};

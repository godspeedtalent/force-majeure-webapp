/**
 * Delphi - Forecast Types
 *
 * Defines forecast configuration and result structures.
 */

/**
 * Configuration for how metrics influence the forecast
 */
export interface ForecastConfig {
  id: string;
  name: string;
  description?: string;
  weights: Record<string, number>; // metricId -> weight (0-1)
  baselineMultiplier: number;
  confidenceInterval: number; // 0-1, e.g., 0.95 for 95% confidence
  createdAt?: string;
  updatedAt?: string;
}

/**
 * The output of a forecast calculation
 */
export interface ForecastResult {
  projectedTicketSales: number;
  lowEstimate: number;
  highEstimate: number;
  confidence: number;
  breakdown: ForecastBreakdownItem[];
  calculatedAt: string;
}

/**
 * Breakdown of how each metric contributed to the forecast
 */
export interface ForecastBreakdownItem {
  metricId: string;
  metricName: string;
  channelName: string;
  rawValue: number;
  weight: number;
  contribution: number; // Weighted contribution to final result
}

/**
 * Input data for running a forecast
 */
export interface ForecastInput {
  artistId?: string;
  eventId?: string;
  venueCapacity: number;
  channels: string[]; // Channel IDs to include
  configId?: string; // Optional preset config, uses default if not specified
}

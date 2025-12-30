/**
 * Analytics Feature
 *
 * Comprehensive page analytics suite for tracking page views,
 * sessions, conversion funnel, and performance metrics.
 *
 * @example
 * // In App.tsx, wrap your app with AnalyticsProvider
 * import { AnalyticsProvider } from '@/features/analytics';
 *
 * <AnalyticsProvider>
 *   <App />
 * </AnalyticsProvider>
 *
 * @example
 * // In components, use the useAnalytics hook
 * import { useAnalytics } from '@/features/analytics';
 *
 * function EventDetails({ eventId }) {
 *   const { trackEventView, trackTicketTierView } = useAnalytics();
 *
 *   useEffect(() => {
 *     trackEventView(eventId);
 *   }, [eventId]);
 *
 *   const handleTierClick = (tierId) => {
 *     trackTicketTierView(eventId, tierId);
 *   };
 * }
 */

// Types
export type {
  PageSource,
  FunnelEventType,
  PerformanceMetricType,
  MetricRating,
  SessionEntry,
  PageViewEntry,
  FunnelEventEntry,
  PerformanceEntry,
  StoredSession,
  StoredPageView,
  StoredFunnelEvent,
  StoredPerformanceMetric,
  AnalyticsConfig,
  AdapterResult,
  DailyPageViewSummary,
  FunnelSummary,
  PerformanceSummary,
  AnalyticsOverviewData,
  AnalyticsFilters,
  PaginationParams,
  PaginatedResult,
} from './types';
export { DEFAULT_ANALYTICS_CONFIG } from './types';

// Adapters
export type { AnalyticsAdapter } from './adapters/AnalyticsAdapter';
export { ConsoleAnalyticsAdapter } from './adapters/AnalyticsAdapter';
export { SupabaseAnalyticsAdapter } from './adapters/SupabaseAnalyticsAdapter';

// Services
export { AnalyticsService } from './services/AnalyticsService';

// Hooks
export { useAnalytics } from './hooks/useAnalytics';
export { usePageTracking } from './hooks/usePageTracking';
export { usePerformanceTracking } from './hooks/usePerformanceTracking';
export { useScrollDepth } from './hooks/useScrollDepth';

// Components
export { AnalyticsProvider, AnalyticsContext } from './components/AnalyticsProvider';
export type { AnalyticsContextValue } from './components/AnalyticsProvider';

// Utils
export {
  getSessionId,
  isSessionSampled,
  getUtmParams,
  clearSession,
  getDeviceInfo,
  detectDeviceType,
  detectBrowser,
  detectOS,
  getPageType,
  getResourceId,
  getPageSource,
  getReferrer,
  getCurrentOrigin,
} from './utils';
export type { DeviceInfo } from './utils';

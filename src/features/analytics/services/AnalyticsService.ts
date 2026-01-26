/**
 * Analytics Service
 *
 * High-level service for tracking page views, funnel events,
 * and performance metrics. Follows the ErrorLoggingService pattern.
 *
 * Features:
 * - Adapter-based architecture for swappable backends
 * - Configurable batching for high-volume tracking
 * - Sample rate support for traffic control
 * - Path exclusion for admin/developer pages
 * - Non-blocking writes (fire-and-forget)
 *
 * Usage:
 * ```typescript
 * import { analyticsService } from '@/features/analytics';
 *
 * // Track a page view
 * await analyticsService.trackPageView({
 *   pagePath: '/events/123',
 *   pageTitle: 'Event Details',
 *   pageType: 'event',
 * });
 *
 * // Track a funnel event
 * await analyticsService.trackFunnelEvent({
 *   eventType: 'add_to_cart',
 *   eventId: '123',
 *   quantity: 2,
 *   valueCents: 5000,
 * });
 * ```
 */

import type { AnalyticsAdapter } from '../adapters/AnalyticsAdapter';
import { ConsoleAnalyticsAdapter } from '../adapters/AnalyticsAdapter';
import type {
  PageViewEntry,
  FunnelEventEntry,
  PerformanceEntry,
  SessionEntry,
  AnalyticsConfig,
} from '../types';
import { DEFAULT_ANALYTICS_CONFIG } from '../types';
import {
  getSessionId,
  isSessionSampled,
  getUtmParams,
  getDeviceInfo,
  getPageSource,
  getReferrer,
  getCurrentOrigin,
} from '../utils';
import { logger } from '@/shared/services/logger';

const analyticsLogger = logger.createNamespace('AnalyticsService');

// Extended page view entry with duration/scroll data for batching
interface BatchedPageViewEntry extends PageViewEntry {
  timeOnPageMs?: number;
  scrollDepthPercent?: number;
}

export class AnalyticsService {
  private adapter: AnalyticsAdapter;
  private config: AnalyticsConfig;
  private pageViewQueue: BatchedPageViewEntry[] = [];
  private funnelQueue: FunnelEventEntry[] = [];
  private performanceQueue: PerformanceEntry[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private currentPageViewId: string | null = null;
  private currentBatchedPageViewIndex: number = -1; // Track index for batched updates
  private pageLoadTime: number = Date.now();
  private sessionInitialized: boolean = false;
  private sessionInitFailed: boolean = false; // Track if init failed to avoid retrying endlessly
  private sessionInitPromise: Promise<void> | null = null; // Prevent concurrent init calls
  private previousPagePath: string | null = null;
  private currentUserId: string | null = null;

  constructor(adapter?: AnalyticsAdapter, config: Partial<AnalyticsConfig> = {}) {
    this.adapter = adapter || new ConsoleAnalyticsAdapter();
    this.config = { ...DEFAULT_ANALYTICS_CONFIG, ...config };
  }

  /**
   * Set the current user ID for tracking authenticated sessions
   */
  setCurrentUser(userId: string | null): void {
    this.currentUserId = userId;
    this.logToConsole('User ID set for analytics', { userId });
  }

  /**
   * Get the current user ID
   */
  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  /**
   * Set the adapter (useful for switching between console and Supabase)
   */
  setAdapter(adapter: AnalyticsAdapter): void {
    this.adapter = adapter;
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Check if tracking should proceed
   */
  private shouldTrack(): boolean {
    if (!this.config.enabled) return false;
    if (!isSessionSampled(this.config.sampleRate)) return false;

    // Skip if session init previously failed (prevents blocking page loads)
    if (this.sessionInitFailed) return false;

    // Check if current user is excluded
    if (this.currentUserId && this.config.excludedUserIds.includes(this.currentUserId)) {
      this.logToConsole('Skipping tracking for excluded user', { userId: this.currentUserId });
      return false;
    }

    return true;
  }

  /**
   * Check if path is excluded from tracking
   */
  private isExcludedPath(path: string): boolean {
    return this.config.excludedPaths.some(excluded => path.startsWith(excluded));
  }

  /**
   * Log to console if enabled
   */
  private logToConsole(message: string, data?: unknown): void {
    if (this.config.consoleLogging) {
      analyticsLogger.debug(message, data as Record<string, unknown>);
    }
  }

  // ============================================================
  // Session Management
  // ============================================================

  /**
   * Initialize session with device and UTM information
   */
  async initSession(): Promise<void> {
    // Don't retry if already initialized or previously failed
    if (this.sessionInitialized || this.sessionInitFailed) return;
    if (!this.config.enabled || !isSessionSampled(this.config.sampleRate)) return;

    // If init is already in progress, wait for it instead of starting another
    if (this.sessionInitPromise) {
      return this.sessionInitPromise;
    }

    this.sessionInitPromise = this.doInitSession();
    return this.sessionInitPromise;
  }

  /**
   * Internal session init implementation
   */
  private async doInitSession(): Promise<void> {
    try {
      const deviceInfo = getDeviceInfo();
      const utmParams = getUtmParams();

      const sessionEntry: SessionEntry = {
        sessionId: getSessionId(),
        entryPage: window.location.pathname,
        referrer: getReferrer() || undefined,
        ...utmParams,
        userAgent: deviceInfo.userAgent,
        deviceType: deviceInfo.deviceType,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        screenWidth: deviceInfo.screenWidth,
        screenHeight: deviceInfo.screenHeight,
      };

      this.logToConsole('Initializing session', sessionEntry);

      const result = await this.adapter.initSession(sessionEntry);
      if (result.success) {
        this.sessionInitialized = true;
      } else {
        // Mark as failed to prevent retrying on every page view
        this.sessionInitFailed = true;
        analyticsLogger.warn('Analytics session init failed, disabling for this session', {
          error: result.error,
        });
      }
    } catch (err) {
      // Mark as failed to prevent retrying on every page view
      this.sessionInitFailed = true;
      analyticsLogger.warn('Analytics session init failed, disabling for this session', {
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      this.sessionInitPromise = null;
    }
  }

  /**
   * End the current session
   */
  async endSession(): Promise<void> {
    await this.flush();

    try {
      await this.adapter.endSession(getSessionId());
      this.sessionInitialized = false;
    } catch (err) {
      analyticsLogger.error('Failed to end session', {
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  // ============================================================
  // Page View Tracking
  // ============================================================

  /**
   * Track a page view
   */
  async trackPageView(
    entry: Omit<PageViewEntry, 'sessionId'>
  ): Promise<string | null> {
    if (!this.shouldTrack() || this.isExcludedPath(entry.pagePath)) {
      return null;
    }

    // Initialize session on first page view
    if (!this.sessionInitialized) {
      await this.initSession();
    }

    const source = getPageSource(getReferrer(), getCurrentOrigin());
    const fullEntry: PageViewEntry = {
      ...entry,
      sessionId: getSessionId(),
      source: entry.source || (this.previousPagePath ? 'internal' : source),
      referrerPage: this.previousPagePath || undefined,
      userAgent: navigator.userAgent,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    };

    this.previousPagePath = entry.pagePath;
    this.pageLoadTime = Date.now();

    this.logToConsole('Tracking page view', fullEntry);

    if (this.config.batchEnabled) {
      this.addToBatch('pageView', fullEntry);
      // Track index for updating duration/scroll before flush
      this.currentBatchedPageViewIndex = this.pageViewQueue.length - 1;
      return 'batched';
    }

    const result = await this.adapter.writePageView(fullEntry);
    if (result.success && result.data) {
      this.currentPageViewId = result.data;
      return result.data;
    }

    analyticsLogger.warn('Failed to track page view', { error: result.error });
    return null;
  }

  /**
   * Update the current page view with time-on-page and scroll depth
   */
  async updatePageViewDuration(scrollDepth?: number): Promise<void> {
    const timeOnPage = Date.now() - this.pageLoadTime;

    // If we have a batched page view, update it in the queue
    if (this.currentBatchedPageViewIndex >= 0 && this.pageViewQueue[this.currentBatchedPageViewIndex]) {
      const entry = this.pageViewQueue[this.currentBatchedPageViewIndex];
      entry.timeOnPageMs = timeOnPage;
      entry.scrollDepthPercent = scrollDepth;

      this.logToConsole('Updated batched page view duration', {
        index: this.currentBatchedPageViewIndex,
        timeOnPage,
        scrollDepth,
      });
      return;
    }

    // Otherwise, update via adapter if we have a view ID
    if (!this.currentPageViewId) return;

    try {
      await this.adapter.updatePageViewDuration(
        this.currentPageViewId,
        timeOnPage,
        scrollDepth
      );

      this.logToConsole('Updated page view duration', {
        viewId: this.currentPageViewId,
        timeOnPage,
        scrollDepth,
      });
    } catch (err) {
      analyticsLogger.error('Failed to update page view duration', {
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  // ============================================================
  // Funnel Event Tracking
  // ============================================================

  /**
   * Track a conversion funnel event
   */
  async trackFunnelEvent(
    entry: Omit<FunnelEventEntry, 'sessionId'>
  ): Promise<string | null> {
    if (!this.shouldTrack()) return null;

    const fullEntry: FunnelEventEntry = {
      ...entry,
      sessionId: getSessionId(),
    };

    this.logToConsole('Tracking funnel event', fullEntry);

    if (this.config.batchEnabled) {
      this.addToBatch('funnel', fullEntry);
      return 'batched';
    }

    const result = await this.adapter.writeFunnelEvent(fullEntry);
    return result.success ? result.data || null : null;
  }

  // Convenience methods for common funnel events

  async trackEventView(eventId: string): Promise<string | null> {
    return this.trackFunnelEvent({ eventType: 'event_view', eventId });
  }

  async trackTicketTierView(eventId: string, ticketTierId: string): Promise<string | null> {
    return this.trackFunnelEvent({
      eventType: 'ticket_tier_view',
      eventId,
      ticketTierId,
    });
  }

  async trackAddToCart(
    eventId: string,
    ticketTierId: string,
    quantity: number,
    valueCents: number
  ): Promise<string | null> {
    return this.trackFunnelEvent({
      eventType: 'add_to_cart',
      eventId,
      ticketTierId,
      quantity,
      valueCents,
    });
  }

  async trackCheckoutStart(
    eventId: string,
    cartId: string,
    valueCents: number
  ): Promise<string | null> {
    return this.trackFunnelEvent({
      eventType: 'checkout_start',
      eventId,
      cartId,
      valueCents,
    });
  }

  async trackCheckoutComplete(
    eventId: string,
    orderId: string,
    valueCents: number
  ): Promise<string | null> {
    return this.trackFunnelEvent({
      eventType: 'checkout_complete',
      eventId,
      orderId,
      valueCents,
    });
  }

  async trackCheckoutAbandon(eventId: string, cartId?: string): Promise<string | null> {
    return this.trackFunnelEvent({
      eventType: 'checkout_abandon',
      eventId,
      cartId,
    });
  }

  async trackCartAbandon(eventId: string, cartId: string): Promise<string | null> {
    return this.trackFunnelEvent({
      eventType: 'cart_abandon',
      eventId,
      cartId,
    });
  }

  // ============================================================
  // Performance Tracking
  // ============================================================

  /**
   * Track a performance metric
   */
  async trackPerformance(
    entry: Omit<PerformanceEntry, 'sessionId'>
  ): Promise<void> {
    if (!this.shouldTrack() || !this.config.trackWebVitals) return;

    const fullEntry: PerformanceEntry = {
      ...entry,
      sessionId: getSessionId(),
    };

    this.logToConsole('Tracking performance', fullEntry);

    if (this.config.batchEnabled) {
      this.addToBatch('performance', fullEntry);
      return;
    }

    await this.adapter.writePerformanceMetric(fullEntry);
  }

  /**
   * Track API response time
   */
  async trackApiTiming(
    endpoint: string,
    durationMs: number,
    pagePath: string
  ): Promise<void> {
    if (!this.config.trackApiTiming) return;

    await this.trackPerformance({
      metricType: 'api_response',
      metricValue: durationMs,
      pagePath,
      endpoint,
      metricRating: durationMs < 200 ? 'good' : durationMs < 500 ? 'needs-improvement' : 'poor',
    });
  }

  // ============================================================
  // Batching
  // ============================================================

  /**
   * Add entry to batch queue
   */
  private addToBatch(
    type: 'pageView' | 'funnel' | 'performance',
    entry: PageViewEntry | FunnelEventEntry | PerformanceEntry
  ): void {
    switch (type) {
      case 'pageView':
        this.pageViewQueue.push(entry as PageViewEntry);
        break;
      case 'funnel':
        this.funnelQueue.push(entry as FunnelEventEntry);
        break;
      case 'performance':
        this.performanceQueue.push(entry as PerformanceEntry);
        break;
    }

    const totalQueued =
      this.pageViewQueue.length +
      this.funnelQueue.length +
      this.performanceQueue.length;

    if (totalQueued >= this.config.batchSize) {
      this.flush();
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(
        () => this.flush(),
        this.config.batchFlushInterval
      );
    }
  }

  /**
   * Flush all queued entries
   */
  async flush(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    const pageViews = [...this.pageViewQueue];
    const funnelEvents = [...this.funnelQueue];
    const performanceMetrics = [...this.performanceQueue];

    this.pageViewQueue = [];
    this.funnelQueue = [];
    this.performanceQueue = [];

    if (pageViews.length === 0 && funnelEvents.length === 0 && performanceMetrics.length === 0) {
      return;
    }

    this.logToConsole('Flushing batch', {
      pageViews: pageViews.length,
      funnelEvents: funnelEvents.length,
      performanceMetrics: performanceMetrics.length,
    });

    // Wrap flush with timeout to prevent indefinite hangs during page unload
    try {
      await Promise.race([
        Promise.all([
          pageViews.length > 0 && this.adapter.writePageViewBatch(pageViews),
          funnelEvents.length > 0 && this.adapter.writeFunnelEventBatch(funnelEvents),
          performanceMetrics.length > 0 && this.adapter.writePerformanceBatch(performanceMetrics),
        ]),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Flush timeout after 5000ms')), 5000)
        ),
      ]);
    } catch (err) {
      // Log error but continue - we don't want to block page cleanup
      analyticsLogger.warn('Analytics flush failed or timed out', {
        error: err instanceof Error ? err.message : 'Unknown error',
        queueSizes: {
          pageViews: pageViews.length,
          funnelEvents: funnelEvents.length,
          performanceMetrics: performanceMetrics.length,
        },
      });
    }
  }

  // ============================================================
  // Query Methods (for dashboard)
  // ============================================================

  /**
   * Get the underlying adapter for query operations
   */
  getAdapter(): AnalyticsAdapter {
    return this.adapter;
  }
}

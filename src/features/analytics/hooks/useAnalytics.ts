/**
 * useAnalytics Hook
 *
 * Provides access to analytics tracking functions.
 * Must be used within AnalyticsProvider.
 */

import { useContext, useCallback } from 'react';
import { AnalyticsContext } from '../components/AnalyticsProvider';

/**
 * Hook for tracking funnel events and custom analytics
 */
export function useAnalytics() {
  const context = useContext(AnalyticsContext);

  if (!context) {
    throw new Error('useAnalytics must be used within AnalyticsProvider');
  }

  const { service } = context;

  // Funnel tracking methods
  const trackEventView = useCallback(
    (eventId: string) => service.trackEventView(eventId),
    [service]
  );

  const trackTicketTierView = useCallback(
    (eventId: string, ticketTierId: string) =>
      service.trackTicketTierView(eventId, ticketTierId),
    [service]
  );

  const trackAddToCart = useCallback(
    (eventId: string, ticketTierId: string, quantity: number, valueCents: number) =>
      service.trackAddToCart(eventId, ticketTierId, quantity, valueCents),
    [service]
  );

  const trackCheckoutStart = useCallback(
    (eventId: string, cartId: string, valueCents: number) =>
      service.trackCheckoutStart(eventId, cartId, valueCents),
    [service]
  );

  const trackCheckoutComplete = useCallback(
    (eventId: string, orderId: string, valueCents: number) =>
      service.trackCheckoutComplete(eventId, orderId, valueCents),
    [service]
  );

  const trackCheckoutAbandon = useCallback(
    (eventId: string, cartId?: string) => service.trackCheckoutAbandon(eventId, cartId),
    [service]
  );

  const trackCartAbandon = useCallback(
    (eventId: string, cartId: string) => service.trackCartAbandon(eventId, cartId),
    [service]
  );

  // Generic tracking
  const trackFunnelEvent = useCallback(
    (entry: Parameters<typeof service.trackFunnelEvent>[0]) =>
      service.trackFunnelEvent(entry),
    [service]
  );

  const trackPerformance = useCallback(
    (entry: Parameters<typeof service.trackPerformance>[0]) =>
      service.trackPerformance(entry),
    [service]
  );

  const trackApiTiming = useCallback(
    (endpoint: string, durationMs: number, pagePath: string) =>
      service.trackApiTiming(endpoint, durationMs, pagePath),
    [service]
  );

  return {
    // Funnel tracking
    trackEventView,
    trackTicketTierView,
    trackAddToCart,
    trackCheckoutStart,
    trackCheckoutComplete,
    trackCheckoutAbandon,
    trackCartAbandon,

    // Generic tracking
    trackFunnelEvent,
    trackPerformance,
    trackApiTiming,

    // Access to service for advanced usage
    service,
  };
}

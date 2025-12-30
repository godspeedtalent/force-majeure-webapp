/**
 * usePageTracking Hook
 *
 * Automatically tracks page views on route changes.
 * Also tracks time-on-page and scroll depth.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import type { AnalyticsService } from '../services/AnalyticsService';
import { getPageType, getResourceId } from '../utils';

interface UsePageTrackingOptions {
  /** Track scroll depth (default: true) */
  trackScrollDepth?: boolean;
  /** Service instance (from context) */
  service: AnalyticsService;
}

/**
 * Hook for automatic page view tracking
 */
export function usePageTracking({ service, trackScrollDepth = true }: UsePageTrackingOptions) {
  const location = useLocation();
  const maxScrollDepth = useRef(0);
  const currentViewId = useRef<string | null>(null);
  const pageStartTime = useRef<number>(Date.now());

  // Track scroll depth
  const handleScroll = useCallback(() => {
    if (!trackScrollDepth) return;

    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) {
      maxScrollDepth.current = 100;
      return;
    }

    const scrollPercent = Math.min(
      100,
      Math.round((window.scrollY / scrollHeight) * 100)
    );
    maxScrollDepth.current = Math.max(maxScrollDepth.current, scrollPercent);
  }, [trackScrollDepth]);

  // Send page view duration on page leave
  const sendDuration = useCallback(() => {
    if (currentViewId.current) {
      service.updatePageViewDuration(maxScrollDepth.current);
    }
  }, [service]);

  // Track page view on route change
  useEffect(() => {
    const pagePath = location.pathname;
    const pageType = getPageType(pagePath);
    const resourceId = getResourceId(pagePath);

    // Reset scroll depth for new page
    maxScrollDepth.current = 0;
    pageStartTime.current = Date.now();

    // Track the page view
    service
      .trackPageView({
        pagePath,
        pageTitle: document.title,
        pageType,
        resourceId,
      })
      .then(viewId => {
        if (viewId && viewId !== 'batched') {
          currentViewId.current = viewId;
        }
      });

    // Set up scroll tracking
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Set up page leave handlers
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendDuration();
      }
    };

    const handleBeforeUnload = () => {
      sendDuration();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      // Send duration for the page we're leaving
      sendDuration();

      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [location.pathname, service, handleScroll, sendDuration]);
}

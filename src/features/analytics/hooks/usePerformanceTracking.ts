/**
 * usePerformanceTracking Hook
 *
 * Tracks Web Vitals metrics using the web-vitals library.
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import type { AnalyticsService } from '../services/AnalyticsService';
import type { PerformanceMetricType, MetricRating } from '../types';

interface UsePerformanceTrackingOptions {
  /** Service instance (from context) */
  service: AnalyticsService;
  /** Enable/disable tracking (default: true) */
  enabled?: boolean;
}

/**
 * Hook for tracking Web Vitals and performance metrics
 */
export function usePerformanceTracking({
  service,
  enabled = true,
}: UsePerformanceTrackingOptions) {
  const location = useLocation();
  const metricsReported = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled) return;

    // Reset reported metrics on page change
    metricsReported.current = new Set();

    const reportMetric = (
      metricType: PerformanceMetricType,
      value: number,
      rating?: MetricRating
    ) => {
      // Avoid duplicate reporting for same metric on same page
      const key = `${location.pathname}:${metricType}`;
      if (metricsReported.current.has(key)) return;
      metricsReported.current.add(key);

      service.trackPerformance({
        metricType,
        metricValue: value,
        metricRating: rating,
        pagePath: location.pathname,
      });
    };

    // Dynamically import web-vitals to avoid bundling if not used
    import('web-vitals')
      .then(({ onLCP, onCLS, onINP, onTTFB, onFCP }) => {
        // Largest Contentful Paint
        onLCP(metric => {
          reportMetric(
            'largest_contentful_paint',
            metric.value,
            metric.rating as MetricRating
          );
        });

        // Cumulative Layout Shift
        onCLS(metric => {
          reportMetric(
            'cumulative_layout_shift',
            metric.value,
            metric.rating as MetricRating
          );
        });

        // Interaction to Next Paint (replaces FID)
        onINP(metric => {
          reportMetric(
            'interaction_to_next_paint',
            metric.value,
            metric.rating as MetricRating
          );
        });

        // Time to First Byte
        onTTFB(metric => {
          reportMetric(
            'time_to_first_byte',
            metric.value,
            metric.rating as MetricRating
          );
        });

        // First Contentful Paint
        onFCP(metric => {
          reportMetric(
            'first_contentful_paint',
            metric.value,
            metric.rating as MetricRating
          );
        });
      })
      .catch(() => {
        // web-vitals not available, use fallback with Performance API
        if (typeof window !== 'undefined' && window.performance) {
          const entries = performance.getEntriesByType('navigation');
          if (entries.length > 0) {
            const navEntry = entries[0] as PerformanceNavigationTiming;
            const loadTime = navEntry.loadEventEnd - navEntry.startTime;

            if (loadTime > 0) {
              reportMetric('page_load', loadTime);
            }
          }
        }
      });
  }, [location.pathname, service, enabled]);
}

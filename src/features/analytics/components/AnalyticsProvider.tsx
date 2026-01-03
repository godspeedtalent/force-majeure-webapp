/**
 * Analytics Provider
 *
 * Provides analytics service to the entire application.
 * Handles initialization and cleanup of analytics tracking.
 */

import React, { createContext, useMemo, useEffect, useRef } from 'react';
import { AnalyticsService } from '../services/AnalyticsService';
import { SupabaseAnalyticsAdapter } from '../adapters/SupabaseAnalyticsAdapter';
import { ConsoleAnalyticsAdapter } from '../adapters/AnalyticsAdapter';
import type { AnalyticsConfig } from '../types';
import { DEFAULT_ANALYTICS_CONFIG } from '../types';
import { usePageTracking } from '../hooks/usePageTracking';
import { usePerformanceTracking } from '../hooks/usePerformanceTracking';
import { supabase } from '@/integrations/supabase/client';

export interface AnalyticsContextValue {
  service: AnalyticsService;
}

export const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

interface AnalyticsProviderProps {
  children: React.ReactNode;
  /** Override default config */
  config?: Partial<AnalyticsConfig>;
  /** Use console adapter instead of Supabase (for development/testing) */
  useConsoleAdapter?: boolean;
  /** Enable automatic page tracking (default: true) */
  autoTrackPages?: boolean;
  /** Enable Web Vitals tracking (default: true) */
  trackWebVitals?: boolean;
  /** Enable scroll depth tracking (default: true) */
  trackScrollDepth?: boolean;
}

/**
 * Inner component that uses hooks (must be inside Router)
 */
function AnalyticsTracking({
  service,
  autoTrackPages,
  trackWebVitals,
  trackScrollDepth,
}: {
  service: AnalyticsService;
  autoTrackPages: boolean;
  trackWebVitals: boolean;
  trackScrollDepth: boolean;
}) {
  // Automatic page tracking
  usePageTracking({
    service,
    trackScrollDepth: autoTrackPages ? trackScrollDepth : false,
  });

  // Web Vitals tracking
  usePerformanceTracking({
    service,
    enabled: trackWebVitals,
  });

  return null;
}

/**
 * Analytics Provider component
 */
export function AnalyticsProvider({
  children,
  config = {},
  useConsoleAdapter = import.meta.env.DEV,
  autoTrackPages = true,
  trackWebVitals = true,
  trackScrollDepth = true,
}: AnalyticsProviderProps) {
  // Create adapter based on environment
  const adapter = useMemo(() => {
    if (useConsoleAdapter) {
      return new ConsoleAnalyticsAdapter();
    }
    return new SupabaseAnalyticsAdapter();
  }, [useConsoleAdapter]);

  // Create service with config
  const service = useMemo(() => {
    const mergedConfig: AnalyticsConfig = {
      ...DEFAULT_ANALYTICS_CONFIG,
      ...config,
    };
    return new AnalyticsService(adapter, mergedConfig);
  }, [adapter, config]);

  // Initialize session on mount
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      service.initSession();
    }

    // End session on unmount (tab close)
    return () => {
      service.flush();
    };
  }, [service]);

  // Sync user ID with auth state
  useEffect(() => {
    // Get initial user
    supabase.auth.getUser().then(({ data }) => {
      service.setCurrentUser(data.user?.id ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      service.setCurrentUser(session?.user?.id ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [service]);

  // Handle page visibility changes (end session when tab hidden for extended time)
  useEffect(() => {
    let hiddenTime: number | null = null;
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenTime = Date.now();
      } else if (document.visibilityState === 'visible' && hiddenTime) {
        const elapsed = Date.now() - hiddenTime;
        if (elapsed > SESSION_TIMEOUT) {
          // Session expired, end and restart
          service.endSession().then(() => {
            service.initSession();
          });
        }
        hiddenTime = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [service]);

  const contextValue = useMemo(() => ({ service }), [service]);

  return (
    <AnalyticsContext.Provider value={contextValue}>
      <AnalyticsTracking
        service={service}
        autoTrackPages={autoTrackPages}
        trackWebVitals={trackWebVitals}
        trackScrollDepth={trackScrollDepth}
      />
      {children}
    </AnalyticsContext.Provider>
  );
}

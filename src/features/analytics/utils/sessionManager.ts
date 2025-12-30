/**
 * Session Manager
 *
 * Manages analytics session IDs and sampling logic.
 */

const SESSION_ID_KEY = 'fm_analytics_session_id';
const SESSION_SAMPLED_KEY = 'fm_analytics_sampled';

/**
 * Get or create a session ID for analytics tracking.
 * Session IDs persist for the browser session.
 */
export function getSessionId(): string {
  try {
    let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    }
    return sessionId;
  } catch {
    // sessionStorage not available (SSR, private browsing, etc.)
    return crypto.randomUUID();
  }
}

/**
 * Check if the current session is sampled for tracking.
 * Uses consistent sampling based on session ID to avoid
 * tracking partial sessions.
 */
export function isSessionSampled(sampleRate: number): boolean {
  if (sampleRate >= 1) return true;
  if (sampleRate <= 0) return false;

  try {
    // Check cached sampling decision
    const cached = sessionStorage.getItem(SESSION_SAMPLED_KEY);
    if (cached !== null) {
      return cached === 'true';
    }

    // Make sampling decision based on random value
    const sampled = Math.random() < sampleRate;
    sessionStorage.setItem(SESSION_SAMPLED_KEY, String(sampled));
    return sampled;
  } catch {
    // If sessionStorage not available, sample based on rate
    return Math.random() < sampleRate;
  }
}

/**
 * Get UTM parameters from the current URL
 */
export function getUtmParams(): {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
} {
  try {
    const params = new URLSearchParams(window.location.search);
    return {
      utmSource: params.get('utm_source') || undefined,
      utmMedium: params.get('utm_medium') || undefined,
      utmCampaign: params.get('utm_campaign') || undefined,
      utmTerm: params.get('utm_term') || undefined,
      utmContent: params.get('utm_content') || undefined,
    };
  } catch {
    return {};
  }
}

/**
 * Clear the current session (for testing or logout)
 */
export function clearSession(): void {
  try {
    sessionStorage.removeItem(SESSION_ID_KEY);
    sessionStorage.removeItem(SESSION_SAMPLED_KEY);
  } catch {
    // Ignore errors
  }
}

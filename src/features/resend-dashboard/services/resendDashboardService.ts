/**
 * Resend Dashboard Service
 *
 * Service layer for fetching email data from Resend API via edge function.
 */

import { supabase, logger } from '@/shared';
import type {
  ResendEmail,
  ResendDashboardStats,
  ResendEmailListResponse,
  ResendDomainListResponse,
  ResendDashboardResponse,
} from '../types';

const LOG_SOURCE = 'resendDashboardService';

/**
 * Call the resend-dashboard edge function
 */
async function callEdgeFunction<T>(
  action: string,
  params: Record<string, string | number> = {}
): Promise<T> {
  // Build query string
  const queryParams = new URLSearchParams({ action, ...Object.fromEntries(
    Object.entries(params).map(([k, v]) => [k, String(v)])
  )});

  // Get session for authorization header
  // Note: supabase.functions.invoke doesn't support query parameters for GET requests,
  // so we use fetch directly with the Authorization header
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const url = `${supabaseUrl}/functions/v1/resend-dashboard?${queryParams}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Edge function error', {
      source: LOG_SOURCE,
      status: response.status,
      error: errorText,
    });
    throw new Error(`Edge function error: ${response.status}`);
  }

  const result: ResendDashboardResponse<T> = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Unknown error from edge function');
  }

  return result.data as T;
}

/**
 * Fetch list of sent emails from Resend
 */
export async function getResendEmails(
  limit: number = 50
): Promise<ResendEmailListResponse> {
  try {
    logger.info('Fetching Resend emails', { source: LOG_SOURCE, limit });

    const data = await callEdgeFunction<ResendEmailListResponse>('list-emails', { limit });

    logger.info('Successfully fetched Resend emails', {
      source: LOG_SOURCE,
      count: data.data?.length || 0,
    });

    return data;
  } catch (err) {
    logger.error('Error fetching Resend emails', {
      source: LOG_SOURCE,
      error: err instanceof Error ? err.message : 'Unknown error',
    });
    throw err;
  }
}

/**
 * Fetch a single email by ID
 */
export async function getResendEmailById(id: string): Promise<ResendEmail> {
  try {
    logger.info('Fetching Resend email by ID', { source: LOG_SOURCE, id });

    const data = await callEdgeFunction<ResendEmail>('get-email', { id });

    return data;
  } catch (err) {
    logger.error('Error fetching Resend email', {
      source: LOG_SOURCE,
      error: err instanceof Error ? err.message : 'Unknown error',
      id,
    });
    throw err;
  }
}

/**
 * Fetch list of configured domains from Resend
 */
export async function getResendDomains(): Promise<ResendDomainListResponse> {
  try {
    logger.info('Fetching Resend domains', { source: LOG_SOURCE });

    const data = await callEdgeFunction<ResendDomainListResponse>('list-domains');

    logger.info('Successfully fetched Resend domains', {
      source: LOG_SOURCE,
      count: data.data?.length || 0,
    });

    return data;
  } catch (err) {
    logger.error('Error fetching Resend domains', {
      source: LOG_SOURCE,
      error: err instanceof Error ? err.message : 'Unknown error',
    });
    throw err;
  }
}

/**
 * Calculate email statistics from email list
 */
export function calculateEmailStats(emails: ResendEmail[]): ResendDashboardStats {
  const stats: ResendDashboardStats = {
    totalEmails: emails.length,
    sent: 0,
    delivered: 0,
    bounced: 0,
    opened: 0,
    clicked: 0,
    complained: 0,
    deliveryDelayed: 0,
  };

  for (const email of emails) {
    switch (email.last_event) {
      case 'sent':
        stats.sent++;
        break;
      case 'delivered':
        stats.delivered++;
        break;
      case 'bounced':
        stats.bounced++;
        break;
      case 'opened':
        stats.opened++;
        break;
      case 'clicked':
        stats.clicked++;
        break;
      case 'complained':
        stats.complained++;
        break;
      case 'delivery_delayed':
        stats.deliveryDelayed++;
        break;
    }
  }

  return stats;
}

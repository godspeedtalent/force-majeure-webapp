/**
 * Types for Resend Dashboard feature
 *
 * These types match the Resend API response structures.
 */

/**
 * Email delivery status from Resend
 */
export type ResendEmailStatus =
  | 'sent'
  | 'delivered'
  | 'delivery_delayed'
  | 'bounced'
  | 'complained'
  | 'opened'
  | 'clicked';

/**
 * Single email record from Resend API
 */
export interface ResendEmail {
  id: string;
  object: 'email';
  to: string[];
  from: string;
  created_at: string;
  subject: string;
  bcc: string[] | null;
  cc: string[] | null;
  reply_to: string[] | null;
  last_event: ResendEmailStatus;
  scheduled_at: string | null;
  html?: string;
  text?: string | null;
}

/**
 * Domain verification status
 */
export type ResendDomainStatus =
  | 'not_started'
  | 'pending'
  | 'verified'
  | 'failed'
  | 'temporary_failure';

/**
 * Domain record from Resend API
 */
export interface ResendDomain {
  id: string;
  object: 'domain';
  name: string;
  status: ResendDomainStatus;
  created_at: string;
  region: string;
}

/**
 * Paginated list response from Resend API
 */
export interface ResendListResponse<T> {
  object: 'list';
  data: T[];
}

/**
 * Email list response
 */
export type ResendEmailListResponse = ResendListResponse<ResendEmail>;

/**
 * Domain list response
 */
export type ResendDomainListResponse = ResendListResponse<ResendDomain>;

/**
 * Aggregated email statistics
 */
export interface ResendDashboardStats {
  totalEmails: number;
  sent: number;
  delivered: number;
  bounced: number;
  opened: number;
  clicked: number;
  complained: number;
  deliveryDelayed: number;
}

/**
 * Dashboard action types for edge function
 */
export type ResendDashboardAction =
  | 'list-emails'
  | 'get-email'
  | 'list-domains';

/**
 * Edge function request parameters
 */
export interface ResendDashboardRequest {
  action: ResendDashboardAction;
  id?: string;
  limit?: number;
}

/**
 * Edge function response wrapper
 */
export interface ResendDashboardResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

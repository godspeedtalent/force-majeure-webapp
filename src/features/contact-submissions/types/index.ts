/**
 * Contact Submissions Types
 *
 * Type definitions for the contact form submissions system.
 */

/**
 * Status of a contact submission
 */
export type ContactSubmissionStatus = 'unread' | 'read' | 'replied' | 'archived';

/**
 * Contact submission from the database
 */
export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: ContactSubmissionStatus;
  user_id: string | null;
  notes: string | null;
  replied_at: string | null;
  replied_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Filter parameters for querying contact submissions
 */
export interface ContactSubmissionFilters {
  status?: ContactSubmissionStatus[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

/**
 * Status configuration for display
 */
export const STATUS_CONFIG: Record<
  ContactSubmissionStatus,
  { label: string; color: string; bgColor: string }
> = {
  unread: {
    label: 'Unread',
    color: 'text-fm-gold',
    bgColor: 'bg-fm-gold/20',
  },
  read: {
    label: 'Read',
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/20',
  },
  replied: {
    label: 'Replied',
    color: 'text-green-400',
    bgColor: 'bg-green-400/20',
  },
  archived: {
    label: 'Archived',
    color: 'text-gray-400',
    bgColor: 'bg-gray-400/20',
  },
};

/**
 * All available statuses for filter UI
 */
export const ALL_STATUSES: ContactSubmissionStatus[] = [
  'unread',
  'read',
  'replied',
  'archived',
];

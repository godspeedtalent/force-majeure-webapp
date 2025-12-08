/**
 * Report-related types
 * These types define the structure of report configurations, recipients, and history
 */

export interface ReportConfiguration {
  id: string;
  event_id: string;
  report_type: string;
  is_scheduled: boolean;
  schedule_type: string | null;
  schedule_time: string;
  schedule_day_of_week: number | null;
  schedule_day_of_month: number | null;
  last_sent_at: string | null;
  next_send_at: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ReportRecipient {
  id: string;
  report_config_id: string;
  email: string;
  name: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ReportHistory {
  id: string;
  report_config_id: string;
  sent_at: string;
  recipients_count: number;
  status: string;
  error_message: string | null;
  file_url: string | null;
  created_at: string;
}

export interface TrackingLink {
  id: string;
  event_id: string;
  code: string;
  name: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string | null;
  utm_term: string | null;
  custom_destination_url: string | null;
  expires_at: string | null;
  max_clicks: number | null;
  click_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LinkClick {
  id: string;
  link_id: string;
  session_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  referrer: string | null;
  device_info: {
    browser: string;
    os: string;
    device_type: string;
    is_mobile: boolean;
  } | null;
  country: string | null;
  city: string | null;
  clicked_at: string;
}

export interface TrackingLinkFormData {
  name: string;
  code: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content?: string;
  utm_term?: string;
  custom_destination_url?: string;
  expires_at?: Date;
  max_clicks?: number;
}

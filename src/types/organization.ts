/**
 * Organization type definitions
 *
 * These types match the organizations table in Supabase.
 * Social media fields will be added via pending migration.
 */

export interface Organization {
  id: string;
  name: string;
  profile_picture: string | null;
  owner_id: string;
  created_at: string | null;
  updated_at: string | null;
  // Address fields
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
  // Social media fields (added via migration 20260122210000)
  website?: string | null;
  social_email?: string | null;
  instagram_handle?: string | null;
  facebook_url?: string | null;
  youtube_url?: string | null;
  tiktok_handle?: string | null;
  twitter_handle?: string | null;
}

export interface CreateOrganizationInput {
  name: string;
  profile_picture?: string | null;
  owner_id: string;
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country?: string | null;
  website?: string | null;
  social_email?: string | null;
  instagram_handle?: string | null;
  facebook_url?: string | null;
  youtube_url?: string | null;
  tiktok_handle?: string | null;
  twitter_handle?: string | null;
}

export interface UpdateOrganizationInput {
  name?: string;
  profile_picture?: string | null;
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  country?: string | null;
  website?: string | null;
  social_email?: string | null;
  instagram_handle?: string | null;
  facebook_url?: string | null;
  youtube_url?: string | null;
  tiktok_handle?: string | null;
  twitter_handle?: string | null;
}

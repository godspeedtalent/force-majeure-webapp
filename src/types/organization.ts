/**
 * Organization type definitions
 * 
 * This type matches the database schema for the organizations table,
 * with optional social media fields for UI compatibility.
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
  // Social media fields (optional - may not exist in all DB records)
  website?: string | null;
  social_email?: string | null;
  instagram_handle?: string | null;
  facebook_url?: string | null;
  youtube_url?: string | null;
  tiktok_handle?: string | null;
  twitter_handle?: string | null;
  // Optional owner data (when joined)
  owner?: {
    user_id: string;
    display_name: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface CreateOrganizationInput {
  name: string;
  profile_picture?: string | null;
  owner_id: string;
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
  // Social media fields
  website?: string | null;
  social_email?: string | null;
  instagram_handle?: string | null;
  facebook_url?: string | null;
  youtube_url?: string | null;
  tiktok_handle?: string | null;
  twitter_handle?: string | null;
}

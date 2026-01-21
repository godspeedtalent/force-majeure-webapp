/**
 * Organization type definitions
 */

export interface Organization {
  id: string;
  name: string;
  profile_picture: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
  // Social media fields
  website: string | null;
  social_email: string | null;
  instagram_handle: string | null;
  facebook_url: string | null;
  youtube_url: string | null;
  tiktok_handle: string | null;
  twitter_handle: string | null;
}

export interface CreateOrganizationInput {
  name: string;
  profile_picture?: string | null;
  owner_id: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  profile_picture?: string | null;
  // Social media fields
  website?: string | null;
  social_email?: string | null;
  instagram_handle?: string | null;
  facebook_url?: string | null;
  youtube_url?: string | null;
  tiktok_handle?: string | null;
  twitter_handle?: string | null;
}

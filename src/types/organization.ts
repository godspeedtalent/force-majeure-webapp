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
}

export interface CreateOrganizationInput {
  name: string;
  profile_picture?: string | null;
  owner_id: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  profile_picture?: string | null;
}

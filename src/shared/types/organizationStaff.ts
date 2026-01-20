/**
 * Organization Staff Types
 *
 * Types for managing staff assignments on organizations.
 * Staff members can have 'admin' or 'staff' roles within the organization.
 */

export type OrganizationStaffRole = 'admin' | 'staff';

export interface OrganizationStaff {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationStaffRole;
  created_at: string;
  updated_at: string;
}

/**
 * Organization staff with joined user data for display
 */
export interface OrganizationStaffWithDetails extends OrganizationStaff {
  profiles?: {
    id: string;
    user_id: string;
    display_name: string | null;
    full_name: string | null;
    avatar_url: string | null;
    email?: string | null;
  } | null;
}

/**
 * Input for adding new organization staff
 */
export interface AddOrganizationStaffInput {
  organization_id: string;
  user_id: string;
  role: OrganizationStaffRole;
}

/**
 * Input for updating organization staff role
 */
export interface UpdateOrganizationStaffInput {
  id: string;
  role: OrganizationStaffRole;
}

/**
 * Staff role display info
 */
export const ORG_STAFF_ROLES: Record<OrganizationStaffRole, { label: string; description: string }> = {
  admin: {
    label: 'Admin',
    description: 'Can manage organization settings and staff',
  },
  staff: {
    label: 'Staff',
    description: 'Can view organization and scan tickets at events',
  },
};

/**
 * Event Staff Types
 *
 * Types for managing staff assignments on events.
 * Staff can be individual users or entire organizations.
 */

export type EventStaffRole = 'staff' | 'manager';

export interface EventStaff {
  id: string;
  event_id: string;
  user_id: string | null;
  organization_id: string | null;
  role: EventStaffRole;
  created_at: string;
  updated_at: string;
}

/**
 * Event staff with joined user/organization data for display
 */
export interface EventStaffWithDetails extends EventStaff {
  profiles?: {
    id: string;
    user_id: string;
    display_name: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  organizations?: {
    id: string;
    name: string;
    profile_picture: string | null;
  } | null;
}

/**
 * Input for adding new event staff
 */
export interface AddEventStaffInput {
  event_id: string;
  user_id?: string;
  organization_id?: string;
  role: EventStaffRole;
}

/**
 * Input for updating event staff role
 */
export interface UpdateEventStaffInput {
  id: string;
  role: EventStaffRole;
}

/**
 * Staff role display info
 */
export const STAFF_ROLES: Record<EventStaffRole, { label: string; description: string }> = {
  staff: {
    label: 'Staff',
    description: 'Can scan tickets and view event info',
  },
  manager: {
    label: 'Manager',
    description: 'Full access to event management',
  },
};

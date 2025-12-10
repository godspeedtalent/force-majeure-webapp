/**
 * Groups Types
 *
 * Types for event-based group management and coordination.
 * Groups allow users to organize meetups and coordinate attendance at events.
 */

export interface Group {
  id: string;
  name: string;
  creator_id: string;
  created_at: string;
  event_id?: string;
  is_active: boolean;
  max_members: number;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
  invited_by?: string;
}

export interface GroupWithMembers extends Group {
  members: GroupMember[];
  member_count: number;
}

export interface GroupEventRSVP {
  user_id: string;
  event_id: string;
  status: 'going' | 'maybe' | 'not_going';
  updated_at: string;
}

// Database row types (snake_case from Supabase)
export interface GroupRow {
  id: string;
  name: string;
  creator_id: string;
  created_at: string;
  event_id: string | null;
  is_active: boolean;
  max_members: number;
}

export interface GroupMemberRow {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string;
  invited_by: string | null;
}

// Utility types for creating/updating groups
export interface CreateGroup {
  name: string;
  event_id?: string;
  max_members?: number;
}

export interface UpdateGroup {
  name?: string;
  event_id?: string;
  is_active?: boolean;
  max_members?: number;
}

export interface InviteToGroup {
  group_id: string;
  user_id: string;
}

// Extended types for UI
export interface GroupWithMembersAndEvent extends GroupWithMembers {
  event?: {
    id: string;
    title: string;
    date: string;
    venue_name?: string;
  };
}

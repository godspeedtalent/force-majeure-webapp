/**
 * Rave Family Types
 *
 * Types for the mobile-first rave family network feature.
 * Includes bidirectional friend connections and extended network visualization.
 */

export interface RaveFamilyConnection {
  id: string;
  user_id: string;
  family_member_id: string;
  connected_at: string;
  connection_method: 'nfc' | 'qr_scan' | 'manual';
  created_at: string;
}

export interface RaveFamilyMember {
  id: string;
  username: string;
  avatar_url?: string;
  privacy_settings: {
    profile_visibility: 'public' | 'private';
    show_on_network: boolean;
    show_event_attendance: boolean;
    show_family_count: boolean;
  };
}

export interface ExtendedFamilyMember extends RaveFamilyMember {
  is_extended: true;
  connection_path: string[]; // Array of user IDs showing connection path
  degree_of_separation: number;
}

export interface FamilyNetworkNode {
  id: string;
  type: 'self' | 'immediate' | 'extended';
  member: RaveFamilyMember;
  family_count: number;
  x?: number; // For graph layout
  y?: number;
}

export interface FamilyNetworkEdge {
  from: string;
  to: string;
  is_shared: boolean; // True if both users share this connection
}

export interface FamilyNetworkGraph {
  nodes: FamilyNetworkNode[];
  edges: FamilyNetworkEdge[];
}

// Database row types (snake_case from Supabase)
export interface RaveFamilyRow {
  id: string;
  user_id: string;
  family_member_id: string;
  connected_at: string;
  connection_method: 'nfc' | 'qr_scan' | 'manual';
  created_at: string;
}

// Utility type for creating new connections
export interface CreateRaveFamilyConnection {
  family_member_id: string;
  connection_method: 'nfc' | 'qr_scan' | 'manual';
}

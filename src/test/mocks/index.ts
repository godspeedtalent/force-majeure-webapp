import { vi } from 'vitest';

// Mock Supabase client
export const mockSupabaseClient = {
  auth: {
    getSession: vi.fn(),
    getUser: vi.fn(),
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
  })),
  functions: {
    invoke: vi.fn(),
  },
};

// Mock React Router
export const mockNavigate = vi.fn();
export const mockUseSearchParams = vi.fn(() => [
  new URLSearchParams(),
  vi.fn(),
]);

// Mock React Query
export const mockUseQuery = vi.fn();
export const mockUseMutation = vi.fn();

// Mock Auth Context
export const mockAuthContext = {
  user: null,
  profile: null,
  loading: false,
};

// Mock Feature Flags
export const mockFeatureFlags = {
  scavenger_hunt_active: true,
  coming_soon_mode: false,
  show_leaderboard: true,
};

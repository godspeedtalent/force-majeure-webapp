import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { waitFor } from '@/test/utils/testUtils';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useUserRole, useUserPermissions } from './useUserRole';
import { PERMISSIONS, ROLES } from '@/shared';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
  },
}));

// Mock Auth
vi.mock('@/features/auth/services/AuthContext', () => ({
  useAuth: vi.fn(),
  useAuthSafe: vi.fn(() => ({ user: null, session: null, loading: false })),
}));

// Mock logger
vi.mock('@/shared/services/logger', () => ({
  logger: {
    error: vi.fn(),
    createNamespace: () => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
  },
}));

// Mock MockRoleContext
vi.mock('@/shared/contexts/MockRoleContext', () => ({
  useMockRoleSafe: vi.fn(() => ({
    isMockActive: false,
    isUnauthenticated: false,
    getActiveMockRoles: () => [],
    getMockPermissions: () => [],
    mockRole: null,
  })),
}));

// Mock debugAccessService
vi.mock('@/shared/services/debugAccessService', () => ({
  debugAccessService: {
    setDebugAccess: vi.fn(),
    clearDebugAccess: vi.fn(),
  },
}));

// Mock rolesStore
vi.mock('@/shared/stores/rolesStore', () => ({
  rolesStore: {
    getRoleByName: vi.fn(() => null),
  },
}));

import { supabase } from '@/integrations/supabase/client';
import { useAuthSafe } from '@/features/auth/services/AuthContext';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useUserRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return null when no user', async () => {
    vi.mocked(useAuthSafe).mockReturnValue({ user: null } as any);

    const { result } = renderHook(() => useUserRole(), { wrapper: createWrapper() });

    // Query should not be enabled
    expect(result.current.data).toBeUndefined();
  });

  it('should fetch user roles when user exists', async () => {
    vi.mocked(useAuthSafe).mockReturnValue({
      user: { id: 'user-123' },
    } as any);

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: [
        {
          role_name: 'admin',
          display_name: 'Administrator',
          permission_names: ['*'],
        },
      ],
      error: null,
    } as any);

    const { result } = renderHook(() => useUserRole(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(supabase.rpc).toHaveBeenCalledWith('get_user_roles', {
      user_id_param: 'user-123',
    });

    expect(result.current.data).toEqual([
      {
        role_name: 'admin',
        display_name: 'Administrator',
        permission_names: ['*'],
      },
    ]);
  });

  it('should return empty array on error', async () => {
    vi.mocked(useAuthSafe).mockReturnValue({
      user: { id: 'user-123' },
    } as any);

    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    } as any);

    const { result } = renderHook(() => useUserRole(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isFetched).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });
});

describe('useUserPermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isAdmin', () => {
    it('should return true when user has admin role', async () => {
      vi.mocked(useAuthSafe).mockReturnValue({
        user: { id: 'user-123' },
      } as any);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [
          { role_name: 'admin', display_name: 'Admin', permission_names: ['*'] },
        ],
        error: null,
      } as any);

      const { result } = renderHook(() => useUserPermissions(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.roles).toBeDefined();
      });

      expect(result.current.isAdmin()).toBe(true);
    });

    it('should return false when user does not have admin role', async () => {
      vi.mocked(useAuthSafe).mockReturnValue({
        user: { id: 'user-123' },
      } as any);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [
          { role_name: 'org_staff', display_name: 'Org Staff', permission_names: ['view_organization'] },
        ],
        error: null,
      } as any);

      const { result } = renderHook(() => useUserPermissions(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.roles).toBeDefined();
      });

      expect(result.current.isAdmin()).toBe(false);
    });

    it('should return false when no roles', async () => {
      vi.mocked(useAuthSafe).mockReturnValue({
        user: { id: 'user-123' },
      } as any);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'Error' },
      } as any);

      const { result } = renderHook(() => useUserPermissions(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.isAdmin()).toBe(false);
      });
    });
  });

  describe('hasPermission', () => {
    it('should return true for admin regardless of specific permission', async () => {
      vi.mocked(useAuthSafe).mockReturnValue({
        user: { id: 'user-123' },
      } as any);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [
          { role_name: 'admin', display_name: 'Admin', permission_names: [] },
        ],
        error: null,
      } as any);

      const { result } = renderHook(() => useUserPermissions(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.roles).toBeDefined();
      });

      expect(result.current.hasPermission(PERMISSIONS.MANAGE_ORGANIZATION)).toBe(true);
      expect(result.current.hasPermission(PERMISSIONS.SCAN_TICKETS)).toBe(true);
    });

    it('should return true when user has specific permission', async () => {
      vi.mocked(useAuthSafe).mockReturnValue({
        user: { id: 'user-123' },
      } as any);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [
          {
            role_name: 'org_staff',
            display_name: 'Staff',
            permission_names: ['scan_tickets', 'view_organization'],
          },
        ],
        error: null,
      } as any);

      const { result } = renderHook(() => useUserPermissions(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.roles).toBeDefined();
      });

      expect(result.current.hasPermission(PERMISSIONS.SCAN_TICKETS)).toBe(true);
      expect(result.current.hasPermission(PERMISSIONS.VIEW_ORGANIZATION)).toBe(true);
    });

    it('should return false when user lacks permission', async () => {
      vi.mocked(useAuthSafe).mockReturnValue({
        user: { id: 'user-123' },
      } as any);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [
          {
            role_name: 'artist',
            display_name: 'Artist',
            permission_names: [],
          },
        ],
        error: null,
      } as any);

      const { result } = renderHook(() => useUserPermissions(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.roles).toBeDefined();
      });

      expect(result.current.hasPermission(PERMISSIONS.MANAGE_ORGANIZATION)).toBe(false);
    });

    it('should return true when user has wildcard permission', async () => {
      vi.mocked(useAuthSafe).mockReturnValue({
        user: { id: 'user-123' },
      } as any);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [
          {
            role_name: 'developer',
            display_name: 'Developer',
            permission_names: ['*'],
          },
        ],
        error: null,
      } as any);

      const { result } = renderHook(() => useUserPermissions(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.roles).toBeDefined();
      });

      expect(result.current.hasPermission(PERMISSIONS.MANAGE_ORGANIZATION)).toBe(true);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true when user has at least one permission', async () => {
      vi.mocked(useAuthSafe).mockReturnValue({
        user: { id: 'user-123' },
      } as any);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [
          {
            role_name: 'staff',
            display_name: 'Staff',
            permission_names: ['scan_tickets'],
          },
        ],
        error: null,
      } as any);

      const { result } = renderHook(() => useUserPermissions(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.roles).toBeDefined();
      });

      expect(
        result.current.hasAnyPermission(
          PERMISSIONS.MANAGE_ORGANIZATION,
          PERMISSIONS.SCAN_TICKETS
        )
      ).toBe(true);
    });

    it('should return false when user has none of the permissions', async () => {
      vi.mocked(useAuthSafe).mockReturnValue({
        user: { id: 'user-123' },
      } as any);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [
          {
            role_name: 'artist',
            display_name: 'Artist',
            permission_names: [],
          },
        ],
        error: null,
      } as any);

      const { result } = renderHook(() => useUserPermissions(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.roles).toBeDefined();
      });

      expect(
        result.current.hasAnyPermission(
          PERMISSIONS.MANAGE_ORGANIZATION,
          PERMISSIONS.SCAN_TICKETS
        )
      ).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true when user has all permissions', async () => {
      vi.mocked(useAuthSafe).mockReturnValue({
        user: { id: 'user-123' },
      } as any);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [
          {
            role_name: 'org_admin',
            display_name: 'Org Admin',
            permission_names: ['manage_organization', 'view_organization', 'scan_tickets'],
          },
        ],
        error: null,
      } as any);

      const { result } = renderHook(() => useUserPermissions(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.roles).toBeDefined();
      });

      expect(
        result.current.hasAllPermissions(
          PERMISSIONS.MANAGE_ORGANIZATION,
          PERMISSIONS.VIEW_ORGANIZATION
        )
      ).toBe(true);
    });

    it('should return false when user lacks one permission', async () => {
      vi.mocked(useAuthSafe).mockReturnValue({
        user: { id: 'user-123' },
      } as any);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [
          {
            role_name: 'staff',
            display_name: 'Staff',
            permission_names: ['view_organization'],
          },
        ],
        error: null,
      } as any);

      const { result } = renderHook(() => useUserPermissions(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.roles).toBeDefined();
      });

      expect(
        result.current.hasAllPermissions(
          PERMISSIONS.MANAGE_ORGANIZATION,
          PERMISSIONS.VIEW_ORGANIZATION
        )
      ).toBe(false);
    });
  });

  describe('hasRole', () => {
    it('should return true when user has role', async () => {
      vi.mocked(useAuthSafe).mockReturnValue({
        user: { id: 'user-123' },
      } as any);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [
          { role_name: 'developer', display_name: 'Developer', permission_names: [] },
        ],
        error: null,
      } as any);

      const { result } = renderHook(() => useUserPermissions(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.roles).toBeDefined();
      });

      expect(result.current.hasRole(ROLES.DEVELOPER)).toBe(true);
    });

    it('should return false when user lacks role', async () => {
      vi.mocked(useAuthSafe).mockReturnValue({
        user: { id: 'user-123' },
      } as any);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [
          { role_name: 'artist', display_name: 'Artist', permission_names: [] },
        ],
        error: null,
      } as any);

      const { result } = renderHook(() => useUserPermissions(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.roles).toBeDefined();
      });

      expect(result.current.hasRole(ROLES.ADMIN)).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('should return true for admin regardless of roles checked', async () => {
      vi.mocked(useAuthSafe).mockReturnValue({
        user: { id: 'user-123' },
      } as any);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [
          { role_name: 'admin', display_name: 'Admin', permission_names: [] },
        ],
        error: null,
      } as any);

      const { result } = renderHook(() => useUserPermissions(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.roles).toBeDefined();
      });

      expect(result.current.hasAnyRole(ROLES.DEVELOPER, ROLES.ORG_ADMIN)).toBe(true);
    });

    it('should return true when user has one of the roles', async () => {
      vi.mocked(useAuthSafe).mockReturnValue({
        user: { id: 'user-123' },
      } as any);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [
          { role_name: 'developer', display_name: 'Developer', permission_names: [] },
        ],
        error: null,
      } as any);

      const { result } = renderHook(() => useUserPermissions(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.roles).toBeDefined();
      });

      expect(result.current.hasAnyRole(ROLES.DEVELOPER, ROLES.ORG_ADMIN)).toBe(true);
    });

    it('should return false when user has none of the roles', async () => {
      vi.mocked(useAuthSafe).mockReturnValue({
        user: { id: 'user-123' },
      } as any);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [
          { role_name: 'artist', display_name: 'Artist', permission_names: [] },
        ],
        error: null,
      } as any);

      const { result } = renderHook(() => useUserPermissions(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.roles).toBeDefined();
      });

      expect(result.current.hasAnyRole(ROLES.DEVELOPER, ROLES.ORG_ADMIN)).toBe(false);
    });
  });

  describe('getRoles', () => {
    it('should return all user role names', async () => {
      vi.mocked(useAuthSafe).mockReturnValue({
        user: { id: 'user-123' },
      } as any);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [
          { role_name: 'admin', display_name: 'Admin', permission_names: [] },
          { role_name: 'developer', display_name: 'Developer', permission_names: [] },
        ],
        error: null,
      } as any);

      const { result } = renderHook(() => useUserPermissions(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.roles).toBeDefined();
      });

      expect(result.current.getRoles()).toEqual(['admin', 'developer']);
    });

    it('should return empty array when no roles', async () => {
      vi.mocked(useAuthSafe).mockReturnValue({
        user: { id: 'user-123' },
      } as any);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'Error' },
      } as any);

      const { result } = renderHook(() => useUserPermissions(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.getRoles()).toEqual([]);
      });
    });
  });

  describe('getPermissions', () => {
    it('should return all unique permissions', async () => {
      vi.mocked(useAuthSafe).mockReturnValue({
        user: { id: 'user-123' },
      } as any);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [
          { role_name: 'role1', display_name: 'Role 1', permission_names: ['perm1', 'perm2'] },
          { role_name: 'role2', display_name: 'Role 2', permission_names: ['perm2', 'perm3'] },
        ],
        error: null,
      } as any);

      const { result } = renderHook(() => useUserPermissions(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.roles).toBeDefined();
      });

      const permissions = result.current.getPermissions();
      expect(permissions).toContain('perm1');
      expect(permissions).toContain('perm2');
      expect(permissions).toContain('perm3');
      expect(permissions.length).toBe(3);
    });

    it('should return empty array when no roles', async () => {
      vi.mocked(useAuthSafe).mockReturnValue({
        user: { id: 'user-123' },
      } as any);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'Error' },
      } as any);

      const { result } = renderHook(() => useUserPermissions(), { wrapper: createWrapper() });

      await waitFor(() => {
        expect(result.current.getPermissions()).toEqual([]);
      });
    });
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ReactNode } from 'react';
import { MockRoleProvider, useMockRole, useMockRoleSafe } from './MockRoleContext';
import { rolesStore } from '@/shared/stores/rolesStore';

// Mock the rolesStore
vi.mock('@/shared/stores/rolesStore', () => ({
  rolesStore: {
    getRoleByName: vi.fn(),
    isLoaded: vi.fn(() => true),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Wrapper component for testing
const wrapper = ({ children }: { children: ReactNode }) => (
  <MockRoleProvider>{children}</MockRoleProvider>
);

describe('MockRoleContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();

    // Reset rolesStore mock
    vi.mocked(rolesStore.isLoaded).mockReturnValue(true);
    vi.mocked(rolesStore.getRoleByName).mockImplementation((name: string) => {
      const roles: Record<string, { name: string; display_name: string; permissions: string[] }> = {
        admin: { name: 'admin', display_name: 'Admin', permissions: ['*'] },
        developer: { name: 'developer', display_name: 'Developer', permissions: ['*', 'access_dev_tools'] },
        fm_staff: { name: 'fm_staff', display_name: 'FM Staff', permissions: ['access_staff_tools'] },
        org_admin: { name: 'org_admin', display_name: 'Org Admin', permissions: ['manage_organization', 'view_organization'] },
        org_staff: { name: 'org_staff', display_name: 'Org Staff', permissions: ['view_organization'] },
        venue_admin: { name: 'venue_admin', display_name: 'Venue Admin', permissions: ['manage_venues'] },
        artist: { name: 'artist', display_name: 'Artist', permissions: [] },
      };
      return roles[name] as ReturnType<typeof rolesStore.getRoleByName>;
    });
  });

  describe('Initial State', () => {
    it('should start with no mock active', () => {
      const { result } = renderHook(() => useMockRole(), { wrapper });
      expect(result.current.isMockActive).toBe(false);
    });

    it('should start with empty pending and applied states', () => {
      const { result } = renderHook(() => useMockRole(), { wrapper });
      expect(result.current.appliedState).toEqual({ isUnauthenticated: false, roles: [] });
      expect(result.current.pendingState).toEqual({ isUnauthenticated: false, roles: [] });
    });

    it('should return disabled for legacy mockRole when no simulation active', () => {
      const { result } = renderHook(() => useMockRole(), { wrapper });
      expect(result.current.mockRole).toBe('disabled');
    });

    it('should have no pending changes initially', () => {
      const { result } = renderHook(() => useMockRole(), { wrapper });
      expect(result.current.hasPendingChanges).toBe(false);
    });
  });

  describe('togglePendingRole', () => {
    it('should add a role to pending state', () => {
      const { result } = renderHook(() => useMockRole(), { wrapper });

      act(() => {
        result.current.togglePendingRole('admin');
      });

      expect(result.current.pendingState.roles).toContain('admin');
      expect(result.current.isPendingRoleSelected('admin')).toBe(true);
    });

    it('should remove a role from pending state when toggled again', () => {
      const { result } = renderHook(() => useMockRole(), { wrapper });

      act(() => {
        result.current.togglePendingRole('admin');
      });
      expect(result.current.pendingState.roles).toContain('admin');

      act(() => {
        result.current.togglePendingRole('admin');
      });
      expect(result.current.pendingState.roles).not.toContain('admin');
    });

    it('should auto-add dependencies when adding a role with dependencies', () => {
      const { result } = renderHook(() => useMockRole(), { wrapper });

      // developer requires fm_staff role
      act(() => {
        result.current.togglePendingRole('developer');
      });

      expect(result.current.pendingState.roles).toContain('developer');
      expect(result.current.pendingState.roles).toContain('fm_staff');
    });

    it('should auto-remove dependents when removing a required role', () => {
      const { result } = renderHook(() => useMockRole(), { wrapper });

      // First add developer (which adds fm_staff as dependency)
      act(() => {
        result.current.togglePendingRole('developer');
      });
      expect(result.current.pendingState.roles).toContain('developer');
      expect(result.current.pendingState.roles).toContain('fm_staff');

      // Now remove fm_staff - should also remove developer
      act(() => {
        result.current.togglePendingRole('fm_staff');
      });
      expect(result.current.pendingState.roles).not.toContain('fm_staff');
      expect(result.current.pendingState.roles).not.toContain('developer');
    });

    it('should clear unauthenticated when adding roles', () => {
      const { result } = renderHook(() => useMockRole(), { wrapper });

      // First enable unauthenticated
      act(() => {
        result.current.togglePendingUnauthenticated();
      });
      expect(result.current.isPendingUnauthenticated).toBe(true);

      // Now add a role - should disable unauthenticated
      act(() => {
        result.current.togglePendingRole('admin');
      });
      expect(result.current.isPendingUnauthenticated).toBe(false);
      expect(result.current.pendingState.roles).toContain('admin');
    });

    it('should not add invalid roles', () => {
      const { result } = renderHook(() => useMockRole(), { wrapper });

      // Mock isLoaded to return false so validation only uses ROLES constant
      vi.mocked(rolesStore.isLoaded).mockReturnValue(false);
      vi.mocked(rolesStore.getRoleByName).mockReturnValue(undefined);

      act(() => {
        result.current.togglePendingRole('invalid_role_xyz');
      });

      expect(result.current.pendingState.roles).not.toContain('invalid_role_xyz');
    });
  });

  describe('togglePendingUnauthenticated', () => {
    it('should toggle unauthenticated state', () => {
      const { result } = renderHook(() => useMockRole(), { wrapper });

      expect(result.current.isPendingUnauthenticated).toBe(false);

      act(() => {
        result.current.togglePendingUnauthenticated();
      });

      expect(result.current.isPendingUnauthenticated).toBe(true);
    });

    it('should clear roles when enabling unauthenticated', () => {
      const { result } = renderHook(() => useMockRole(), { wrapper });

      // First add some roles
      act(() => {
        result.current.togglePendingRole('admin');
      });
      expect(result.current.pendingState.roles).toContain('admin');

      // Now enable unauthenticated - should clear roles
      act(() => {
        result.current.togglePendingUnauthenticated();
      });

      expect(result.current.isPendingUnauthenticated).toBe(true);
      expect(result.current.pendingState.roles).toHaveLength(0);
    });
  });

  describe('applySimulation', () => {
    it('should copy pending state to applied state', () => {
      const { result } = renderHook(() => useMockRole(), { wrapper });

      act(() => {
        result.current.togglePendingRole('admin');
      });
      expect(result.current.appliedState.roles).not.toContain('admin');

      act(() => {
        result.current.applySimulation();
      });

      expect(result.current.appliedState.roles).toContain('admin');
    });

    it('should set isMockActive to true when roles are applied', () => {
      const { result } = renderHook(() => useMockRole(), { wrapper });

      // Separate act() calls to allow React to update the callback closures
      act(() => {
        result.current.togglePendingRole('admin');
      });

      act(() => {
        result.current.applySimulation();
      });

      expect(result.current.isMockActive).toBe(true);
    });

    it('should set isMockActive to true when unauthenticated is applied', () => {
      const { result } = renderHook(() => useMockRole(), { wrapper });

      // Separate act() calls to allow React to update the callback closures
      act(() => {
        result.current.togglePendingUnauthenticated();
      });

      act(() => {
        result.current.applySimulation();
      });

      expect(result.current.isMockActive).toBe(true);
      expect(result.current.isUnauthenticated).toBe(true);
    });
  });

  describe('clearMockRole', () => {
    it('should reset both pending and applied states', () => {
      const { result } = renderHook(() => useMockRole(), { wrapper });

      // Set up some state - separate act() calls
      act(() => {
        result.current.togglePendingRole('admin');
      });

      act(() => {
        result.current.applySimulation();
      });
      expect(result.current.isMockActive).toBe(true);

      // Clear
      act(() => {
        result.current.clearMockRole();
      });

      expect(result.current.appliedState).toEqual({ isUnauthenticated: false, roles: [] });
      expect(result.current.pendingState).toEqual({ isUnauthenticated: false, roles: [] });
    });

    it('should set isMockActive to false', () => {
      const { result } = renderHook(() => useMockRole(), { wrapper });

      // Separate act() calls
      act(() => {
        result.current.togglePendingRole('admin');
      });

      act(() => {
        result.current.applySimulation();
      });
      expect(result.current.isMockActive).toBe(true);

      act(() => {
        result.current.clearMockRole();
      });

      expect(result.current.isMockActive).toBe(false);
    });
  });

  describe('resetPending', () => {
    it('should copy applied state to pending state', () => {
      const { result } = renderHook(() => useMockRole(), { wrapper });

      // Apply admin role - separate act() calls
      act(() => {
        result.current.togglePendingRole('admin');
      });

      act(() => {
        result.current.applySimulation();
      });

      // Change pending state
      act(() => {
        result.current.togglePendingRole('org_staff');
      });
      expect(result.current.hasPendingChanges).toBe(true);

      // Reset pending
      act(() => {
        result.current.resetPending();
      });

      expect(result.current.pendingState).toEqual(result.current.appliedState);
      expect(result.current.hasPendingChanges).toBe(false);
    });
  });

  describe('hasPendingChanges', () => {
    it('should return false when pending matches applied', () => {
      const { result } = renderHook(() => useMockRole(), { wrapper });
      expect(result.current.hasPendingChanges).toBe(false);
    });

    it('should return true when roles differ', () => {
      const { result } = renderHook(() => useMockRole(), { wrapper });

      act(() => {
        result.current.togglePendingRole('admin');
      });

      expect(result.current.hasPendingChanges).toBe(true);
    });

    it('should return true when unauthenticated differs', () => {
      const { result } = renderHook(() => useMockRole(), { wrapper });

      act(() => {
        result.current.togglePendingUnauthenticated();
      });

      expect(result.current.hasPendingChanges).toBe(true);
    });

    it('should return false after applying changes', () => {
      const { result } = renderHook(() => useMockRole(), { wrapper });

      act(() => {
        result.current.togglePendingRole('admin');
      });
      expect(result.current.hasPendingChanges).toBe(true);

      // Separate act() to allow state update
      act(() => {
        result.current.applySimulation();
      });
      expect(result.current.hasPendingChanges).toBe(false);
    });
  });

  describe('isRoleSelectedAsDependency', () => {
    it('should return true for auto-selected dependencies', () => {
      const { result } = renderHook(() => useMockRole(), { wrapper });

      // developer adds fm_staff as dependency
      act(() => {
        result.current.togglePendingRole('developer');
      });

      expect(result.current.isRoleSelectedAsDependency('fm_staff')).toBe(true);
      expect(result.current.isRoleSelectedAsDependency('developer')).toBe(false);
    });

    it('should return false for directly selected roles', () => {
      const { result } = renderHook(() => useMockRole(), { wrapper });

      act(() => {
        result.current.togglePendingRole('admin');
      });

      expect(result.current.isRoleSelectedAsDependency('admin')).toBe(false);
    });

    it('should return false for unselected roles', () => {
      const { result } = renderHook(() => useMockRole(), { wrapper });

      expect(result.current.isRoleSelectedAsDependency('admin')).toBe(false);
    });
  });

  describe('getMockPermissions', () => {
    it('should return empty for unauthenticated', () => {
      const { result } = renderHook(() => useMockRole(), { wrapper });

      // Separate act() calls
      act(() => {
        result.current.togglePendingUnauthenticated();
      });

      act(() => {
        result.current.applySimulation();
      });

      expect(result.current.getMockPermissions()).toEqual([]);
    });

    it('should aggregate permissions from all mock roles', () => {
      const { result } = renderHook(() => useMockRole(), { wrapper });

      // Separate act() calls
      act(() => {
        result.current.togglePendingRole('org_admin');
      });

      act(() => {
        result.current.applySimulation();
      });

      const permissions = result.current.getMockPermissions();
      expect(permissions).toContain('manage_organization');
      expect(permissions).toContain('view_organization');
    });

    it('should return empty when store not loaded', () => {
      vi.mocked(rolesStore.isLoaded).mockReturnValue(false);

      const { result } = renderHook(() => useMockRole(), { wrapper });

      // Separate act() calls
      act(() => {
        result.current.togglePendingRole('admin');
      });

      act(() => {
        result.current.applySimulation();
      });

      expect(result.current.getMockPermissions()).toEqual([]);
    });
  });

  describe('getActiveMockRoles', () => {
    it('should return empty array when no simulation active', () => {
      const { result } = renderHook(() => useMockRole(), { wrapper });
      expect(result.current.getActiveMockRoles()).toEqual([]);
    });

    it('should return applied roles when simulation active', () => {
      const { result } = renderHook(() => useMockRole(), { wrapper });

      // Separate act() calls
      act(() => {
        result.current.togglePendingRole('admin');
      });

      act(() => {
        result.current.applySimulation();
      });

      expect(result.current.getActiveMockRoles()).toContain('admin');
    });
  });

  describe('isSimulatingRole', () => {
    it('should return false when no mock active', () => {
      const { result } = renderHook(() => useMockRole(), { wrapper });
      expect(result.current.isSimulatingRole('admin')).toBe(false);
    });

    it('should return true for applied mock role', () => {
      const { result } = renderHook(() => useMockRole(), { wrapper });

      // Separate act() calls
      act(() => {
        result.current.togglePendingRole('admin');
      });

      act(() => {
        result.current.applySimulation();
      });

      expect(result.current.isSimulatingRole('admin')).toBe(true);
    });

    it('should return false for unauthenticated simulation', () => {
      const { result } = renderHook(() => useMockRole(), { wrapper });

      // Separate act() calls
      act(() => {
        result.current.togglePendingUnauthenticated();
      });

      act(() => {
        result.current.applySimulation();
      });

      expect(result.current.isSimulatingRole('admin')).toBe(false);
    });
  });

  describe('Legacy setMockRole', () => {
    it('should set and apply a single role immediately', () => {
      const { result } = renderHook(() => useMockRole(), { wrapper });

      act(() => {
        result.current.setMockRole('admin');
      });

      expect(result.current.mockRole).toBe('admin');
      expect(result.current.isMockActive).toBe(true);
    });

    it('should clear mock when set to disabled', () => {
      const { result } = renderHook(() => useMockRole(), { wrapper });

      act(() => {
        result.current.setMockRole('admin');
      });
      expect(result.current.isMockActive).toBe(true);

      act(() => {
        result.current.setMockRole('disabled');
      });
      expect(result.current.isMockActive).toBe(false);
      expect(result.current.mockRole).toBe('disabled');
    });

    it('should set unauthenticated mode', () => {
      const { result } = renderHook(() => useMockRole(), { wrapper });

      act(() => {
        result.current.setMockRole('unauthenticated');
      });

      expect(result.current.mockRole).toBe('unauthenticated');
      expect(result.current.isUnauthenticated).toBe(true);
    });
  });

  describe('useMockRoleSafe', () => {
    it('should return defaults when context is not available', () => {
      // Render without wrapper (no provider)
      const { result } = renderHook(() => useMockRoleSafe());

      expect(result.current.isMockActive).toBe(false);
      expect(result.current.appliedState).toEqual({ isUnauthenticated: false, roles: [] });
      expect(result.current.mockRole).toBe('disabled');
      expect(result.current.getMockPermissions()).toEqual([]);
    });

    it('should work normally when context is available', () => {
      const { result } = renderHook(() => useMockRoleSafe(), { wrapper });

      // Separate act() calls
      act(() => {
        result.current.togglePendingRole('admin');
      });

      act(() => {
        result.current.applySimulation();
      });

      expect(result.current.isMockActive).toBe(true);
    });
  });

  describe('getRolesDependingOn', () => {
    it('should return roles that depend on the given role', () => {
      const { result } = renderHook(() => useMockRole(), { wrapper });

      // Add developer which depends on fm_staff
      act(() => {
        result.current.togglePendingRole('developer');
      });

      const dependents = result.current.getRolesDependingOn('fm_staff');
      expect(dependents).toContain('developer');
    });

    it('should return empty array for role with no dependents', () => {
      const { result } = renderHook(() => useMockRole(), { wrapper });

      act(() => {
        result.current.togglePendingRole('admin');
      });

      expect(result.current.getRolesDependingOn('admin')).toEqual([]);
    });
  });

  describe('getRolesRequiredBy', () => {
    it('should return dependencies for a role', () => {
      const { result } = renderHook(() => useMockRole(), { wrapper });

      const required = result.current.getRolesRequiredBy('developer');
      expect(required).toContain('fm_staff');
    });

    it('should return empty array for role with no dependencies', () => {
      const { result } = renderHook(() => useMockRole(), { wrapper });

      expect(result.current.getRolesRequiredBy('admin')).toEqual([]);
    });
  });

  describe('Multi-role simulation', () => {
    it('should support selecting multiple roles', () => {
      const { result } = renderHook(() => useMockRole(), { wrapper });

      act(() => {
        result.current.togglePendingRole('org_admin');
        result.current.togglePendingRole('venue_admin');
      });

      // Both should be selected (no dependencies for these roles anymore)
      expect(result.current.pendingState.roles).toContain('org_admin');
      expect(result.current.pendingState.roles).toContain('venue_admin');
    });

    it('should aggregate permissions from multiple roles', () => {
      const { result } = renderHook(() => useMockRole(), { wrapper });

      // Multiple toggles can be in same act() but apply needs separate
      act(() => {
        result.current.togglePendingRole('org_admin');
        result.current.togglePendingRole('venue_admin');
      });

      act(() => {
        result.current.applySimulation();
      });

      const permissions = result.current.getMockPermissions();
      expect(permissions).toContain('manage_organization');
      expect(permissions).toContain('view_organization');
      expect(permissions).toContain('manage_venues');
    });
  });
});

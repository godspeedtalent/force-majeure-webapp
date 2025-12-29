import { createContext, useContext, useCallback, useMemo, ReactNode } from 'react';
import { rolesStore } from '@/shared/stores/rolesStore';
import { useLocalStorage } from '@/shared/hooks/useLocalStorage';

/**
 * Special mock role modes:
 * - 'disabled': Use actual user roles (no simulation)
 * - 'unauthenticated': Simulate a logged-out user (no roles, no permissions)
 * - Any other string: Simulate that specific role name
 */
export type MockRoleMode = 'disabled' | 'unauthenticated' | string;

export const MOCK_ROLE_UNAUTHENTICATED = 'unauthenticated' as const;

interface MockRoleContextValue {
  /**
   * Current mock role mode
   * - 'disabled': Use actual user roles (no simulation)
   * - 'unauthenticated': Simulate a logged-out user (no roles, no permissions)
   * - Role name string: Simulate that specific role
   */
  mockRole: MockRoleMode;

  /**
   * Set the mock role to simulate
   */
  setMockRole: (role: MockRoleMode) => void;

  /**
   * Whether mock role simulation is active
   */
  isMockActive: boolean;

  /**
   * Clear mock role and return to actual user roles
   */
  clearMockRole: () => void;

  /**
   * Get the permissions for the current mock role
   * Fetches from rolesStore (database) dynamically
   */
  getMockPermissions: () => string[];
}

const MockRoleContext = createContext<MockRoleContextValue | null>(null);

const STORAGE_KEY = 'fm-mock-role';

interface MockRoleProviderProps {
  children: ReactNode;
}

export const MockRoleProvider = ({ children }: MockRoleProviderProps) => {
  const [mockRole, setMockRole] = useLocalStorage<MockRoleMode>(STORAGE_KEY, 'disabled');

  const clearMockRole = useCallback(() => {
    setMockRole('disabled');
  }, [setMockRole]);

  const isMockActive = mockRole !== 'disabled';

  const getMockPermissions = useCallback((): string[] => {
    if (mockRole === 'disabled') return [];

    // Get permissions from the rolesStore (dynamically from database)
    const roleRecord = rolesStore.getRoleByName(mockRole);
    if (roleRecord) {
      return roleRecord.permissions || [];
    }

    // Role not found in store - return empty permissions
    return [];
  }, [mockRole]);

  const value = useMemo(() => ({
    mockRole,
    setMockRole,
    isMockActive,
    clearMockRole,
    getMockPermissions,
  }), [mockRole, setMockRole, isMockActive, clearMockRole, getMockPermissions]);

  return (
    <MockRoleContext.Provider value={value}>
      {children}
    </MockRoleContext.Provider>
  );
};

export const useMockRole = (): MockRoleContextValue => {
  const context = useContext(MockRoleContext);
  if (!context) {
    throw new Error('useMockRole must be used within a MockRoleProvider');
  }
  return context;
};

/**
 * Safe version of useMockRole that returns defaults when context is not available
 * Use this in hooks that may be used outside of MockRoleProvider
 */
export const useMockRoleSafe = (): MockRoleContextValue => {
  const context = useContext(MockRoleContext);

  // Return no-op defaults if context is not available
  if (!context) {
    return {
      mockRole: 'disabled',
      setMockRole: () => {},
      isMockActive: false,
      clearMockRole: () => {},
      getMockPermissions: () => [],
    };
  }

  return context;
};

import { createContext, useContext, useCallback, useMemo, useEffect, useRef, ReactNode } from 'react';
import { rolesStore } from '@/shared/stores/rolesStore';
import { useLocalStorage } from '@/shared/hooks/useLocalStorage';
import { logger } from '@/shared/services/logger';
import { isProduction } from '@/shared/utils/environment';
import {
  type Role,
  ROLES,
  getRoleDependencies,
  getDependentRoles,
  ensureRoleDependencies,
  getRolesToRemove,
} from '@/shared/auth/permissions';

/**
 * Mock role state structure:
 * - isUnauthenticated: true to simulate logged-out user
 * - roles: Set of active mock role names
 */
export interface MockRoleState {
  isUnauthenticated: boolean;
  roles: string[];
}

export const MOCK_ROLE_UNAUTHENTICATED = 'unauthenticated' as const;

// Default state: no simulation active
const DEFAULT_STATE: MockRoleState = {
  isUnauthenticated: false,
  roles: [],
};

/**
 * Validate that a role name is valid
 * Checks against the database roles store first, then falls back to ROLES constant
 */
function isValidRole(roleName: string): boolean {
  // Check against database roles first (if loaded)
  if (rolesStore.isLoaded() && rolesStore.getRoleByName(roleName)) {
    return true;
  }
  // Fall back to ROLES constant for type-safe roles
  return Object.values(ROLES).includes(roleName as Role);
}

interface MockRoleContextValue {
  /**
   * Currently APPLIED mock role state (what's actually being simulated)
   */
  appliedState: MockRoleState;

  /**
   * PENDING mock role state (what's selected but not yet applied)
   */
  pendingState: MockRoleState;

  /**
   * Toggle a specific role on/off in the PENDING selection
   * Handles dependencies automatically:
   * - Adding a role adds its required dependencies
   * - Removing a role removes roles that depend on it
   */
  togglePendingRole: (roleName: string) => void;

  /**
   * Check if a specific role is in the PENDING selection
   */
  isPendingRoleSelected: (roleName: string) => boolean;

  /**
   * Check if a role is selected because it's a dependency of another selected role
   */
  isRoleSelectedAsDependency: (roleName: string) => boolean;

  /**
   * Get the roles that require this role (if this role is removed, these will be too)
   */
  getRolesDependingOn: (roleName: string) => string[];

  /**
   * Get the roles that this role requires (auto-selected as dependencies)
   */
  getRolesRequiredBy: (roleName: string) => string[];

  /**
   * Toggle unauthenticated mode in PENDING selection
   */
  togglePendingUnauthenticated: () => void;

  /**
   * Apply the pending selection (start simulation)
   */
  applySimulation: () => void;

  /**
   * Clear all mock roles and return to actual user roles
   */
  clearMockRole: () => void;

  /**
   * Reset pending to match applied (discard pending changes)
   */
  resetPending: () => void;

  /**
   * Whether any mock role simulation is currently APPLIED
   */
  isMockActive: boolean;

  /**
   * Whether the pending selection differs from applied
   */
  hasPendingChanges: boolean;

  /**
   * Whether simulating unauthenticated user (APPLIED)
   */
  isUnauthenticated: boolean;

  /**
   * Whether unauthenticated is selected in PENDING
   */
  isPendingUnauthenticated: boolean;

  /**
   * Get the list of currently APPLIED mock roles
   */
  getActiveMockRoles: () => string[];

  /**
   * Get the combined permissions for all APPLIED mock roles
   */
  getMockPermissions: () => string[];

  /**
   * Check if a specific role is being simulated (APPLIED)
   * Use this in data queries to determine if data should be filtered
   */
  isSimulatingRole: (roleName: string) => boolean;

  /**
   * Check if NOT simulating a specific role
   * Useful for queries that should return null when a role is not being simulated
   */
  isNotSimulatingRole: (roleName: string) => boolean;

  // Legacy compatibility - single role mode (returns first active role or 'disabled')
  mockRole: string;
  setMockRole: (role: string) => void;
}

const MockRoleContext = createContext<MockRoleContextValue | null>(null);

const STORAGE_KEY = 'fm-mock-role-state';

/**
 * Migrate old localStorage format (string) to new format (MockRoleState object)
 * Old format: "user" or "disabled" or "unauthenticated"
 * New format: { isUnauthenticated: boolean, roles: string[] }
 */
function migrateStorageValue(storedValue: unknown): MockRoleState {
  // If it's already the correct format, return as-is
  if (
    storedValue &&
    typeof storedValue === 'object' &&
    'roles' in storedValue &&
    Array.isArray((storedValue as MockRoleState).roles)
  ) {
    return storedValue as MockRoleState;
  }

  // Migrate from old string format
  if (typeof storedValue === 'string') {
    if (storedValue === 'disabled' || storedValue === '') {
      return DEFAULT_STATE;
    }
    if (storedValue === MOCK_ROLE_UNAUTHENTICATED) {
      return { isUnauthenticated: true, roles: [] };
    }
    // Old single role format
    const rolesWithDeps = ensureRoleDependencies([storedValue] as Role[]);
    return { isUnauthenticated: false, roles: rolesWithDeps };
  }

  // Unknown format, return default
  return DEFAULT_STATE;
}

/**
 * Custom hook that wraps useLocalStorage with migration support
 */
function useMigratedLocalStorage(
  key: string,
  defaultValue: MockRoleState
): [MockRoleState, (value: MockRoleState | ((prev: MockRoleState) => MockRoleState)) => void] {
  const [rawValue, setRawValue] = useLocalStorage<unknown>(key, defaultValue);

  // Migrate the value on read
  const migratedValue = migrateStorageValue(rawValue);

  // Wrap setter to ensure we always write the correct format - stable callback
  const setValue = useCallback(
    (value: MockRoleState | ((prev: MockRoleState) => MockRoleState)) => {
      if (typeof value === 'function') {
        setRawValue((prev: unknown) => value(migrateStorageValue(prev)));
      } else {
        setRawValue(value);
      }
    },
    [setRawValue]
  );

  return [migratedValue, setValue];
}

interface MockRoleProviderProps {
  children: ReactNode;
}

export const MockRoleProvider = ({ children }: MockRoleProviderProps) => {
  // Applied state (what's actually being simulated) - persisted with migration
  const [appliedState, setAppliedState] = useMigratedLocalStorage(STORAGE_KEY, DEFAULT_STATE);

  // Pending state (what's selected but not yet applied) - also persisted with migration
  const [pendingState, setPendingState] = useMigratedLocalStorage(
    `${STORAGE_KEY}-pending`,
    DEFAULT_STATE
  );

  // Track if we've already shown the production warning
  const hasWarnedRef = useRef(false);

  // SECURITY: Clear mock state in production to prevent accidental privilege escalation
  useEffect(() => {
    if (isProduction()) {
      const hadMockState = appliedState.roles.length > 0 || appliedState.isUnauthenticated;
      const hadPendingState = pendingState.roles.length > 0 || pendingState.isUnauthenticated;

      if ((hadMockState || hadPendingState) && !hasWarnedRef.current) {
        hasWarnedRef.current = true;
        logger.warn('Mock role state detected in production - clearing for security', {
          source: 'MockRoleContext',
          clearedApplied: hadMockState,
          clearedPending: hadPendingState,
        });

        // Clear both applied and pending state
        setAppliedState(DEFAULT_STATE);
        setPendingState(DEFAULT_STATE);

        // Also clear from localStorage directly to ensure it's gone
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(`${STORAGE_KEY}-pending`);
      }
    }
  }, [appliedState, pendingState, setAppliedState, setPendingState]);

  const clearMockRole = useCallback(() => {
    setAppliedState(DEFAULT_STATE);
    setPendingState(DEFAULT_STATE);
  }, [setAppliedState, setPendingState]);

  const togglePendingRole = useCallback((roleName: string) => {
    // SECURITY: Prevent mock role changes in production
    if (isProduction()) {
      logger.warn('Mock role changes blocked in production', {
        source: 'MockRoleContext.togglePendingRole',
        attemptedRole: roleName,
      });
      return;
    }

    // Validate role name before toggling
    if (!isValidRole(roleName)) {
      logger.warn('Attempted to toggle invalid role', {
        roleName,
        source: 'MockRoleContext.togglePendingRole'
      });
      return;
    }

    setPendingState(prev => {
      const currentRoles = new Set(prev.roles);

      if (currentRoles.has(roleName)) {
        // REMOVING a role - also remove roles that depend on it
        const rolesToRemove = getRolesToRemove(prev.roles as Role[], roleName as Role);
        rolesToRemove.forEach(r => currentRoles.delete(r));
      } else {
        // ADDING a role - also add its dependencies
        currentRoles.add(roleName);
        const withDeps = ensureRoleDependencies(Array.from(currentRoles) as Role[]);
        withDeps.forEach(r => currentRoles.add(r));
      }

      return {
        ...prev,
        // If we're adding roles, turn off unauthenticated mode
        isUnauthenticated: currentRoles.size > 0 ? false : prev.isUnauthenticated,
        roles: Array.from(currentRoles),
      };
    });
  }, [setPendingState]);

  const isPendingRoleSelected = useCallback((roleName: string): boolean => {
    return pendingState.roles.includes(roleName);
  }, [pendingState.roles]);

  // Check if a role is selected only because it's a dependency of another selected role
  const isRoleSelectedAsDependency = useCallback((roleName: string): boolean => {
    if (!pendingState.roles.includes(roleName)) return false;

    // Check if any other selected role depends on this one
    for (const selectedRole of pendingState.roles) {
      if (selectedRole === roleName) continue;
      const deps = getRoleDependencies(selectedRole as Role);
      if (deps.includes(roleName as Role)) {
        return true;
      }
    }
    return false;
  }, [pendingState.roles]);

  // Get roles that depend on the given role (would be removed if this one is removed)
  const getRolesDependingOn = useCallback((roleName: string): string[] => {
    const dependents = getDependentRoles(roleName as Role);
    return dependents.filter(r => pendingState.roles.includes(r));
  }, [pendingState.roles]);

  // Get roles that this role requires (its dependencies)
  const getRolesRequiredBy = useCallback((roleName: string): string[] => {
    return getRoleDependencies(roleName as Role);
  }, []);

  const togglePendingUnauthenticated = useCallback(() => {
    // SECURITY: Prevent mock role changes in production
    if (isProduction()) {
      logger.warn('Mock role changes blocked in production', {
        source: 'MockRoleContext.togglePendingUnauthenticated',
      });
      return;
    }

    setPendingState(prev => ({
      // When toggling unauthenticated, clear all roles
      roles: prev.isUnauthenticated ? prev.roles : [],
      isUnauthenticated: !prev.isUnauthenticated,
    }));
  }, [setPendingState]);

  const applySimulation = useCallback(() => {
    // SECURITY: Prevent mock role changes in production
    if (isProduction()) {
      logger.warn('Mock role changes blocked in production', {
        source: 'MockRoleContext.applySimulation',
      });
      return;
    }

    setAppliedState(pendingState);
  }, [pendingState, setAppliedState]);

  const resetPending = useCallback(() => {
    setPendingState(appliedState);
  }, [appliedState, setPendingState]);

  const isMockActive = appliedState.isUnauthenticated || appliedState.roles.length > 0;
  const isUnauthenticated = appliedState.isUnauthenticated;
  const isPendingUnauthenticated = pendingState.isUnauthenticated;

  // Check if pending differs from applied
  const hasPendingChanges = useMemo(() => {
    if (pendingState.isUnauthenticated !== appliedState.isUnauthenticated) return true;
    if (pendingState.roles.length !== appliedState.roles.length) return true;
    const appliedSet = new Set(appliedState.roles);
    return pendingState.roles.some(role => !appliedSet.has(role));
  }, [pendingState, appliedState]);

  const getActiveMockRoles = useCallback((): string[] => {
    return appliedState.roles;
  }, [appliedState.roles]);

  const getMockPermissions = useCallback((): string[] => {
    if (appliedState.isUnauthenticated) return [];
    if (appliedState.roles.length === 0) return [];

    // Early return empty if roles store not loaded yet
    // This prevents race conditions where permissions are checked before roles are loaded
    if (!rolesStore.isLoaded()) {
      return [];
    }

    // Aggregate permissions from all active mock roles
    const allPermissions = new Set<string>();
    appliedState.roles.forEach(roleName => {
      const roleRecord = rolesStore.getRoleByName(roleName);
      if (roleRecord?.permissions) {
        roleRecord.permissions.forEach(perm => allPermissions.add(perm));
      }
    });

    return Array.from(allPermissions);
  }, [appliedState.roles, appliedState.isUnauthenticated]);

  // Check if a specific role is being simulated
  const isSimulatingRole = useCallback((roleName: string): boolean => {
    if (!isMockActive) return false;
    if (appliedState.isUnauthenticated) return false;
    return appliedState.roles.includes(roleName);
  }, [isMockActive, appliedState]);

  // Check if NOT simulating a specific role (when mock is active)
  const isNotSimulatingRole = useCallback((roleName: string): boolean => {
    if (!isMockActive) return false; // Not in mock mode, so not applicable
    if (appliedState.isUnauthenticated) return true; // Unauthenticated has no roles
    return !appliedState.roles.includes(roleName);
  }, [isMockActive, appliedState]);

  // Legacy compatibility: mockRole returns first active role or 'disabled'
  const mockRole = useMemo(() => {
    if (appliedState.isUnauthenticated) return MOCK_ROLE_UNAUTHENTICATED;
    if (appliedState.roles.length > 0) return appliedState.roles[0];
    return 'disabled';
  }, [appliedState]);

  // Legacy compatibility: setMockRole sets a single role (clears others) and applies immediately
  const setMockRole = useCallback((role: string) => {
    // SECURITY: Prevent mock role changes in production (except clearing)
    if (isProduction() && role !== 'disabled') {
      logger.warn('Mock role changes blocked in production', {
        source: 'MockRoleContext.setMockRole',
        attemptedRole: role,
      });
      return;
    }

    if (role === 'disabled') {
      clearMockRole();
    } else if (role === MOCK_ROLE_UNAUTHENTICATED) {
      const newState = { isUnauthenticated: true, roles: [] };
      setAppliedState(newState);
      setPendingState(newState);
    } else {
      // Ensure dependencies when setting a single role
      const rolesWithDeps = ensureRoleDependencies([role] as Role[]);
      const newState = { isUnauthenticated: false, roles: rolesWithDeps };
      setAppliedState(newState);
      setPendingState(newState);
    }
  }, [setAppliedState, setPendingState, clearMockRole]);

  const value = useMemo(() => ({
    appliedState,
    pendingState,
    togglePendingRole,
    isPendingRoleSelected,
    isRoleSelectedAsDependency,
    getRolesDependingOn,
    getRolesRequiredBy,
    togglePendingUnauthenticated,
    applySimulation,
    clearMockRole,
    resetPending,
    isMockActive,
    hasPendingChanges,
    isUnauthenticated,
    isPendingUnauthenticated,
    getActiveMockRoles,
    getMockPermissions,
    isSimulatingRole,
    isNotSimulatingRole,
    // Legacy compatibility
    mockRole,
    setMockRole,
  }), [
    appliedState,
    pendingState,
    togglePendingRole,
    isPendingRoleSelected,
    isRoleSelectedAsDependency,
    getRolesDependingOn,
    getRolesRequiredBy,
    togglePendingUnauthenticated,
    applySimulation,
    clearMockRole,
    resetPending,
    isMockActive,
    hasPendingChanges,
    isUnauthenticated,
    isPendingUnauthenticated,
    getActiveMockRoles,
    getMockPermissions,
    isSimulatingRole,
    isNotSimulatingRole,
    mockRole,
    setMockRole,
  ]);

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
      appliedState: DEFAULT_STATE,
      pendingState: DEFAULT_STATE,
      togglePendingRole: () => {},
      isPendingRoleSelected: () => false,
      isRoleSelectedAsDependency: () => false,
      getRolesDependingOn: () => [],
      getRolesRequiredBy: () => [],
      togglePendingUnauthenticated: () => {},
      applySimulation: () => {},
      clearMockRole: () => {},
      resetPending: () => {},
      isMockActive: false,
      hasPendingChanges: false,
      isUnauthenticated: false,
      isPendingUnauthenticated: false,
      getActiveMockRoles: () => [],
      getMockPermissions: () => [],
      isSimulatingRole: () => false,
      isNotSimulatingRole: () => false,
      // Legacy
      mockRole: 'disabled',
      setMockRole: () => {},
    };
  }

  return context;
};

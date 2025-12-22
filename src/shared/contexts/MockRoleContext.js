import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { rolesStore } from '@/shared/stores/rolesStore';
const MockRoleContext = createContext(null);
const STORAGE_KEY = 'fm-mock-role';
export const MockRoleProvider = ({ children }) => {
    // Initialize from localStorage if available
    const [mockRole, setMockRoleState] = useState(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored === 'disabled') {
                return 'disabled';
            }
            // Validate it's a non-empty string (role name)
            if (stored && typeof stored === 'string' && stored.length > 0) {
                return stored;
            }
        }
        catch {
            // localStorage not available
        }
        return 'disabled';
    });
    const setMockRole = useCallback((role) => {
        setMockRoleState(role);
        try {
            localStorage.setItem(STORAGE_KEY, role);
        }
        catch {
            // localStorage not available
        }
    }, []);
    const clearMockRole = useCallback(() => {
        setMockRole('disabled');
    }, [setMockRole]);
    const isMockActive = mockRole !== 'disabled';
    const getMockPermissions = useCallback(() => {
        if (mockRole === 'disabled')
            return [];
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
    return (_jsx(MockRoleContext.Provider, { value: value, children: children }));
};
export const useMockRole = () => {
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
export const useMockRoleSafe = () => {
    const context = useContext(MockRoleContext);
    // Return no-op defaults if context is not available
    if (!context) {
        return {
            mockRole: 'disabled',
            setMockRole: () => { },
            isMockActive: false,
            clearMockRole: () => { },
            getMockPermissions: () => [],
        };
    }
    return context;
};

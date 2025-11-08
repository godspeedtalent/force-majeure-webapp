import { useState, useEffect } from 'react';
import { rolesStore, type Role } from '@/shared/stores/rolesStore';

/**
 * Hook to access the roles store
 * Automatically subscribes to store updates
 */
export function useRoles() {
  const [roles, setRoles] = useState<Role[]>(rolesStore.getRoles());
  const [loading, setLoading] = useState(rolesStore.isLoading());
  const [loaded, setLoaded] = useState(rolesStore.isLoaded());

  useEffect(() => {
    // Update state when store changes
    const unsubscribe = rolesStore.subscribe(() => {
      setRoles(rolesStore.getRoles());
      setLoading(rolesStore.isLoading());
      setLoaded(rolesStore.isLoaded());
    });

    // Load roles if not already loaded
    if (!rolesStore.isLoaded() && !rolesStore.isLoading()) {
      rolesStore.loadRoles().catch(error => {
        console.error('Failed to load roles:', error);
      });
    }

    return unsubscribe;
  }, []);

  return {
    roles,
    loading,
    loaded,
    getRoleByName: (name: string) => rolesStore.getRoleByName(name),
    getRoleById: (id: string) => rolesStore.getRoleById(id),
    getDisplayName: (roleName: string) => rolesStore.getDisplayName(roleName),
    refresh: () => rolesStore.refresh(),
  };
}

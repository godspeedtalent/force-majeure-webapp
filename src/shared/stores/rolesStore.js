import { supabase } from '@/shared';
import { logger } from '@/shared';
class RolesStore {
    constructor() {
        this.roles = [];
        this.rolesMap = new Map();
        this.loading = false;
        this.loaded = false;
        this.listeners = new Set();
    }
    /**
     * Get all roles from the store
     */
    getRoles() {
        return this.roles;
    }
    /**
     * Get a role by its name
     */
    getRoleByName(name) {
        return this.rolesMap.get(name);
    }
    /**
     * Get a role by its ID
     */
    getRoleById(id) {
        return this.roles.find(role => role.id === id);
    }
    /**
     * Get role display name by role name
     */
    getDisplayName(roleName) {
        return this.rolesMap.get(roleName)?.display_name || roleName;
    }
    /**
     * Check if roles have been loaded
     */
    isLoaded() {
        return this.loaded;
    }
    /**
     * Check if roles are currently loading
     */
    isLoading() {
        return this.loading;
    }
    /**
     * Subscribe to role changes
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }
    /**
     * Notify all listeners of changes
     */
    notify() {
        this.listeners.forEach(listener => listener());
    }
    /**
     * Load roles from database
     */
    async loadRoles() {
        if (this.loading || this.loaded) {
            return;
        }
        this.loading = true;
        try {
            const { data, error } = await supabase
                .from('roles')
                .select('*')
                .order('name');
            if (error) {
                logger.error('Error loading roles:', { error });
                throw error;
            }
            const dbRoles = (data || []);
            this.roles = dbRoles.map(role => ({
                id: role.id,
                name: role.name,
                display_name: role.display_name,
                description: role.description,
                permissions: Array.isArray(role.permissions)
                    ? role.permissions
                    : [],
                is_system_role: !!role.is_system_role,
                created_at: role.created_at ?? '',
                updated_at: role.updated_at ?? '',
            }));
            this.rolesMap = new Map(this.roles.map(role => [role.name, role]));
            this.loaded = true;
            this.notify();
            logger.info('Loaded roles into store', { count: this.roles.length });
        }
        catch (error) {
            logger.error('Failed to load roles:', { error });
            throw error;
        }
        finally {
            this.loading = false;
        }
    }
    /**
     * Refresh roles from database
     */
    async refresh() {
        this.loaded = false;
        await this.loadRoles();
    }
    /**
     * Clear the store
     */
    clear() {
        this.roles = [];
        this.rolesMap.clear();
        this.loaded = false;
        this.notify();
    }
}
// Export singleton instance
export const rolesStore = new RolesStore();

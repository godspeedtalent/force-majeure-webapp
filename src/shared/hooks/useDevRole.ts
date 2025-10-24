import { useAuth } from '@/features/auth/services/AuthContext';
import { useDevTools } from '@/contexts/DevToolsContext';
import { useUserRole } from './useUserRole';

/**
 * Hook that returns the effective role, considering dev overrides
 */
export const useDevRole = () => {
  const { user } = useAuth();
  const { data: dbRole, isLoading } = useUserRole();
  const { devRole, isDevMode } = useDevTools();

  // In dev mode with override, use dev role
  if (isDevMode && devRole) {
    // Map dev roles to actual behavior
    if (devRole === 'unauthenticated') {
      return { role: null, isAuthenticated: false, isLoading: false };
    }
    if (devRole === 'fan') {
      return { role: null, isAuthenticated: true, isLoading: false };
    }
    return { role: devRole, isAuthenticated: true, isLoading: false };
  }

  // Otherwise use real auth state
  return {
    role: dbRole,
    isAuthenticated: !!user,
    isLoading,
  };
};

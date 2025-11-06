import { useAuth } from '@/features/auth/services/AuthContext';
import { useUserRole } from './useUserRole';

/**
 * Hook that returns the user's authentication state and roles
 * (Previously included dev overrides, now just returns actual state)
 */
export const useDevRole = () => {
  const { user } = useAuth();
  const { data: roles, isLoading } = useUserRole();

  // Return real auth state
  return {
    roles,
    isAuthenticated: !!user,
    isLoading,
  };
};

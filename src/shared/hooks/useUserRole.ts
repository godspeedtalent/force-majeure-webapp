import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/services/AuthContext';
import { supabase } from '@/shared/api/supabase/client';

export const useUserRole = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No role found
        throw error;
      }

      return data?.role || null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

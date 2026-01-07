import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared';
import { useAuth } from '@/features/auth/services/AuthContext';
import { logger } from '@/shared';

interface LinkedArtist {
  id: string;
  name: string;
  image_url: string | null;
  bio: string | null;
  genre: string | null;
  created_at: string | null;
}

/**
 * Hook to check if the current user has a linked artist account.
 * Returns the linked artist data if found, null otherwise.
 */
export function useUserLinkedArtist() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['user-linked-artist', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('artists')
        .select('id, name, image_url, bio, genre, created_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        logger.error('Failed to fetch linked artist', { error: error.message, userId: user.id });
        throw error;
      }

      return data as LinkedArtist | null;
    },
    enabled: !!user?.id,
  });

  return {
    linkedArtist: query.data,
    isLoading: query.isLoading,
    hasLinkedArtist: !!query.data,
    error: query.error,
  };
}

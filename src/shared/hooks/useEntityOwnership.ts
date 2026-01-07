import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared';
import { useAuth } from '@/features/auth/services/AuthContext';
import { logger } from '@/shared';
import type { DeletionEntityType } from '@/shared/types/deletionRequests';

interface OwnershipResult {
  isOwner: boolean;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to check if the current user owns or is linked to an entity.
 * Used to determine if a user can request deletion of an entity.
 *
 * - Artists: Checks if artists.user_id matches current user
 * - Organizations: Checks if organizations.owner_id matches current user
 * - Venues: Always returns false (no owner concept for venues)
 */
export function useEntityOwnership(
  entityType: DeletionEntityType,
  entityId: string | undefined
): OwnershipResult {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['entity-ownership', entityType, entityId, user?.id],
    queryFn: async () => {
      if (!user?.id || !entityId) return false;

      try {
        switch (entityType) {
          case 'artist': {
            const { data, error } = await supabase
              .from('artists')
              .select('user_id')
              .eq('id', entityId)
              .maybeSingle();

            if (error) {
              logger.error('Failed to check artist ownership', {
                error: error.message,
                entityId,
                userId: user.id,
              });
              throw error;
            }

            return data?.user_id === user.id;
          }

          case 'organization': {
            const { data, error } = await supabase
              .from('organizations')
              .select('owner_id')
              .eq('id', entityId)
              .maybeSingle();

            if (error) {
              logger.error('Failed to check organization ownership', {
                error: error.message,
                entityId,
                userId: user.id,
              });
              throw error;
            }

            return data?.owner_id === user.id;
          }

          case 'venue':
            // Venues don't have an owner concept in the schema
            return false;

          default:
            return false;
        }
      } catch (error) {
        logger.error('Error checking entity ownership', {
          error: error instanceof Error ? error.message : 'Unknown error',
          entityType,
          entityId,
        });
        throw error;
      }
    },
    enabled: !!user?.id && !!entityId && entityType !== 'venue',
  });

  return {
    isOwner: query.data ?? false,
    isLoading: query.isLoading,
    error: query.error,
  };
}

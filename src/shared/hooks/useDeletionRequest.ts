import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, logger } from '@/shared';
import { useAuth } from '@/features/auth/services/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  getDeletionRequestType,
  type DeletionEntityType,
  type DeletionRequest,
  type DeletionRequestParameters,
} from '@/shared/types/deletionRequests';

interface UseDeletionRequestResult {
  existingRequest: DeletionRequest | null;
  hasPendingRequest: boolean;
  createRequest: (entityName: string) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * Hook to manage deletion requests for entities.
 * Allows users to check for existing requests and create new ones.
 */
export function useDeletionRequest(
  entityType: DeletionEntityType,
  entityId: string | undefined
): UseDeletionRequestResult {
  const { user } = useAuth();
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();

  const requestType = getDeletionRequestType(entityType);

  // Check for existing pending request
  const { data: existingRequest } = useQuery({
    queryKey: ['deletion-request', entityType, entityId, user?.id],
    queryFn: async () => {
      if (!user?.id || !entityId) return null;

      const { data, error } = await supabase
        .from('user_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('request_type', requestType)
        .eq('status', 'pending')
        .maybeSingle();

      if (error) {
        logger.error('Failed to fetch existing deletion request', {
          error: error.message,
          entityType,
          entityId,
          userId: user.id,
        });
        // Don't throw - just return null so user can still create requests
        return null;
      }

      // Check if the request is for this specific entity
      if (data) {
        const params = data.parameters as DeletionRequestParameters | null;
        if (params?.entity_id === entityId) {
          return data as unknown as DeletionRequest;
        }
      }

      return null;
    },
    enabled: !!user?.id && !!entityId,
  });

  // Create deletion request mutation
  const createMutation = useMutation({
    mutationFn: async (entityName: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      if (!entityId) throw new Error('Entity ID is required');

      const parameters: DeletionRequestParameters = {
        entity_id: entityId,
        entity_name: entityName,
        entity_type: entityType,
      };

      const { error } = await supabase.from('user_requests').insert({
        user_id: user.id,
        request_type: requestType,
        status: 'pending',
        parameters,
      });

      if (error) {
        logger.error('Failed to create deletion request', {
          error: error.message,
          entityType,
          entityId,
          userId: user.id,
        });
        throw error;
      }
    },
    onSuccess: () => {
      toast.success(t('deletion.requestSubmitted'));
      queryClient.invalidateQueries({
        queryKey: ['deletion-request', entityType, entityId],
      });
    },
    onError: (error) => {
      logger.error('Deletion request creation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        entityType,
        entityId,
      });
      toast.error(t('deletion.requestFailed'));
    },
  });

  const createRequest = async (entityName: string) => {
    await createMutation.mutateAsync(entityName);
  };

  return {
    existingRequest: existingRequest ?? null,
    hasPendingRequest: !!existingRequest,
    createRequest,
    isSubmitting: createMutation.isPending,
  };
}

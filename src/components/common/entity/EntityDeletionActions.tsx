/**
 * EntityDeletionActions
 *
 * Reusable component for entity deletion functionality.
 * - Admins/Developers: Direct delete with confirmation
 * - Linked Users: Request deletion (goes to admin approval queue)
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, Clock, AlertTriangle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/common/shadcn/button';
import { FmCommonConfirmDialog } from '@/components/common/modals/FmCommonConfirmDialog';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import {
  supabase,
  logger,
  ROLES,
  useEntityOwnership,
  useDeletionRequest,
  type DeletionEntityType,
} from '@/shared';
import { useUserPermissions } from '@/shared/hooks/useUserRole';

interface EntityDeletionActionsProps {
  /** Type of entity */
  entityType: DeletionEntityType;
  /** Entity ID */
  entityId: string;
  /** Entity name for display in dialogs */
  entityName: string;
  /** Callback after successful deletion (for navigation) */
  onDeleted?: () => void;
  /** Whether to show in a compact layout */
  compact?: boolean;
}

/**
 * Component that renders deletion actions for entities.
 *
 * For admins/developers: Shows a direct delete button
 * For linked users: Shows a request deletion button
 */
export function EntityDeletionActions({
  entityType,
  entityId,
  entityName,
  onDeleted,
  compact = false,
}: EntityDeletionActionsProps) {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const { isAdmin, hasAnyRole } = useUserPermissions();

  // Check if user is admin/developer
  const isAdminOrDev = isAdmin() || hasAnyRole(ROLES.DEVELOPER);

  // Check ownership for non-admin users
  const { isOwner, isLoading: ownershipLoading } = useEntityOwnership(
    entityType,
    entityId
  );

  // Deletion request hook for non-admin users
  const {
    hasPendingRequest,
    existingRequest,
    createRequest,
    isSubmitting: isRequestSubmitting,
  } = useDeletionRequest(entityType, entityId);

  // State for dialogs
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);

  // Direct delete mutation (for admins)
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const tableName =
        entityType === 'venue'
          ? 'venues'
          : entityType === 'artist'
            ? 'artists'
            : 'organizations';

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', entityId);

      if (error) {
        logger.error(`Failed to delete ${entityType}`, {
          error: error.message,
          entityType,
          entityId,
        });
        throw error;
      }
    },
    onSuccess: () => {
      toast.success(
        t('deletion.deleteSuccess', {
          entityType: t(`entities.${entityType}`),
        })
      );

      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: [entityType === 'venue' ? 'venues' : entityType === 'artist' ? 'artists' : 'organizations'],
      });
      queryClient.invalidateQueries({
        queryKey: [entityType, entityId],
      });

      onDeleted?.();
    },
    onError: (error) => {
      logger.error(`Delete ${entityType} failed`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        entityType,
        entityId,
      });
      toast.error(
        t('deletion.deleteFailed', {
          entityType: t(`entities.${entityType}`),
        })
      );
    },
  });

  // Handle admin delete
  const handleAdminDelete = async () => {
    await deleteMutation.mutateAsync();
  };

  // Handle request deletion
  const handleRequestDeletion = async () => {
    await createRequest(entityName);
    setShowRequestDialog(false);
  };

  // Format pending request date
  const pendingRequestDate = existingRequest?.created_at
    ? new Date(existingRequest.created_at).toLocaleDateString()
    : null;

  const buttonClass = compact
    ? 'w-full'
    : 'w-full border-white/20 hover:bg-white/10';

  return (
    <div className='space-y-2'>
      {/* Admin/Developer Delete Button */}
      <PermissionGuard role={[ROLES.ADMIN, ROLES.DEVELOPER]}>
        <Button
          variant='destructive'
          className={buttonClass}
          onClick={() => setShowDeleteDialog(true)}
          disabled={deleteMutation.isPending}
        >
          <Trash2 className='h-4 w-4 mr-2' />
          {deleteMutation.isPending
            ? t('buttons.deleting')
            : t('deletion.adminDelete')}
        </Button>

        <FmCommonConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title={t('deletion.confirmDeleteTitle', {
            entityType: t(`entities.${entityType}`),
          })}
          description={t('deletion.confirmDeleteDescription', {
            entityName,
          })}
          confirmText={t('buttons.delete')}
          onConfirm={handleAdminDelete}
          variant='destructive'
          isLoading={deleteMutation.isPending}
        />
      </PermissionGuard>

      {/* Linked User: Request Deletion or Pending Status */}
      {!isAdminOrDev && entityType !== 'venue' && (
        <>
          {ownershipLoading ? (
            <Button variant='outline' className={buttonClass} disabled>
              <Clock className='h-4 w-4 mr-2 animate-spin' />
              {t('buttons.loading')}
            </Button>
          ) : isOwner ? (
            hasPendingRequest ? (
              // Show pending request status
              <div className='p-3 border border-yellow-500/30 bg-yellow-500/10 rounded-none'>
                <div className='flex items-center gap-2 text-yellow-500 mb-1'>
                  <AlertTriangle className='h-4 w-4' />
                  <span className='font-medium text-sm'>
                    {t('deletion.pendingRequest')}
                  </span>
                </div>
                <p className='text-xs text-muted-foreground'>
                  {t('deletion.pendingRequestDescription', {
                    entityType: t(`entities.${entityType}`),
                  })}
                </p>
                {pendingRequestDate && (
                  <p className='text-xs text-muted-foreground mt-1'>
                    {t('labels.submittedOn')}: {pendingRequestDate}
                  </p>
                )}
              </div>
            ) : (
              // Show request deletion button
              <>
                <Button
                  variant='outline'
                  className={`${buttonClass} border-destructive/50 text-destructive hover:bg-destructive/10`}
                  onClick={() => setShowRequestDialog(true)}
                  disabled={isRequestSubmitting}
                >
                  <Trash2 className='h-4 w-4 mr-2' />
                  {isRequestSubmitting
                    ? t('buttons.submitting')
                    : t('deletion.requestDeletion')}
                </Button>

                <FmCommonConfirmDialog
                  open={showRequestDialog}
                  onOpenChange={setShowRequestDialog}
                  title={t('deletion.requestDeletion')}
                  description={t('deletion.requestDeletionDescription', {
                    entityType: t(`entities.${entityType}`),
                  })}
                  confirmText={t('buttons.submitRequest')}
                  onConfirm={handleRequestDeletion}
                  variant='warning'
                  isLoading={isRequestSubmitting}
                />
              </>
            )
          ) : null}
        </>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FmCommonModal } from '@/components/common/modals/FmCommonModal';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonToggle } from '@/components/common/forms/FmCommonToggle';
import { Shield, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { handleError } from '@/shared/services/errorHandler';
import { RoleManagementService } from '@/shared';

interface RoleInfo {
  role_name: string;
  display_name: string;
  permissions: string[];
}

interface AvailableRole {
  role_name: string;
  display_name: string;
  description: string | null;
}

interface RoleManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userEmail: string;
  currentRoles: RoleInfo[] | undefined;
  onRolesUpdated: () => void;
}

/**
 * RoleManagementModal - Modal for managing user roles
 *
 * Features:
 * - View current user roles
 * - Add new roles from available roles
 * - Remove existing roles
 * - Real-time role updates
 */
export function RoleManagementModal({
  open,
  onOpenChange,
  userId,
  userEmail,
  currentRoles,
  onRolesUpdated,
}: RoleManagementModalProps) {
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');
  const [availableRoles, setAvailableRoles] = useState<AvailableRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [togglingRole, setTogglingRole] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchAvailableRoles();
    }
  }, [open]);

  const fetchAvailableRoles = async () => {
    setLoading(true);
    try {
      const roles = await RoleManagementService.getAllRoles();

      // Map to the expected format
      setAvailableRoles(
        roles.map(role => ({
          role_name: role.name,
          display_name: role.name,
          description: null,
        }))
      );
    } catch (error: unknown) {
      handleError(error, {
        title: tToast('admin.rolesLoadFailed'),
        context: 'RoleManagementModal.fetchAvailableRoles',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = async (roleName: string, shouldAdd: boolean) => {
    setTogglingRole(roleName);
    try {
      if (shouldAdd) {
        await RoleManagementService.addRole(userId, roleName);
        toast.success(tToast('admin.roleAdded'), {
          description: tToast('admin.roleAddedDescription', { roleName, userEmail }),
        });
      } else {
        await RoleManagementService.removeRole(userId, roleName);
        toast.success(tToast('admin.roleRemoved'), {
          description: tToast('admin.roleRemovedDescription', { roleName, userEmail }),
        });
      }

      onRolesUpdated();
    } catch (error: unknown) {
      handleError(error, {
        title: shouldAdd ? tToast('admin.roleAddFailed') : tToast('admin.roleRemoveFailed'),
        context: `RoleManagementModal.handleToggleRole(${roleName}, ${shouldAdd})`,
      });
    } finally {
      setTogglingRole(null);
    }
  };

  // Check if user has a specific role
  const hasRole = (roleName: string) => {
    return (currentRoles || []).some(r => r.role_name === roleName);
  };

  return (
    <FmCommonModal
      open={open}
      onOpenChange={onOpenChange}
      title={t('dialogs.manageRoles')}
      description={t('dialogs.manageRolesFor', { email: userEmail })}
      className='sm:max-w-[600px]'
      headerActions={<Shield className='h-5 w-5 text-fm-gold' />}
    >
      <div className='space-y-6 py-4'>
        {/* Available Roles */}
        <div className='space-y-3'>
          <label className='text-base font-medium'>{t('labels.roles')}</label>
          {loading ? (
            <div className='flex items-center gap-2 p-4 border border-dashed bg-muted/50 text-muted-foreground'>
              <AlertCircle className='h-4 w-4' />
              <span className='text-sm'>{t('dialogs.loadingRoles')}</span>
            </div>
          ) : availableRoles.length > 0 ? (
            <div className='space-y-2'>
              {availableRoles.map(role => {
                const userHasRole = hasRole(role.role_name);
                const isToggling = togglingRole === role.role_name;

                return (
                  <FmCommonToggle
                    key={role.role_name}
                    id={`role-${role.role_name}`}
                    label={role.display_name}
                    icon={Shield}
                    checked={userHasRole}
                    onCheckedChange={(checked) => handleToggleRole(role.role_name, checked)}
                    disabled={isToggling}
                  />
                );
              })}
            </div>
          ) : (
            <div className='flex items-center gap-2 p-4 border border-dashed bg-muted/50 text-muted-foreground'>
              <AlertCircle className='h-4 w-4' />
              <span className='text-sm'>{t('dialogs.noRolesAvailable')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className='flex justify-end gap-2 pt-4 border-t'>
        <FmCommonButton
          variant='secondary'
          onClick={() => onOpenChange(false)}
        >
          {t('dialogs.done')}
        </FmCommonButton>
      </div>
    </FmCommonModal>
  );
}

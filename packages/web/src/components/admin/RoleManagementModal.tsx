import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/common/shadcn/dialog';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonToggle } from '@/components/common/forms/FmCommonToggle';
import { Label } from '@/components/common/shadcn/label';
import { Shield, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/shared/services/logger';
import { RoleManagementService } from '@/shared/services/roleManagementService';

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
    } catch (error: any) {
      logger.error('Error fetching available roles:', error);
      toast.error('Failed to load available roles', {
        description: error.message,
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
        toast.success('Role added', {
          description: `Added ${roleName} to ${userEmail}`,
        });
      } else {
        await RoleManagementService.removeRole(userId, roleName);
        toast.success('Role removed', {
          description: `Removed ${roleName} from ${userEmail}`,
        });
      }

      onRolesUpdated();
    } catch (error: any) {
      logger.error('Error toggling role:', error);
      toast.error(`Failed to ${shouldAdd ? 'add' : 'remove'} role`, {
        description: error.message,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Shield className='h-5 w-5 text-fm-gold' />
            Manage Roles
          </DialogTitle>
          <DialogDescription>
            Manage roles for{' '}
            <span className='font-mono font-medium text-foreground'>
              {userEmail}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6 py-4'>
          {/* Available Roles */}
          <div className='space-y-3'>
            <Label className='text-base font-medium'>Roles</Label>
            {loading ? (
              <div className='flex items-center gap-2 p-4 border border-dashed bg-muted/50 text-muted-foreground'>
                <AlertCircle className='h-4 w-4' />
                <span className='text-sm'>Loading roles...</span>
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
                <span className='text-sm'>No roles available</span>
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
            Done
          </FmCommonButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}

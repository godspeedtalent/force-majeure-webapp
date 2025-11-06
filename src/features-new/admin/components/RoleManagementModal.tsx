import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/common/shadcn/dialog';
import { Badge } from '@/components/common/shadcn/badge';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { Label } from '@/components/common/shadcn/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/shadcn/select';
import { Shield, Plus, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ROLES } from '@/shared/auth/permissions';
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
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [removingRole, setRemovingRole] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchAvailableRoles();
    }
  }, [open]);

  const fetchAvailableRoles = async () => {
    try {
      const roles = await RoleManagementService.getAllRoles();
      
      // Map to the expected format
      setAvailableRoles(roles.map(role => ({
        role_name: role.name,
        display_name: role.name, // Using name as display_name since getAllRoles returns { id, name }
        description: null,
      })));
    } catch (error: any) {
      console.error('Error fetching available roles:', error);
      toast.error('Failed to load available roles', {
        description: error.message,
      });
    }
  };

  const handleAddRole = async () => {
    if (!selectedRole) return;

    setLoading(true);
    try {
      console.log('Current roles:', currentRoles);
      console.log('Attempting to add role:', selectedRole);
      
      // Check if user already has this role
      if (currentRoles?.some(r => r.role_name === selectedRole)) {
        toast.warning('User already has this role');
        setLoading(false);
        return;
      }

      await RoleManagementService.addRole(userId, selectedRole);

      toast.success('Role added successfully', {
        description: `Added ${availableRoles.find(r => r.role_name === selectedRole)?.display_name} to ${userEmail}`,
      });

      setSelectedRole('');
      onRolesUpdated();
    } catch (error: any) {
      console.error('Error adding role:', error);
      toast.error('Failed to add role', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRole = async (roleName: string) => {
    setRemovingRole(roleName);
    try {
      await RoleManagementService.removeRole(userId, roleName);

      toast.success('Role removed successfully', {
        description: `Removed ${currentRoles?.find(r => r.role_name === roleName)?.display_name} from ${userEmail}`,
      });

      onRolesUpdated();
    } catch (error: any) {
      console.error('Error removing role:', error);
      toast.error('Failed to remove role', {
        description: error.message,
      });
    } finally {
      setRemovingRole(null);
    }
  };

  // Get roles that can be added (not already assigned)
  const addableRoles = availableRoles.filter(
    role => !(currentRoles || []).some(r => r.role_name === role.role_name)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-fm-gold" />
            Manage Roles
          </DialogTitle>
          <DialogDescription>
            Manage roles for <span className="font-mono font-medium text-foreground">{userEmail}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Roles */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Current Roles</Label>
            {(currentRoles || []).length > 0 ? (
              <div className="space-y-2">
                {(currentRoles || []).map((role) => (
                  <div
                    key={role.role_name}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={role.role_name === ROLES.ADMIN ? 'default' : 'secondary'}
                        className={role.role_name === ROLES.ADMIN ? 'bg-fm-gold text-black hover:bg-fm-gold/90' : ''}
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        {role.display_name}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <FmCommonButton
                      size="sm"
                      variant="secondary"
                      onClick={() => handleRemoveRole(role.role_name)}
                      loading={removingRole === role.role_name}
                      disabled={removingRole !== null}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <X className="h-4 w-4" />
                    </FmCommonButton>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-4 rounded-lg border border-dashed bg-muted/50 text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">User has no roles assigned</span>
              </div>
            )}
          </div>

          {/* Add Role */}
          {addableRoles.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-medium">Add Role</Label>
              <div className="flex gap-2">
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a role to add..." />
                  </SelectTrigger>
                  <SelectContent>
                    {addableRoles.map((role) => (
                      <SelectItem key={role.role_name} value={role.role_name}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{role.display_name}</span>
                          {role.description && (
                            <span className="text-xs text-muted-foreground">
                              {role.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FmCommonButton
                  onClick={handleAddRole}
                  loading={loading}
                  disabled={!selectedRole || loading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </FmCommonButton>
              </div>
            </div>
          )}

          {addableRoles.length === 0 && (currentRoles || []).length > 0 && (
            <div className="flex items-center gap-2 p-4 rounded-lg border bg-muted/50 text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">User has all available roles</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <FmCommonButton
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Done
          </FmCommonButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}

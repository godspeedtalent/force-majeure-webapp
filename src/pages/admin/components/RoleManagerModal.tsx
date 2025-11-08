import { useState, useEffect } from 'react';
import { Shield, X, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/common/shadcn/dialog';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { Checkbox } from '@/components/common/shadcn/checkbox';
import { Label } from '@/components/common/shadcn/label';
import { Separator } from '@/components/common/shadcn/separator';
import { useRoles } from '@/shared/hooks/useRoles';
import { cn } from '@/shared/utils/utils';

interface UserRole {
  role_name: string;
  display_name: string;
  permissions: string[];
}

interface RoleManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
  userName?: string;
  currentRoles: UserRole[];
  onSave: (roleNames: string[]) => Promise<void>;
}

export function RoleManagerModal({
  open,
  onOpenChange,
  userEmail,
  userName,
  currentRoles,
  onSave,
}: RoleManagerModalProps) {
  const { roles, loading: rolesLoading } = useRoles();
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // Initialize selected roles when modal opens
  useEffect(() => {
    if (open) {
      setSelectedRoles(new Set(currentRoles.map(r => r.role_name)));
    }
  }, [open, currentRoles]);

  const hasAdminRole = currentRoles.some(r => r.role_name === 'admin');
  const isAdminSelected = selectedRoles.has('admin');

  const handleToggleRole = (roleName: string) => {
    // Prevent removing admin role
    if (roleName === 'admin' && selectedRoles.has('admin')) {
      return;
    }

    const newSelected = new Set(selectedRoles);
    if (newSelected.has(roleName)) {
      newSelected.delete(roleName);
    } else {
      newSelected.add(roleName);
    }
    setSelectedRoles(newSelected);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(Array.from(selectedRoles));
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save roles:', error);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    selectedRoles.size !== currentRoles.length ||
    !Array.from(selectedRoles).every(role =>
      currentRoles.some(r => r.role_name === role)
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='bg-card border-border rounded-none max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Shield className='h-5 w-5 text-fm-gold' />
            Manage User Roles
          </DialogTitle>
          <DialogDescription>
            Assign roles to {userName || userEmail}
          </DialogDescription>
        </DialogHeader>

        <Separator className='bg-white/10' />

        {/* Current User Info */}
        <div className='space-y-1'>
          <p className='text-sm text-muted-foreground'>Email</p>
          <p className='text-sm font-medium'>{userEmail}</p>
        </div>

        <Separator className='bg-white/10' />

        {/* Admin Protection Warning */}
        {hasAdminRole && (
          <div className='flex items-start gap-2 p-3 rounded-none bg-amber-500/10 border border-amber-500/20'>
            <AlertTriangle className='h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0' />
            <div className='text-xs text-amber-200'>
              <p className='font-medium mb-1'>Admin Role Protection</p>
              <p>
                The admin role cannot be removed from this user. This prevents
                accidental lockout.
              </p>
            </div>
          </div>
        )}

        {/* Roles List */}
        <div className='space-y-2 max-h-[300px] overflow-y-auto'>
          {rolesLoading ? (
            <div className='text-center py-4 text-muted-foreground text-sm'>
              Loading roles...
            </div>
          ) : (
            roles.map(role => {
              const isSelected = selectedRoles.has(role.name);
              const isAdmin = role.name === 'admin';
              const isDisabled = isAdmin && hasAdminRole;

              return (
                <div
                  key={role.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-none border transition-colors',
                    isSelected
                      ? 'bg-fm-gold/10 border-fm-gold/30'
                      : 'bg-muted/30 border-border hover:border-fm-gold/50',
                    isDisabled && 'opacity-60 cursor-not-allowed'
                  )}
                  onClick={() => !isDisabled && handleToggleRole(role.name)}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() =>
                      !isDisabled && handleToggleRole(role.name)
                    }
                    disabled={isDisabled}
                    className='mt-0.5'
                  />
                  <div className='flex-1 space-y-1'>
                    <div className='flex items-center gap-2'>
                      <Label className='font-medium cursor-pointer'>
                        {role.display_name}
                      </Label>
                      {isAdmin && (
                        <Shield className='h-3 w-3 text-fm-gold' />
                      )}
                    </div>
                    {role.description && (
                      <p className='text-xs text-muted-foreground'>
                        {role.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <Separator className='bg-white/10' />

        {/* Actions */}
        <div className='flex gap-2'>
          <FmCommonButton
            variant='default'
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={cn(
              'flex-1',
              hasChanges
                ? 'border-fm-gold text-fm-gold hover:bg-fm-gold hover:text-black'
                : 'border-border text-muted-foreground cursor-not-allowed'
            )}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </FmCommonButton>
          <FmCommonButton
            variant='secondary'
            onClick={() => onOpenChange(false)}
            className='border-border'
          >
            Cancel
          </FmCommonButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}

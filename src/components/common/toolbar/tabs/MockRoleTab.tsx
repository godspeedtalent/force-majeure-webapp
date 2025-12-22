import { useTranslation } from 'react-i18next';
import {
  User,
  UserCog,
  Shield,
  Building2,
  Users,
  Home,
  X,
  AlertTriangle,
  LucideIcon,
  Loader2,
} from 'lucide-react';
import { useMockRole, type MockRoleMode } from '@/shared/contexts/MockRoleContext';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { useRoles } from '@/shared/hooks/useRoles';
import { cn } from '@/shared';
import { Button } from '@/components/common/shadcn/button';
import type { RoleRecord } from '@/shared/stores/rolesStore';

/**
 * Icon mapping for known role types
 * Falls back to User icon for unknown roles
 */
const roleIconMap: Record<string, LucideIcon> = {
  admin: Shield,
  developer: UserCog,
  org_admin: Building2,
  org_staff: Users,
  venue_admin: Home,
  user: User,
};

const getIconForRole = (roleName: string): LucideIcon => {
  return roleIconMap[roleName] || User;
};

export const MockRoleTabContent = () => {
  const { t } = useTranslation('common');
  const { mockRole, setMockRole, isMockActive, clearMockRole } = useMockRole();
  const { actualRoles } = useUserPermissions();
  const { roles: availableRoles, loading: rolesLoading, loaded: rolesLoaded } = useRoles();

  const handleRoleSelect = (roleName: string) => {
    if (roleName === mockRole) {
      clearMockRole();
    } else {
      setMockRole(roleName as MockRoleMode);
    }
  };

  const getPermissionCount = (role: RoleRecord): number => {
    const permissions = role.permissions || [];
    return permissions.includes('*') ? Infinity : permissions.length;
  };

  // Get the display name for the current mock role
  const getMockRoleDisplayName = (): string => {
    if (mockRole === 'disabled') return '';
    const role = availableRoles.find(r => r.name === mockRole);
    return role?.display_name || mockRole;
  };

  return (
    <div className='space-y-6'>
      {/* Active Mock Warning Banner */}
      {isMockActive && (
        <div className='bg-fm-gold/20 border border-fm-gold/50 p-3 flex items-start gap-3'>
          <AlertTriangle className='h-5 w-5 text-fm-gold flex-shrink-0 mt-0.5' />
          <div className='flex-1'>
            <p className='text-sm font-medium text-fm-gold'>
              {t('mockRole.activeWarning')}
            </p>
            <p className='text-xs text-white/70 mt-1'>
              {t('mockRole.activeDescription', {
                role: getMockRoleDisplayName(),
              })}
            </p>
          </div>
          <Button
            variant='ghost'
            size='icon'
            className='h-6 w-6 text-fm-gold hover:bg-fm-gold/20'
            onClick={clearMockRole}
          >
            <X className='h-4 w-4' />
          </Button>
        </div>
      )}

      {/* Description */}
      <div>
        <p className='text-xs text-white/50'>
          {t('mockRole.description')}
        </p>
      </div>

      {/* Current Actual Roles */}
      <div className='bg-white/5 border border-white/10 p-3'>
        <p className='text-xs text-white/50 uppercase tracking-wider mb-2'>
          {t('mockRole.yourActualRoles')}
        </p>
        <div className='flex flex-wrap gap-2'>
          {actualRoles && actualRoles.length > 0 ? (
            actualRoles.map(role => (
              <span
                key={role.role_name}
                className='px-2 py-1 bg-white/10 text-xs text-white/80'
              >
                {role.display_name || role.role_name}
              </span>
            ))
          ) : (
            <span className='text-xs text-white/50 italic'>
              {t('mockRole.noRoles')}
            </span>
          )}
        </div>
      </div>

      {/* Role Selection Grid */}
      <div className='space-y-2'>
        <p className='text-xs text-white/50 uppercase tracking-wider'>
          {t('mockRole.simulateRole')}
        </p>

        {rolesLoading && !rolesLoaded ? (
          <div className='flex items-center justify-center py-8'>
            <Loader2 className='h-6 w-6 text-white/50 animate-spin' />
          </div>
        ) : availableRoles.length === 0 ? (
          <div className='text-center py-8'>
            <p className='text-xs text-white/50'>
              {t('mockRole.noRolesAvailable')}
            </p>
          </div>
        ) : (
          <div className='space-y-2'>
            {availableRoles.map(role => {
              const Icon = getIconForRole(role.name);
              const isSelected = mockRole === role.name;
              const permissionCount = getPermissionCount(role);

              return (
                <button
                  key={role.id}
                  onClick={() => handleRoleSelect(role.name)}
                  className={cn(
                    'w-full flex items-start gap-3 p-3 text-left transition-all duration-200',
                    'border hover:scale-[1.01]',
                    isSelected
                      ? 'bg-fm-gold/20 border-fm-gold/50 shadow-[0_0_12px_rgba(223,186,125,0.2)]'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  )}
                >
                  <div
                    className={cn(
                      'p-2 flex-shrink-0 transition-colors',
                      isSelected ? 'bg-fm-gold/30' : 'bg-white/10'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4',
                        isSelected ? 'text-fm-gold' : 'text-white/70'
                      )}
                    />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center justify-between gap-2'>
                      <span
                        className={cn(
                          'font-medium text-sm',
                          isSelected ? 'text-fm-gold' : 'text-white'
                        )}
                      >
                        {role.display_name}
                      </span>
                      <span className='text-[10px] text-white/40'>
                        {permissionCount === Infinity
                          ? t('mockRole.allPermissions')
                          : t('mockRole.permissionCount', { count: permissionCount })}
                      </span>
                    </div>
                    {role.description && (
                      <p className='text-xs text-white/50 mt-0.5'>{role.description}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Clear Button */}
      {isMockActive && (
        <Button
          variant='outline'
          className='w-full border-white/20 hover:bg-white/10'
          onClick={clearMockRole}
        >
          <X className='h-4 w-4 mr-2' />
          {t('mockRole.clearSimulation')}
        </Button>
      )}
    </div>
  );
};

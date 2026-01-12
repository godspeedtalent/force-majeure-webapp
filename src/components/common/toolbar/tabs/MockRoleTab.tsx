import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  User,
  UserCog,
  Key,
  Building2,
  Users,
  Home,
  X,
  AlertTriangle,
  LucideIcon,
  Loader2,
  ChevronDown,
  ChevronUp,
  UserX,
  Check,
  Eye,
  EyeOff,
  Music,
  Play,
  RotateCcw,
  Link2,
} from 'lucide-react';
import { useMockRole } from '@/shared/contexts/MockRoleContext';
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
  admin: Key,
  developer: UserCog,
  org_admin: Building2,
  org_staff: Users,
  venue_admin: Home,
  artist: Music,
  user: User,
};

const getIconForRole = (roleName: string): LucideIcon => {
  return roleIconMap[roleName] || User;
};

export const MockRoleTabContent = () => {
  const { t } = useTranslation('common');
  const {
    isMockActive,
    isUnauthenticated,
    isPendingUnauthenticated,
    togglePendingRole,
    togglePendingUnauthenticated,
    isPendingRoleSelected,
    isRoleSelectedAsDependency,
    getRolesDependingOn,
    getRolesRequiredBy,
    applySimulation,
    clearMockRole,
    resetPending,
    hasPendingChanges,
    getActiveMockRoles,
    pendingState,
  } = useMockRole();
  const { actualRoles, getMockPermissions } = useUserPermissions();
  const { roles: availableRoles, loading: rolesLoading, loaded: rolesLoaded } = useRoles();
  const [showPermissions, setShowPermissions] = useState(false);

  // Get combined permissions for all APPLIED mock roles
  const activePermissions = useMemo(() => {
    if (!isMockActive) return [];
    if (isUnauthenticated) return [];
    return getMockPermissions();
  }, [isMockActive, isUnauthenticated, getMockPermissions]);

  const activeMockRoles = getActiveMockRoles();

  // Get display names for active (applied) mock roles
  const getActiveMockRoleNames = (): string[] => {
    if (isUnauthenticated) return [t('mockRole.unauthenticated')];
    return activeMockRoles.map(roleName => {
      const role = availableRoles.find(r => r.name === roleName);
      return role?.display_name || roleName;
    });
  };

  const getPermissionCount = (role: RoleRecord): number => {
    const permissions = role.permissions || [];
    return permissions.includes('*') ? Infinity : permissions.length;
  };

  const getPermissions = (role: RoleRecord): string[] => {
    return role.permissions || [];
  };

  // Check if a role is currently applied (being simulated)
  const isRoleApplied = (roleName: string): boolean => {
    return activeMockRoles.includes(roleName);
  };

  // Check if pending has any selections
  const hasPendingSelections = isPendingUnauthenticated || pendingState.roles.length > 0;

  return (
    <div className='space-y-4'>
      {/* Active Mock Warning Banner - Only show when simulation is active */}
      {isMockActive && (
        <div className='bg-fm-gold/20 border border-fm-gold/50 p-3 flex items-start gap-3'>
          <AlertTriangle className='h-5 w-5 text-fm-gold flex-shrink-0 mt-0.5' />
          <div className='flex-1'>
            <p className='text-sm font-medium text-fm-gold'>
              {t('mockRole.activeWarning')}
            </p>
            <p className='text-xs text-white/70 mt-1'>
              {isUnauthenticated
                ? t('mockRole.simulatingUnauthenticated')
                : t('mockRole.simulatingRoles', {
                    roles: getActiveMockRoleNames().join(', '),
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
          {t('mockRole.multiRoleDescription')}
        </p>
      </div>

      {/* Your Real Roles Section */}
      <div className={cn(
        'border p-3 transition-all duration-200',
        isMockActive
          ? 'bg-white/5 border-white/10 opacity-60'
          : 'bg-fm-gold/10 border-fm-gold/30'
      )}>
        <div className='flex items-center justify-between mb-2'>
          <p className='text-xs text-white/50 uppercase tracking-wider flex items-center gap-2'>
            {isMockActive ? (
              <EyeOff className='h-3 w-3' />
            ) : (
              <Eye className='h-3 w-3' />
            )}
            {t('mockRole.yourActualRoles')}
          </p>
          {isMockActive && (
            <span className='text-[10px] text-white/40 bg-white/10 px-1.5 py-0.5'>
              {t('mockRole.paused')}
            </span>
          )}
        </div>
        <div className='flex flex-wrap gap-2'>
          {actualRoles && actualRoles.length > 0 ? (
            actualRoles.map(role => {
              const Icon = getIconForRole(role.role_name);
              return (
                <span
                  key={role.role_name}
                  className={cn(
                    'px-2 py-1 text-xs flex items-center gap-1.5 border',
                    isMockActive
                      ? 'bg-white/5 text-white/50 border-white/10'
                      : 'bg-fm-gold/20 text-fm-gold border-fm-gold/30'
                  )}
                >
                  <Icon className='h-3 w-3' />
                  {role.display_name || role.role_name}
                </span>
              );
            })
          ) : (
            <span className='text-xs text-white/50 italic'>
              {t('mockRole.noRoles')}
            </span>
          )}
        </div>
        {!isMockActive && actualRoles && actualRoles.length > 0 && (
          <div className='mt-2 pt-2 border-t border-white/10'>
            <p className='text-[10px] text-white/40 uppercase tracking-wider mb-1'>
              {t('mockRole.yourPermissions')}
            </p>
            <div className='flex flex-wrap gap-1'>
              {Array.from(new Set(actualRoles.flatMap(r => r.permission_names))).map((perm, idx) => (
                <span
                  key={idx}
                  className={cn(
                    'px-1.5 py-0.5 text-[10px] font-mono border',
                    perm === '*'
                      ? 'bg-fm-gold/30 text-fm-gold border-fm-gold/50'
                      : 'bg-white/10 text-white/60 border-white/20'
                  )}
                >
                  {perm === '*' ? 'ALL (*)' : perm}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Role Selection Section */}
      <div className='space-y-2'>
        <p className='text-xs text-white/50 uppercase tracking-wider'>
          {t('mockRole.toggleRoles')}
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
          <div className='space-y-1.5'>
            {/* Unauthenticated Option - Special case at top */}
            <button
              onClick={togglePendingUnauthenticated}
              className={cn(
                'w-full flex items-center gap-3 p-2.5 text-left transition-all duration-200',
                'border hover:scale-[1.005]',
                isPendingUnauthenticated
                  ? 'bg-fm-gold/20 border-fm-gold/50 shadow-[0_0_12px_rgba(223,186,125,0.2)]'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
              )}
            >
              <div
                className={cn(
                  'w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 transition-all',
                  isPendingUnauthenticated
                    ? 'bg-fm-gold border-fm-gold'
                    : 'border-white/30 hover:border-white/50'
                )}
              >
                {isPendingUnauthenticated && <Check className='h-3 w-3 text-black' />}
              </div>
              <div
                className={cn(
                  'p-1.5 flex-shrink-0 transition-colors',
                  isPendingUnauthenticated ? 'bg-fm-gold/30' : 'bg-white/10'
                )}
              >
                <UserX
                  className={cn(
                    'h-4 w-4',
                    isPendingUnauthenticated ? 'text-fm-gold' : 'text-white/70'
                  )}
                />
              </div>
              <div className='flex-1 min-w-0'>
                <div className='flex items-center justify-between gap-2'>
                  <span
                    className={cn(
                      'font-medium text-sm flex items-center gap-1.5',
                      isPendingUnauthenticated ? 'text-fm-gold' : 'text-white'
                    )}
                  >
                    {t('mockRole.unauthenticated')}
                    {isUnauthenticated && (
                      <span className='text-[9px] text-green-400 bg-green-400/20 px-1 py-0.5'>
                        {t('mockRole.active')}
                      </span>
                    )}
                  </span>
                  <span className='text-[10px] text-white/40'>
                    {t('mockRole.permissionCount', { count: 0 })}
                  </span>
                </div>
                <p className='text-[10px] text-white/50 mt-0.5'>
                  {t('mockRole.unauthenticatedDescription')}
                </p>
              </div>
            </button>

            {/* Divider */}
            <div className='border-t border-white/10 my-2' />

            {/* Database Roles - Toggleable */}
            {availableRoles.map(role => {
              const Icon = getIconForRole(role.name);
              const isSelected = isPendingRoleSelected(role.name);
              const isApplied = isRoleApplied(role.name);
              const permissionCount = getPermissionCount(role);
              const permissions = getPermissions(role);
              const hasPermissionsToShow = permissions.length > 0;

              // Check if this is one of the user's real roles
              const isRealRole = actualRoles?.some(r => r.role_name === role.name);

              // Role dependency information
              const isDependency = isRoleSelectedAsDependency(role.name);
              const dependentRoles = getRolesDependingOn(role.name);
              const requiredRoles = getRolesRequiredBy(role.name);

              // Get display names for dependent roles (roles that require this one)
              const dependentRoleNames = dependentRoles.map(rName => {
                const r = availableRoles.find(ar => ar.name === rName);
                return r?.display_name || rName;
              });

              // Get display names for required roles (roles this one needs)
              const requiredRoleNames = requiredRoles.map(rName => {
                const r = availableRoles.find(ar => ar.name === rName);
                return r?.display_name || rName;
              });

              return (
                <button
                  key={role.id}
                  onClick={() => togglePendingRole(role.name)}
                  disabled={isPendingUnauthenticated}
                  className={cn(
                    'w-full flex items-center gap-3 p-2.5 text-left transition-all duration-200',
                    'border hover:scale-[1.005]',
                    isPendingUnauthenticated && 'opacity-40 cursor-not-allowed',
                    isSelected
                      ? isDependency
                        ? 'bg-fm-gold/10 border-fm-gold/30 shadow-[0_0_8px_rgba(223,186,125,0.1)]'
                        : 'bg-fm-gold/20 border-fm-gold/50 shadow-[0_0_12px_rgba(223,186,125,0.2)]'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  )}
                >
                  {/* Checkbox - shows link icon if selected as dependency */}
                  <div
                    className={cn(
                      'w-5 h-5 border-2 flex items-center justify-center flex-shrink-0 transition-all',
                      isSelected
                        ? isDependency
                          ? 'bg-fm-gold/50 border-fm-gold/70'
                          : 'bg-fm-gold border-fm-gold'
                        : 'border-white/30 hover:border-white/50'
                    )}
                  >
                    {isSelected && (
                      isDependency
                        ? <Link2 className='h-3 w-3 text-black/70' />
                        : <Check className='h-3 w-3 text-black' />
                    )}
                  </div>

                  {/* Icon */}
                  <div
                    className={cn(
                      'p-1.5 flex-shrink-0 transition-colors',
                      isSelected
                        ? isDependency ? 'bg-fm-gold/20' : 'bg-fm-gold/30'
                        : 'bg-white/10'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4',
                        isSelected
                          ? isDependency ? 'text-fm-gold/70' : 'text-fm-gold'
                          : 'text-white/70'
                      )}
                    />
                  </div>

                  {/* Content */}
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center justify-between gap-2'>
                      <span
                        className={cn(
                          'font-medium text-sm flex items-center gap-1.5 flex-wrap',
                          isSelected
                            ? isDependency ? 'text-fm-gold/70' : 'text-fm-gold'
                            : 'text-white'
                        )}
                      >
                        {role.display_name}
                        {isRealRole && (
                          <span className='text-[9px] text-white/40 bg-white/10 px-1 py-0.5'>
                            {t('mockRole.yourRole')}
                          </span>
                        )}
                        {isApplied && (
                          <span className='text-[9px] text-green-400 bg-green-400/20 px-1 py-0.5'>
                            {t('mockRole.active')}
                          </span>
                        )}
                        {isDependency && dependentRoleNames.length > 0 && (
                          <span className='text-[9px] text-blue-400 bg-blue-400/20 px-1 py-0.5'>
                            {t('mockRole.requiredBy', { roles: dependentRoleNames.join(', ') })}
                          </span>
                        )}
                      </span>
                      {hasPermissionsToShow && (
                        <span className='text-[10px] text-white/40'>
                          {permissionCount === Infinity
                            ? t('mockRole.allPermissions')
                            : t('mockRole.permissionCount', { count: permissionCount })}
                        </span>
                      )}
                    </div>
                    {/* Show dependency info or description */}
                    {requiredRoleNames.length > 0 ? (
                      <p className='text-[10px] text-white/50 mt-0.5 flex items-center gap-1'>
                        <Link2 className='h-2.5 w-2.5' />
                        {t('mockRole.requires', { roles: requiredRoleNames.join(', ') })}
                      </p>
                    ) : role.description ? (
                      <p className='text-[10px] text-white/50 mt-0.5 line-clamp-1'>
                        {role.description}
                      </p>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending Selection Preview */}
      {hasPendingSelections && (
        <div className={cn(
          'border p-3 transition-all duration-200',
          hasPendingChanges
            ? 'bg-blue-500/10 border-blue-500/30'
            : 'bg-white/5 border-white/10'
        )}>
          <p className='text-xs text-white/50 uppercase tracking-wider mb-2'>
            {hasPendingChanges ? t('mockRole.pendingSelection') : t('mockRole.currentSelection')}
          </p>
          <div className='flex flex-wrap gap-1.5'>
            {isPendingUnauthenticated ? (
              <span className='px-2 py-1 text-xs bg-fm-gold/20 text-fm-gold border border-fm-gold/30 flex items-center gap-1.5'>
                <UserX className='h-3 w-3' />
                {t('mockRole.unauthenticated')}
              </span>
            ) : (
              pendingState.roles.map(roleName => {
                const role = availableRoles.find(r => r.name === roleName);
                const Icon = getIconForRole(roleName);
                return (
                  <span
                    key={roleName}
                    className='px-2 py-1 text-xs bg-fm-gold/20 text-fm-gold border border-fm-gold/30 flex items-center gap-1.5'
                  >
                    <Icon className='h-3 w-3' />
                    {role?.display_name || roleName}
                  </span>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className='flex gap-2'>
        {/* Apply Button - Primary action */}
        <Button
          variant='outline'
          className={cn(
            'flex-1 transition-all duration-200',
            hasPendingChanges && hasPendingSelections
              ? 'border-fm-gold bg-fm-gold/20 text-fm-gold hover:bg-fm-gold/30'
              : 'border-white/20 hover:bg-white/10',
            !hasPendingSelections && 'opacity-50 cursor-not-allowed'
          )}
          onClick={applySimulation}
          disabled={!hasPendingSelections}
        >
          <Play className='h-4 w-4 mr-2' />
          {hasPendingChanges ? t('mockRole.applyChanges') : t('mockRole.applySimulation')}
        </Button>

        {/* Reset Button - Only show when there are pending changes */}
        {hasPendingChanges && (
          <Button
            variant='outline'
            className='border-white/20 hover:bg-white/10'
            onClick={resetPending}
          >
            <RotateCcw className='h-4 w-4' />
          </Button>
        )}
      </div>

      {/* Active Permissions Section - Only show when simulation is active */}
      {isMockActive && !isUnauthenticated && activePermissions.length > 0 && (
        <div className='bg-fm-gold/10 border border-fm-gold/30 p-3'>
          <button
            onClick={() => setShowPermissions(!showPermissions)}
            className='w-full flex items-center justify-between text-xs text-fm-gold uppercase tracking-wider'
          >
            <span className='flex items-center gap-2'>
              <Key className='h-3 w-3' />
              {t('mockRole.combinedPermissions')}
              <span className='text-white/60 normal-case'>
                ({activePermissions.includes('*') ? t('mockRole.allPermissions') : activePermissions.length})
              </span>
            </span>
            {showPermissions ? (
              <ChevronUp className='h-4 w-4' />
            ) : (
              <ChevronDown className='h-4 w-4' />
            )}
          </button>

          {showPermissions && (
            <div className='mt-2 pt-2 border-t border-fm-gold/20'>
              <div className='flex flex-wrap gap-1.5'>
                {activePermissions.map((permission, idx) => (
                  <span
                    key={idx}
                    className={cn(
                      'px-2 py-0.5 text-[10px] font-mono border',
                      permission === '*'
                        ? 'bg-fm-gold/30 text-fm-gold border-fm-gold/50'
                        : 'bg-fm-gold/20 text-fm-gold/80 border-fm-gold/30'
                    )}
                  >
                    {permission === '*' ? 'ALL (*)' : permission}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Clear Button - Only show when simulation is active */}
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

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase, logger, RoleManagementService } from '@/shared';
import { FmConfigurableDataGrid, DataGridColumn, DataGridAction } from '@/features/data-grid';
import { FmCommonCheckbox } from '@/components/common/forms/FmCommonCheckbox';
import { FmSectionHeader } from '@/components/common/display/FmSectionHeader';
import { UserCog, User } from 'lucide-react';
import { toast } from 'sonner';

interface UserRole {
  role_name: string;
  display_name: string;
  permissions: string[];
}

interface AdminUser {
  id: string;
  email: string;
  display_name?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  organization_id?: string | null;
  organization_name?: string | null;
  roles?: UserRole[];
  created_at?: string;
  updated_at?: string;
  is_verified?: boolean;
}

/**
 * UserRoleMatrixTab - Grid view for managing user roles
 *
 * Features:
 * - View all users with their roles in a matrix format
 * - Checkbox per user/role intersection for quick toggle
 * - Filter by user name or role
 * - Real-time role updates
 */
export function UserRoleMatrixTab() {
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [togglingRole, setTogglingRole] = useState<string | null>(null);

  // Fetch all users with their roles
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users-role-matrix'],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(
        `https://orgxcrnnecblhuxjfruy.supabase.co/functions/v1/get-users`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }

      const { users } = await response.json();
      logger.info('Fetched users for role matrix', { count: users?.length || 0 });
      return users || [];
    },
  });

  // Fetch all available roles
  const { data: availableRoles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['all-roles'],
    queryFn: async () => {
      const roles = await RoleManagementService.getAllRoles();
      logger.info('Fetched available roles', { count: roles.length });
      return roles;
    },
  });

  // Toggle role for a user
  const handleToggleRole = useCallback(
    async (userId: string, roleName: string, userEmail: string, shouldAdd: boolean) => {
      const toggleKey = `${userId}-${roleName}`;
      setTogglingRole(toggleKey);

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

        // Invalidate queries to refresh the grid
        queryClient.invalidateQueries({ queryKey: ['admin-users-role-matrix'] });
      } catch (error) {
        logger.error('Failed to toggle role', {
          error: error instanceof Error ? error.message : 'Unknown error',
          source: 'UserRoleMatrixTab.handleToggleRole',
          userId,
          roleName,
          shouldAdd,
        });
        toast.error(
          shouldAdd ? tToast('admin.roleAddFailed') : tToast('admin.roleRemoveFailed')
        );
      } finally {
        setTogglingRole(null);
      }
    },
    [queryClient, tToast]
  );

  // Check if user has a specific role
  const userHasRole = useCallback((user: AdminUser, roleName: string): boolean => {
    return (user.roles || []).some((r) => r.role_name === roleName);
  }, []);

  // Add computed role boolean properties to users for sorting
  const usersWithRoleFlags = useMemo(() => {
    return users.map((user: AdminUser) => {
      const userWithFlags: Record<string, unknown> = { ...user };
      availableRoles.forEach((role) => {
        userWithFlags[`role_${role.name}`] = userHasRole(user, role.name);
      });
      return userWithFlags as AdminUser & Record<string, boolean>;
    });
  }, [users, availableRoles, userHasRole]);

  // Build columns dynamically based on available roles
  const columns: DataGridColumn[] = useMemo(() => {
    const baseColumns: DataGridColumn[] = [
      {
        key: 'full_name',
        label: 'Full Name',
        type: 'text',
        width: '200px',
      },
      {
        key: 'display_name',
        label: 'Username',
        type: 'text',
        width: '180px',
      },
    ];

    // Add a column for each role
    const roleColumns: DataGridColumn[] = availableRoles.map((role) => ({
      key: `role_${role.name}`,
      label: role.name.charAt(0).toUpperCase() + role.name.slice(1),
      width: '120px',
      editable: false,
      sortable: true,
      render: (_value: unknown, row: AdminUser) => {
        const hasRole = userHasRole(row, role.name);
        const toggleKey = `${row.id}-${role.name}`;
        const isToggling = togglingRole === toggleKey;

        return (
          <div className="flex justify-center items-center">
            <FmCommonCheckbox
              id={`${row.id}-${role.name}`}
              checked={hasRole}
              onCheckedChange={(checked) => handleToggleRole(row.id, role.name, row.email, checked)}
              loading={isToggling}
            />
          </div>
        );
      },
    }));

    return [...baseColumns, ...roleColumns];
  }, [availableRoles, t, userHasRole, togglingRole, handleToggleRole]);

  const isLoading = usersLoading || rolesLoading;

  // Context menu actions for user rows
  const contextMenuActions: DataGridAction<AdminUser>[] = [
    {
      label: t('contextMenu.viewProfile'),
      icon: <User className="h-4 w-4" />,
      onClick: (user: AdminUser) => navigate(`/admin/users/${user.id}`),
    },
  ];

  return (
    <div className="space-y-6">
      <FmSectionHeader
        title="User Role Matrix"
        description="Quickly manage user roles with checkboxes. Filter by user name or role."
        icon={UserCog}
      />

      <FmConfigurableDataGrid
        gridId="user-role-matrix"
        data={usersWithRoleFlags}
        columns={columns}
        contextMenuActions={contextMenuActions}
        loading={isLoading}
        pageSize={20}
        resourceName="User"
      />
    </div>
  );
}
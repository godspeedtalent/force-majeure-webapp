import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase, logger, useDeleteConfirmation } from '@/shared';
import { FmConfigurableDataGrid, DataGridAction, DataGridColumn } from '@/features/data-grid';
import { FmCommonConfirmDialog } from '@/components/common/modals/FmCommonConfirmDialog';
import { RoleManagementModal } from '@/components/admin/RoleManagementModal';
import { FmSectionHeader } from '@/components/common/display/FmSectionHeader';
import { userColumns } from './config/adminGridColumns';
import { BadgeListCell } from '@/features/data-grid/components/cells';
import { Trash2, User, UserCog } from 'lucide-react';
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

export const UserManagement = () => {
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Role management modal state
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

  const handleOpenRoleModal = useCallback((user: AdminUser) => {
    setSelectedUser(user);
    setRoleModalOpen(true);
  }, []);

  const handleRolesUpdated = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  }, [queryClient]);

  // Delete confirmation with custom auth deletion handler
  const {
    showConfirm: showDeleteConfirm,
    itemsToDelete,
    isDeleting,
    openConfirm: handleDeleteUserClick,
    confirmDelete: handleDeleteUser,
    setShowConfirm: setShowDeleteConfirm,
  } = useDeleteConfirmation<AdminUser>({
    table: 'profiles', // Not used since we have custom onDelete
    queryKey: ['admin-users'],
    messages: {
      successSingle: tToast('admin.userDeleted'),
      error: tToast('admin.userDeleteFailed'),
    },
    onDelete: async (users: AdminUser[]) => {
      // Get current session for auth token
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;

      if (!token) {
        throw new Error('No authentication token available');
      }

      // Users require special auth deletion via edge function
      for (const user of users) {
        const response = await fetch(
          `https://orgxcrnnecblhuxjfruy.supabase.co/functions/v1/delete-user`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: user.id }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          logger.error('Auth deletion error:', { error: errorData.error, source: 'UserManagement' });
          throw new Error(tToast('admin.userAuthDeleteFailed'));
        }
      }
      // Profile will be deleted via CASCADE
    },
    source: 'UserManagement',
  });

  const userToDelete = itemsToDelete[0] ?? null;

  // Fetch users with their auth email
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      // Use Supabase Edge Function to get all users (requires admin role)
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
      logger.info('Fetched users from database', { count: users?.length || 0 });
      return users || [];
    },
  });

  // Sync selectedUser with updated users data when roles change
  useEffect(() => {
    if (selectedUser && roleModalOpen && users.length > 0) {
      const updatedUser = users.find((u: AdminUser) => u.id === selectedUser.id);
      if (updatedUser) {
        setSelectedUser(updatedUser);
      }
    }
  }, [users, selectedUser?.id, roleModalOpen]);

  const handleUserUpdate = async (
    row: AdminUser,
    columnKey: string,
    newValue: string | number | boolean | null
  ) => {
    // Debug logging
    logger.info('handleUserUpdate called', {
      userId: row.id,
      columnKey,
      newValue,
      source: 'UserManagement',
    });

    const normalizedValue =
      typeof newValue === 'string' ? newValue.trim() : newValue;
    const updateData: Record<string, string | number | boolean | null> = {
      [columnKey]: normalizedValue === '' ? null : normalizedValue,
    };

    try {
      // Email updates go to auth.users via admin API
      if (columnKey === 'email') {
        const { error } = await supabase.auth.admin.updateUserById(row.id, {
          email: normalizedValue as string,
        });
        if (error) throw error;
      } else {
        // Other fields update profiles table
        logger.info('Updating profiles table', {
          updateData,
          userId: row.id,
          source: 'UserManagement',
        });
        const { error, count } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('user_id', row.id);

        logger.info('Profile update result', { error, count, source: 'UserManagement' });
        if (error) throw error;
      }

      // For relation fields like organization_id, we need to refetch to get the display name
      // For other fields, optimistic update is fine
      if (columnKey === 'organization_id') {
        // Invalidate to refetch with the organization name
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      } else {
        // Optimistic update for simple fields
        queryClient.setQueryData<AdminUser[]>(
          ['admin-users'],
          (oldData) => {
            if (!oldData) return oldData;
            return oldData.map(user =>
              user.id === row.id
                ? { ...user, ...updateData, updated_at: new Date().toISOString() }
                : user
            );
          }
        );
      }

      toast.success(tToast('admin.userUpdated'));
    } catch (error) {
      logger.error('Error updating user:', { error: error instanceof Error ? error.message : 'Unknown error', source: 'UserManagement.tsx' });
      toast.error(tToast('admin.userUpdateFailed'));
      throw error;
    }
  };


  const userContextActions: DataGridAction[] = [
    {
      label: t('contextMenu.viewProfile'),
      icon: <User className='h-4 w-4' />,
      onClick: (user: AdminUser) => navigate(`/admin/users/${user.id}`),
    },
    {
      label: t('dataGrid.actions.manageRoles'),
      icon: <UserCog className='h-4 w-4' />,
      onClick: (user: AdminUser) => handleOpenRoleModal(user),
    },
    {
      label: t('dialogs.deleteUser'),
      icon: <Trash2 className='h-4 w-4' />,
      onClick: handleDeleteUserClick,
      variant: 'destructive',
    },
  ];

  // Create columns with clickable roles column
  const userColumnsWithHandlers: DataGridColumn[] = useMemo(() =>
    userColumns.map(col => {
      if (col.key === 'roles') {
        return {
          ...col,
          render: (value: UserRole[], row: AdminUser) => (
            <div
              className='cursor-pointer hover:opacity-80 transition-opacity'
              onClick={(e) => {
                e.stopPropagation();
                handleOpenRoleModal(row);
              }}
              title={t('dataGrid.placeholders.clickToManageRoles')}
            >
              {!value || !Array.isArray(value) || value.length === 0 ? (
                <BadgeListCell items={[]} emptyText={t('adminGrid.columns.noRoles')} />
              ) : (
                <BadgeListCell
                  items={value.map((role: UserRole) => role.display_name || role.role_name)}
                  variant='gold'
                />
              )}
            </div>
          ),
        };
      }
      return col;
    }),
  [t, handleOpenRoleModal]);

  return (
    <div className='space-y-6'>
      <FmSectionHeader
        title={t('pageTitles.usersManagement')}
        description={t('pageTitles.usersManagementDescription')}
        icon={User}
      />

      <FmConfigurableDataGrid
        gridId='admin-users'
        data={users}
        columns={userColumnsWithHandlers}
        contextMenuActions={userContextActions}
        loading={isLoading}
        pageSize={15}
        onUpdate={handleUserUpdate}
        resourceName='User'
      />

      <FmCommonConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t('dialogs.deleteUser')}
        description={t('dialogs.deleteUserConfirm', {
          userName: userToDelete?.display_name || userToDelete?.full_name || 'this user'
        })}
        confirmText={t('buttons.delete')}
        onConfirm={handleDeleteUser}
        variant="destructive"
        isLoading={isDeleting}
      />

      {selectedUser && (
        <RoleManagementModal
          open={roleModalOpen}
          onOpenChange={setRoleModalOpen}
          userId={selectedUser.id}
          userEmail={selectedUser.email}
          currentRoles={selectedUser.roles}
          onRolesUpdated={handleRolesUpdated}
        />
      )}
    </div>
  );
};

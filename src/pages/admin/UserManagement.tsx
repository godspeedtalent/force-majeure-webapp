import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase, logger, useDeleteConfirmation } from '@/shared';
import { FmConfigurableDataGrid, DataGridAction } from '@/features/data-grid';
import { FmCommonConfirmDialog } from '@/components/common/modals/FmCommonConfirmDialog';
import { userColumns } from './config/adminGridColumns';
import { Trash2, User } from 'lucide-react';
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
  roles?: UserRole[];
  created_at?: string;
  updated_at?: string;
}

export const UserManagement = () => {
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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

  const handleUserUpdate = async (
    row: AdminUser,
    columnKey: string,
    newValue: string | number | boolean | null
  ) => {
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
        const { error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('user_id', row.id);

        if (error) throw error;
      }

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
      label: t('dialogs.deleteUser'),
      icon: <Trash2 className='h-4 w-4' />,
      onClick: handleDeleteUserClick,
      variant: 'destructive',
    },
  ];

  // Pass onRoleClick to column render context
  const userColumnsWithHandlers = userColumns.map(col => {
    if (col.key === 'roles' && col.render) {
      return {
        ...col,
        render: (value: UserRole[], row: AdminUser) =>
          col.render!(value, row),
      };
    }
    return col;
  });

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-canela font-bold text-foreground mb-2'>
          {t('pageTitles.usersManagement')}
        </h1>
        <p className='text-muted-foreground'>
          {t('pageTitles.usersManagementDescription')}
        </p>
      </div>

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
    </div>
  );
};

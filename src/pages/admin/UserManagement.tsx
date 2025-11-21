import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase/client';
import { FmConfigurableDataGrid, DataGridAction } from '@/features/data-grid';
import { userColumns } from './config/adminGridColumns';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { RoleManagementModal } from '@/components/admin/RoleManagementModal';
import { logger } from '@/shared/services/logger';

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
  const queryClient = useQueryClient();
  const [roleModalOpen, setRoleModalOpen] = useState(false);

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
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-users`,
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
      console.log(`Fetched ${users?.length || 0} users from database`);
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

      toast.success('User updated');
    } catch (error) {
      logger.error('Error updating user:', { error: error instanceof Error ? error.message : 'Unknown error', source: 'UserManagement.tsx' });
      toast.error('Failed to update user');
      throw error;
    }
  };

  const handleRolesUpdated = () => {
    // Refresh users to get updated roles
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (
      !confirm(
        `Are you sure you want to delete user "${user.display_name || user.full_name || 'this user'}"? This will also delete their auth account.`
      )
    ) {
      return;
    }

    try {
      // Delete from auth
      const { error: authError } = await supabase.auth.admin.deleteUser(
        user.id
      );
      if (authError) {
        logger.error('Auth deletion error:', authError);
        toast.error('Failed to delete user auth account');
        return;
      }

      // Profile will be deleted via CASCADE
      toast.success('User deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (error) {
      logger.error('Error deleting user:', { error: error instanceof Error ? error.message : 'Unknown error', source: 'UserManagement.tsx' });
      toast.error('Failed to delete user');
    }
  };

  const userContextActions: DataGridAction[] = [
    {
      label: 'Delete User',
      icon: <Trash2 className='h-4 w-4' />,
      onClick: handleDeleteUser,
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
          Users Management
        </h1>
        <p className='text-muted-foreground'>
          Manage user accounts, roles, and permissions.
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
    </div>
  );
};

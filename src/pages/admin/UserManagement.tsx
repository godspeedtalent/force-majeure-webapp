import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase/client';
import { FmConfigurableDataGrid, DataGridAction } from '@/features/data-grid';
import { userColumns } from './config/adminGridColumns';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
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
        const emailValue = typeof normalizedValue === 'string' ? normalizedValue : String(normalizedValue ?? '');
        const { error } = await supabase.auth.admin.updateUserById(row.id, {
          email: emailValue,
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
      logger.error('Error updating user', {
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'UserManagement',
      });
      toast.error('Failed to update user');
      throw error;
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
        columns={userColumns}
        contextMenuActions={userContextActions}
        loading={isLoading}
        pageSize={15}
        onUpdate={handleUserUpdate}
        resourceName='User'
      />
    </div>
  );
};

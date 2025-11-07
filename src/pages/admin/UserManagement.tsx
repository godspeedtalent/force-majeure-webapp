import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase/client';
import { FmConfigurableDataGrid, DataGridAction } from '@/features/data-grid';
import { userColumns } from './config/adminGridColumns';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export const UserManagement = () => {
  const queryClient = useQueryClient();

  // Fetch users with their auth email
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      // First get profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Then get auth users to get email
      const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.warn('Could not fetch auth users:', authError);
        // Return profiles without email if auth fetch fails
        return profiles.map(p => ({ ...p, email: 'N/A', roles: [] }));
      }

      // Fetch roles for all users
      const usersWithRoles = await Promise.all(profiles.map(async (profile) => {
        const authUser = authUsers?.find(u => u.id === profile.id);
        
        // Fetch user roles
        const { data: userRoles, error: rolesError } = await (supabase as any).rpc('get_user_roles', {
          user_id_param: profile.id
        });

        return {
          ...profile,
          email: authUser?.email || 'N/A',
          roles: rolesError ? [] : (userRoles || []),
        };
      }));

      return usersWithRoles;
    },
  });

  const handleUserUpdate = async (row: any, columnKey: string, newValue: any) => {
    const normalizedValue = typeof newValue === 'string' ? newValue.trim() : newValue;
    const updateData: Record<string, any> = {
      [columnKey]: normalizedValue === '' ? null : normalizedValue,
    };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', row.id);

      if (error) throw error;

      queryClient.setQueryData(['admin-users'], (oldData: any[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(user =>
          user.id === row.id
            ? { ...user, ...updateData, updated_at: new Date().toISOString() }
            : user
        );
      });

      toast.success('User updated');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
      throw error;
    }
  };

  const handleDeleteUser = async (user: any) => {
    if (!confirm(`Are you sure you want to delete user "${user.display_name || user.full_name || 'this user'}"? This will also delete their auth account.`)) {
      return;
    }

    try {
      // Delete from auth
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
      if (authError) {
        console.error('Auth deletion error:', authError);
        toast.error('Failed to delete user auth account');
        return;
      }

      // Profile will be deleted via CASCADE
      toast.success('User deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const userContextActions: DataGridAction[] = [
    {
      label: 'Delete User',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: handleDeleteUser,
      variant: 'destructive',
    },
  ];

  return (
    <FmConfigurableDataGrid
      gridId="admin-users"
      data={users}
      columns={userColumns}
      contextMenuActions={userContextActions}
      loading={isLoading}
      pageSize={15}
      onUpdate={handleUserUpdate}
      resourceName="User"
    />
  );
};

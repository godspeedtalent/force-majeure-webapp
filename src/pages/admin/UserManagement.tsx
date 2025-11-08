import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabase/client';
import { FmConfigurableDataGrid, DataGridAction } from '@/features/data-grid';
import { userColumns } from './config/adminGridColumns';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { RoleManagerModal } from './components/RoleManagerModal';
import { rolesStore } from '@/shared/stores/rolesStore';

export const UserManagement = () => {
  const queryClient = useQueryClient();
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

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
    row: any,
    columnKey: string,
    newValue: any
  ) => {
    const normalizedValue =
      typeof newValue === 'string' ? newValue.trim() : newValue;
    const updateData: Record<string, any> = {
      [columnKey]: normalizedValue === '' ? null : normalizedValue,
    };

    try {
      // Email updates go to auth.users via admin API
      if (columnKey === 'email') {
        const { error } = await supabase.auth.admin.updateUserById(row.id, {
          email: normalizedValue,
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

      queryClient.setQueryData(
        ['admin-users'],
        (oldData: any[] | undefined) => {
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
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
      throw error;
    }
  };

  const handleOpenRoleModal = (user: any) => {
    setSelectedUser(user);
    setRoleModalOpen(true);
  };

  const handleSaveRoles = async (roleNames: string[]) => {
    if (!selectedUser) return;

    try {
      // Get role IDs from role names
      const roleIds = roleNames
        .map(name => rolesStore.getRoleByName(name)?.id)
        .filter((id): id is string => id !== undefined);

      // First, delete all existing roles for this user
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUser.id);

      if (deleteError) throw deleteError;

      // Then insert the new roles
      if (roleIds.length > 0) {
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert(
            roleIds.map(roleId => ({
              user_id: selectedUser.id,
              role_id: roleId,
            }))
          );

        if (insertError) throw insertError;
      }

      // Refresh users to get updated roles
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User roles updated');
    } catch (error) {
      console.error('Error updating user roles:', error);
      toast.error('Failed to update user roles');
      throw error;
    }
  };

  const handleDeleteUser = async (user: any) => {
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
        render: (value: any, row: any) =>
          col.render!(value, row, { onRoleClick: handleOpenRoleModal }),
      };
    }
    return col;
  });

  return (
    <>
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

      {selectedUser && (
        <RoleManagerModal
          open={roleModalOpen}
          onOpenChange={setRoleModalOpen}
          userEmail={selectedUser.email}
          userName={selectedUser.display_name || selectedUser.full_name}
          currentRoles={selectedUser.roles || []}
          onSave={handleSaveRoles}
        />
      )}
    </>
  );
};

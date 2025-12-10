import { useState, useEffect } from 'react';
import { FmDataGrid, DataGridColumn, DataGridAction } from './FmDataGrid';
import { supabase } from '@force-majeure/shared';
import { Badge } from '@/components/common/shadcn/badge';
import { Mail, Shield, Trash2, Edit, UserCog, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { RoleManagementModal } from '@/components/admin/RoleManagementModal';
import { logger } from '@force-majeure/shared';

interface UserData {
  id: string;
  email: string;
  display_name: string;
  full_name: string;
  created_at: string;
  organization_id?: string | null;
  organization?: {
    id: string;
    name: string;
  } | null;
  roles?: Array<{
    role_name: string;
    display_name: string;
    permissions: string[];
  }>;
  show_on_leaderboard: boolean;
}

export function FmUserDataGrid() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Get current session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      // Call edge function to get users with full details (including emails)
      const { data, error } = await supabase.functions.invoke('get-users', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      logger.info('Fetched users data:', data.users);
      setUsers(data.users || []);
    } catch (error: any) {
      logger.error('Error fetching users:', error);
      toast.error('Failed to load users', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenRoleModal = (user: UserData) => {
    logger.info('Opening role modal for user:', user);
    logger.info('User roles:', user.roles);
    setSelectedUser(user);
    setRoleModalOpen(true);
  };

  const handleRolesUpdated = () => {
    fetchUsers(); // Refresh the user list
  };

  const columns: DataGridColumn<UserData>[] = [
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      filterable: true,
      editable: true,
      type: 'email',
      render: value => (
        <div className='flex items-center gap-2'>
          <Mail className='h-4 w-4 text-muted-foreground' />
          <span className='font-mono text-sm'>{value}</span>
        </div>
      ),
    },
    {
      key: 'display_name',
      label: 'Username',
      sortable: true,
      filterable: true,
      editable: true,
      type: 'text',
    },
    {
      key: 'full_name',
      label: 'Full Name',
      sortable: true,
      filterable: true,
      editable: true,
      type: 'text',
    },
    {
      key: 'organization_id',
      label: 'Organization',
      sortable: false,
      filterable: true,
      editable: true,
      render: (_value, row) =>
        row.organization ? (
          <div className='flex items-center gap-2'>
            <Building2 className='h-4 w-4 text-muted-foreground' />
            <span>{row.organization.name}</span>
          </div>
        ) : (
          <span className='text-muted-foreground text-sm'>No organization</span>
        ),
    },
    {
      key: 'roles',
      label: 'Roles',
      sortable: false,
      filterable: true,
      editable: false, // Special implementation via modal
      render: (value: any[], row) => (
        <div
          className='flex flex-wrap gap-1 cursor-pointer hover:opacity-80 transition-opacity'
          onClick={() => handleOpenRoleModal(row)}
          title='Click to manage roles'
        >
          {Array.isArray(value) && value.length > 0 ? (
            value.map((role, idx) => (
              <Badge
                key={idx}
                variant={role.role_name === 'admin' ? 'default' : 'secondary'}
                className={
                  role.role_name === 'admin'
                    ? 'bg-fm-gold text-black hover:bg-fm-gold/90'
                    : ''
                }
              >
                <Shield className='h-3 w-3 mr-1' />
                {role.display_name}
              </Badge>
            ))
          ) : (
            <span className='text-muted-foreground'>No roles</span>
          )}
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'Joined',
      sortable: true,
      editable: false,
      type: 'date',
      render: value => (
        <span className='text-sm text-muted-foreground'>
          {format(new Date(value), 'MMM d, yyyy')}
        </span>
      ),
    },
  ];

  const actions: DataGridAction<UserData>[] = [
    {
      label: 'Edit User',
      icon: <Edit className='h-4 w-4' />,
      onClick: user => {
        toast.info('Edit User', {
          description: `Editing ${user.email}`,
        });
      },
    },
    {
      label: 'Manage Roles',
      icon: <UserCog className='h-4 w-4' />,
      onClick: user => {
        handleOpenRoleModal(user);
      },
    },
    {
      label: 'Delete User',
      icon: <Trash2 className='h-4 w-4' />,
      onClick: user => {
        toast.error('Delete User', {
          description: `This would delete ${user.email}`,
        });
      },
      variant: 'destructive',
    },
  ];

  const contextMenuActions: DataGridAction<UserData>[] = [
    {
      label: 'Copy Email',
      icon: <Mail className='h-4 w-4' />,
      onClick: user => {
        navigator.clipboard.writeText(user.email);
        toast.success('Email copied to clipboard', {
          duration: 2000,
        });
      },
    },
    ...actions,
  ];

  const handleUpdate = async (
    row: UserData,
    columnKey?: string,
    newValue?: any
  ) => {
    if (!columnKey) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [columnKey]: newValue })
        .eq('user_id', row.id);

      if (error) throw error;

      // Update the row in local state without refetching
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === row.id ? { ...user, [columnKey]: newValue } : user
        )
      );

      toast.success('User updated', {
        description: `${columnKey} updated successfully`,
      });
    } catch (error: any) {
      logger.error('Error updating user:', error);
      toast.error('Update failed', {
        description: error.message,
      });
      throw error; // Re-throw so the grid knows the update failed
    }
  };

  return (
    <>
      <FmDataGrid
        data={users}
        columns={columns}
        actions={actions}
        contextMenuActions={contextMenuActions}
        loading={loading}
        pageSize={15}
        onUpdate={handleUpdate}
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
    </>
  );
}

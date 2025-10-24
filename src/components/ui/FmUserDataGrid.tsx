import { useEffect, useState } from 'react';
import { FmCommonDataGrid, DataGridColumn, DataGridAction } from './FmCommonDataGrid';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Mail, Shield, Trash2, Edit, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface UserData {
  id: string;
  email: string;
  display_name: string;
  full_name: string;
  created_at: string;
  role: string;
  is_public: boolean;
  show_on_leaderboard: boolean;
}

export function FmUserDataGrid() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
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

      setUsers(data.users || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
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

  const columns: DataGridColumn<UserData>[] = [
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      filterable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-sm">{value}</span>
        </div>
      ),
    },
    {
      key: 'display_name',
      label: 'Display Name',
      sortable: true,
      filterable: true,
    },
    {
      key: 'full_name',
      label: 'Full Name',
      sortable: true,
      filterable: true,
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      filterable: true,
      render: (value) => (
        <Badge
          variant={value === 'admin' ? 'default' : 'secondary'}
          className={value === 'admin' ? 'bg-fm-gold text-black hover:bg-fm-gold/90' : ''}
        >
          <Shield className="h-3 w-3 mr-1" />
          {value}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      label: 'Joined',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(value), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      key: 'is_public',
      label: 'Public Profile',
      sortable: true,
      render: (value) => (
        <Badge variant={value ? 'outline' : 'secondary'}>
          {value ? 'Yes' : 'No'}
        </Badge>
      ),
    },
  ];

  const actions: DataGridAction<UserData>[] = [
    {
      label: 'Edit User',
      icon: <Edit className="h-4 w-4" />,
      onClick: (user) => {
        toast.info('Edit User', {
          description: `Editing ${user.email}`,
        });
      },
    },
    {
      label: 'Manage Roles',
      icon: <UserCog className="h-4 w-4" />,
      onClick: (user) => {
        toast.info('Manage Roles', {
          description: `Managing roles for ${user.email}`,
        });
      },
    },
    {
      label: 'Delete User',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (user) => {
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
      icon: <Mail className="h-4 w-4" />,
      onClick: (user) => {
        navigator.clipboard.writeText(user.email);
        toast.success('Email copied to clipboard', {
          duration: 2000,
        });
      },
    },
    ...actions,
  ];

  return (
    <FmCommonDataGrid
      data={users}
      columns={columns}
      actions={actions}
      contextMenuActions={contextMenuActions}
      loading={loading}
      pageSize={15}
    />
  );
}

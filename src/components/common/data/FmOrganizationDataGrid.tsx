import { useEffect, useState } from 'react';
import { FmCommonDataGrid, DataGridColumn, DataGridAction } from './FmCommonDataGrid';
import { supabase } from '@/shared/api/supabase/client';
import { Building2, Trash2, Edit, User } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Organization } from '@/types/organization';

export function FmOrganizationDataGrid() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('organizations' as any)
        .select('*')
        .order('name');

      if (error) throw error;

      setOrganizations((data as any) || []);
    } catch (error: any) {
      console.error('Error fetching organizations:', error);
      toast.error('Failed to load organizations', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const columns: DataGridColumn<Organization>[] = [
    {
      key: 'name',
      label: 'Organization Name',
      sortable: true,
      filterable: true,
      editable: true,
      type: 'text',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">{value}</span>
        </div>
      ),
    },
    {
      key: 'profile_picture',
      label: 'Profile Picture',
      sortable: false,
      filterable: false,
      editable: true,
      type: 'url',
      render: (value) => (
        value ? (
          <img
            src={value}
            alt="Organization"
            className="h-10 w-10 rounded-full object-cover border border-border"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </div>
        )
      ),
    },
    {
      key: 'owner_id',
      label: 'Owner',
      sortable: false,
      filterable: false,
      editable: true,
      isRelation: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-xs text-muted-foreground">{value}</span>
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      editable: false,
      type: 'created_date',
      render: (value) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(value), 'MMM d, yyyy')}
        </span>
      ),
    },
  ];

  const actions: DataGridAction<Organization>[] = [
    {
      label: 'Edit Organization',
      icon: <Edit className="h-4 w-4" />,
      onClick: (org) => {
        toast.info('Edit Organization', {
          description: `Editing ${org.name}`,
        });
      },
    },
    {
      label: 'Delete Organization',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (org) => {
        toast.error('Delete Organization', {
          description: `This would delete ${org.name}`,
        });
      },
      variant: 'destructive',
    },
  ];

  const contextMenuActions: DataGridAction<Organization>[] = actions;

  const handleUpdate = async (row: Organization, columnKey: string, newValue: any) => {
    try {
      const { error } = await supabase
        .from('organizations' as any)
        .update({ [columnKey]: newValue })
        .eq('id', row.id);

      if (error) throw error;

      // Update the row in local state without refetching
      setOrganizations(prevOrgs =>
        prevOrgs.map(org =>
          org.id === row.id
            ? { ...org, [columnKey]: newValue }
            : org
        )
      );

      toast.success('Organization updated', {
        description: `${columnKey} updated successfully`,
      });
    } catch (error: any) {
      console.error('Error updating organization:', error);
      toast.error('Update failed', {
        description: error.message,
      });
      throw error;
    }
  };

  const handleCreate = async (newData: Partial<Organization>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      const { data, error} = await supabase
        .from('organizations' as any)
        .insert({
          name: newData.name || 'New Organization',
          profile_picture: newData.profile_picture || null,
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      setOrganizations(prev => [...prev, data as any]);

      toast.success('Organization created', {
        description: `${(data as any).name} has been created`,
      });

      return data as any;
    } catch (error: any) {
      console.error('Error creating organization:', error);
      toast.error('Creation failed', {
        description: error.message,
      });
      throw error;
    }
  };

  return (
    <FmCommonDataGrid
      data={organizations}
      columns={columns}
      actions={actions}
      contextMenuActions={contextMenuActions}
      loading={loading}
      pageSize={15}
      onUpdate={handleUpdate}
      onCreate={handleCreate}
      resourceName="Organization"
      createButtonLabel="Create Organization"
    />
  );
}

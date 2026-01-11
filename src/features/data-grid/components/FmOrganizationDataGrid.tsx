import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FmConfigurableDataGrid } from './FmConfigurableDataGrid';
import { DataGridColumn, DataGridAction } from './FmDataGrid';
import { supabase } from '@/shared';
import { Building2, Trash2, Edit, User } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Organization } from '@/types/organization';
import { handleError } from '@/shared/services/errorHandler';

export function FmOrganizationDataGrid() {
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      // Fetch organizations
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .order('name');

      if (orgsError) throw orgsError;

      // Fetch owner profiles separately
      if (orgsData && orgsData.length > 0) {
        const ownerIds = [...new Set(orgsData.map(org => org.owner_id))];

        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, display_name, full_name, avatar_url')
          .in('user_id', ownerIds);

        // Map profiles to organizations
        const profileMap = new Map(
          profilesData?.map(p => [p.user_id, p]) || []
        );

        const orgsWithOwners = orgsData.map(org => ({
          ...org,
          owner: profileMap.get(org.owner_id),
        }));

        setOrganizations(orgsWithOwners as Organization[]);
      } else {
        setOrganizations([]);
      }
    } catch (error: unknown) {
      handleError(error, {
        title: tToast('error.load'),
        context: 'FmOrganizationDataGrid.fetchOrganizations',
        endpoint: 'organizations.select',
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
      label: t('dataGrid.columns.organizationName'),
      sortable: true,
      filterable: true,
      editable: true,
      type: 'text',
      render: value => (
        <div className='flex items-center gap-2'>
          <Building2 className='h-4 w-4 text-muted-foreground' />
          <span className='font-semibold'>{value}</span>
        </div>
      ),
    },
    {
      key: 'profile_picture',
      label: t('dataGrid.columns.profilePicture'),
      sortable: false,
      filterable: false,
      editable: true,
      type: 'url',
      render: value =>
        value ? (
          <img
            src={value}
            alt={t('dataGrid.placeholders.organization')}
            className='h-10 w-10 rounded-full object-cover border border-border'
          />
        ) : (
          <div className='h-10 w-10 rounded-full bg-muted flex items-center justify-center'>
            <Building2 className='h-5 w-5 text-muted-foreground' />
          </div>
        ),
    },
    {
      key: 'owner_id',
      label: t('dataGrid.columns.owner'),
      sortable: false,
      filterable: false,
      editable: true,
      isRelation: true,
      render: (_value, row) => {
        const owner = (row as any).owner;
        const ownerName = owner?.display_name || owner?.full_name || t('dataGrid.placeholders.unknownUser');

        return (
          <div className='flex items-center gap-2'>
            {owner?.avatar_url ? (
              <img
                src={owner.avatar_url}
                alt={ownerName}
                className='h-6 w-6 rounded-full object-cover'
              />
            ) : (
              <User className='h-4 w-4 text-muted-foreground' />
            )}
            <span className='text-sm'>{ownerName}</span>
          </div>
        );
      },
    },
    {
      key: 'created_at',
      label: t('dataGrid.columns.created'),
      sortable: true,
      editable: false,
      type: 'created_date',
      render: value => (
        <span className='text-sm text-muted-foreground'>
          {format(new Date(value), 'MMM d, yyyy')}
        </span>
      ),
    },
  ];

  const actions: DataGridAction<Organization>[] = [
    {
      label: t('dataGrid.actions.editOrganization'),
      icon: <Edit className='h-4 w-4' />,
      onClick: org => {
        toast.info(t('dataGrid.actions.editOrganization'), {
          description: org.name,
        });
      },
    },
    {
      label: t('dataGrid.actions.deleteOrganization'),
      icon: <Trash2 className='h-4 w-4' />,
      onClick: org => {
        toast.error(t('dataGrid.actions.deleteOrganization'), {
          description: org.name,
        });
      },
      variant: 'destructive',
    },
  ];

  const contextMenuActions: DataGridAction<Organization>[] = actions;

  const handleUpdate = async (
    row: Organization,
    columnKey: string,
    newValue: any
  ) => {
    try {
      const { error } = await supabase
        .from('organizations' as any)
        .update({ [columnKey]: newValue })
        .eq('id', row.id);

      if (error) throw error;

      // If owner_id was updated, refetch with owner data
      if (columnKey === 'owner_id') {
        const { data: updatedOrg } = await supabase
          .from('organizations' as any)
          .select('*')
          .eq('id', row.id)
          .single();

        if (updatedOrg) {
          // Fetch the owner profile separately
          const { data: ownerProfile } = await supabase
            .from('profiles')
            .select('user_id, display_name, full_name, avatar_url')
            .eq('user_id', (updatedOrg as any).owner_id)
            .single();

          const orgWithOwner = {
            ...(updatedOrg as any),
            owner: ownerProfile,
          };

          setOrganizations(prevOrgs =>
            prevOrgs.map(org => (org.id === row.id ? orgWithOwner : org))
          );
        }
      } else {
        // Update the row in local state without refetching
        setOrganizations(prevOrgs =>
          prevOrgs.map(org =>
            org.id === row.id ? { ...org, [columnKey]: newValue } : org
          )
        );
      }

      toast.success(tToast('admin.organizationUpdated'));
    } catch (error: unknown) {
      handleError(error, {
        title: tToast('error.update'),
        context: 'FmOrganizationDataGrid.handleUpdate',
        endpoint: 'organizations.update',
      });
      throw error;
    }
  };

  const handleCreate = async (newData: Partial<Organization>) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('organizations' as any)
        .insert({
          name: newData.name || 'New Organization',
          profile_picture: newData.profile_picture || null,
          owner_id: user.id,
        })
        .select('*')
        .single();

      if (error) throw error;
      if (!data) throw new Error('No data returned');

      const orgData = data as unknown as Organization;

      // Fetch the owner profile separately
      const { data: ownerProfile } = await supabase
        .from('profiles')
        .select('user_id, display_name, full_name, avatar_url')
        .eq('user_id', user.id)
        .single();

      const orgWithOwner = {
        ...orgData,
        owner: ownerProfile,
      } as Organization;

      setOrganizations(prev => [...prev, orgWithOwner]);

      toast.success(tToast('admin.organizationCreated'), {
        description: orgData.name,
      });
    } catch (error: unknown) {
      handleError(error, {
        title: tToast('error.create'),
        context: 'FmOrganizationDataGrid.handleCreate',
        endpoint: 'organizations.insert',
      });
      throw error;
    }
  };

  return (
    <FmConfigurableDataGrid
      gridId='organizations'
      data={organizations}
      columns={columns}
      actions={actions}
      contextMenuActions={contextMenuActions}
      loading={loading}
      pageSize={15}
      onUpdate={handleUpdate}
      onCreate={handleCreate}
      resourceName={t('dataGrid.resources.organization')}
      createButtonLabel={t('dataGrid.actions.createOrganization')}
    />
  );
}

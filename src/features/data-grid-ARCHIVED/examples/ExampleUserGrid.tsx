import { useState } from 'react';
import { DataGrid, useDataGridConfig } from '@features/data-grid';
import type { ColumnDef, RowAction } from '@features/data-grid';

/**
 * Example usage of the new DataGrid system
 * This shows a simple user management grid with all common features
 */

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  active: boolean;
  created_at: string;
}

export function ExampleUserGrid() {
  // Sample data
  const [users] = useState<User[]>([
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin',
      active: true,
      created_at: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'user',
      active: true,
      created_at: '2024-02-20T14:30:00Z'
    },
    {
      id: '3',
      name: 'Bob Johnson',
      email: 'bob@example.com',
      role: 'user',
      active: false,
      created_at: '2024-03-10T09:15:00Z'
    }
  ]);

  // Define columns
  const columns: ColumnDef<User>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      editable: true,
      required: true,
      width: '200px'
    },
    {
      key: 'email',
      label: 'Email',
      type: 'email',
      sortable: true,
      editable: true,
      required: true,
      width: '250px'
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      editable: true,
      render: (value) => (
        <span className={`px-2 py-1 rounded text-xs font-semibold ${
          value === 'admin' ? 'bg-red-100 text-red-800' :
          value === 'user' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'active',
      label: 'Active',
      type: 'boolean',
      sortable: true,
      editable: true
    },
    {
      key: 'created_at',
      label: 'Created',
      type: 'date',
      sortable: true,
      readonly: true
    }
  ];

  // Define row actions
  const rowActions: RowAction<User>[] = [
    {
      label: 'Edit',
      icon: 'Edit',
      onClick: (user) => {
        console.log('Edit user:', user);
        alert(`Edit user: ${user.name}`);
      }
    },
    {
      label: 'Deactivate',
      icon: 'UserX',
      onClick: (user) => {
        console.log('Deactivate user:', user);
        alert(`Deactivate user: ${user.name}`);
      },
      disabled: (user) => !user.active,
      variant: 'warning'
    },
    {
      label: 'Delete',
      icon: 'Trash2',
      onClick: (user) => {
        console.log('Delete user:', user);
        if (confirm(`Delete user ${user.name}?`)) {
          alert(`User ${user.name} deleted`);
        }
      },
      variant: 'danger'
    }
  ];

  // Define bulk actions
  const bulkActions = [
    {
      label: 'Export Selected',
      icon: 'Download',
      onClick: (selectedUsers: User[]) => {
        console.log('Export users:', selectedUsers);
        alert(`Exporting ${selectedUsers.length} users`);
      }
    },
    {
      label: 'Delete Selected',
      icon: 'Trash2',
      onClick: (selectedUsers: User[]) => {
        console.log('Delete users:', selectedUsers);
        if (confirm(`Delete ${selectedUsers.length} users?`)) {
          alert(`Deleted ${selectedUsers.length} users`);
        }
      },
      variant: 'danger' as const
    }
  ];

  // Handlers
  const handleUpdate = async (user: User, columnKey: string, newValue: any) => {
    console.log('Update:', { user, columnKey, newValue });
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert(`Updated ${columnKey} to ${newValue} for ${user.name}`);
  };

  const handleCreate = async (newUser: Partial<User>) => {
    console.log('Create:', newUser);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert(`Created user: ${newUser.name}`);
  };

  // Configure the grid
  const config = useDataGridConfig<User>({
    data: users,
    columns,
    features: {
      sorting: {
        defaultSort: { column: 'name', direction: 'asc' }
      },
      filtering: {
        searchable: true,
        searchPlaceholder: 'Search users...'
      },
      pagination: {
        pageSize: 10,
        pageSizeOptions: [5, 10, 25, 50]
      },
      selection: {
        enabled: true,
        mode: 'multiple'
      }
    },
    toolbar: {
      title: 'User Management',
      search: true
    },
    rowActions,
    bulkActions,
    onUpdate: handleUpdate,
    onCreate: handleCreate,
    resourceName: 'User',
    createButtonLabel: 'Add User'
  });

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Data Grid Example</h1>
      <DataGrid config={config} />
    </div>
  );
}

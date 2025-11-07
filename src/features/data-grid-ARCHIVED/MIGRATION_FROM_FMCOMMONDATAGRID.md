# Migration Guide: FmCommonDataGrid → DataGrid

This guide will help you migrate from the old `FmCommonDataGrid` component to the new modular `DataGrid` system.

## Why Migrate?

The new DataGrid system offers:

- ✅ **Better separation of concerns**: Each feature is an independent hook
- ✅ **Type safety**: Full TypeScript generics support
- ✅ **Smaller bundle size**: Tree-shakeable, use only what you need
- ✅ **Easier testing**: Test hooks independently
- ✅ **More flexible**: Compose features as needed
- ✅ **Reusable**: Can be extracted to any React application
- ✅ **Better performance**: Optimized rendering with proper memoization

## Quick Comparison

### Old Way (FmCommonDataGrid)

```tsx
import { FmCommonDataGrid, DataGridColumn, DataGridAction } from '@/components/common/data/FmCommonDataGrid';

function UserList() {
  const columns: DataGridColumn[] = [
    { key: 'name', label: 'Name', sortable: true, editable: true },
    { key: 'email', label: 'Email', sortable: true }
  ];

  const actions: DataGridAction[] = [
    { label: 'Edit', onClick: handleEdit },
    { label: 'Delete', onClick: handleDelete }
  ];

  return (
    <FmCommonDataGrid
      data={users}
      columns={columns}
      actions={actions}
      contextMenuActions={actions}
      pageSize={25}
      onUpdate={handleUpdate}
      onCreate={handleCreate}
      resourceName="User"
    />
  );
}
```

### New Way (DataGrid)

```tsx
import { DataGrid, useDataGridConfig } from '@features/data-grid';
import type { ColumnDef, RowAction } from '@features/data-grid';

interface User {
  id: string;
  name: string;
  email: string;
}

function UserList() {
  const config = useDataGridConfig<User>({
    data: users,
    columns: [
      { key: 'name', label: 'Name', sortable: true, editable: true },
      { key: 'email', label: 'Email', sortable: true }
    ],
    features: {
      sorting: {},
      filtering: { searchable: true },
      pagination: { pageSize: 25 },
      selection: { enabled: true, mode: 'multiple' }
    },
    toolbar: {
      search: true
    },
    rowActions: [
      { label: 'Edit', onClick: handleEdit },
      { label: 'Delete', onClick: handleDelete, variant: 'danger' }
    ],
    onUpdate: handleUpdate,
    onCreate: handleCreate,
    resourceName: 'User'
  });

  return <DataGrid config={config} />;
}
```

## Step-by-Step Migration

### Step 1: Update Imports

**Old:**
```tsx
import { 
  FmCommonDataGrid, 
  DataGridColumn, 
  DataGridAction 
} from '@/components/common/data/FmCommonDataGrid';
```

**New:**
```tsx
import { 
  DataGrid, 
  useDataGridConfig,
  type ColumnDef,
  type RowAction
} from '@features/data-grid';
```

### Step 2: Update Type Definitions

**Old:**
```tsx
const columns: DataGridColumn[] = [...];
const actions: DataGridAction[] = [...];
```

**New:**
```tsx
interface MyData {
  id: string;
  name: string;
  // ... other fields
}

const columns: ColumnDef<MyData>[] = [...];
const rowActions: RowAction<MyData>[] = [...];
```

### Step 3: Create Configuration Object

**Old:** Props passed directly to component
```tsx
<FmCommonDataGrid
  data={data}
  columns={columns}
  actions={actions}
  contextMenuActions={contextActions}
  loading={loading}
  pageSize={25}
  onUpdate={handleUpdate}
  onCreate={handleCreate}
  resourceName="Item"
  createButtonLabel="Add Item"
/>
```

**New:** Use configuration object
```tsx
const config = useDataGridConfig<MyData>({
  data: data,
  columns: columns,
  features: {
    sorting: {},
    filtering: { searchable: true },
    pagination: { pageSize: 25 },
    selection: { enabled: true, mode: 'multiple' }
  },
  toolbar: {
    search: true
  },
  rowActions: rowActions,
  contextMenuActions: contextActions,
  loading: loading,
  onUpdate: handleUpdate,
  onCreate: handleCreate,
  resourceName: 'Item',
  createButtonLabel: 'Add Item'
});

<DataGrid config={config} />
```

### Step 4: Update Column Definitions

Most column properties remain the same:

| Old Property | New Property | Notes |
|--------------|--------------|-------|
| `key` | `key` | Same |
| `label` | `label` | Same |
| `sortable` | `sortable` | Same |
| `filterable` | `filterable` | Same |
| `editable` | `editable` | Same |
| `readonly` | `readonly` | Same |
| `required` | `required` | Same |
| `render` | `render` | Same signature |
| `width` | `width` | Same |
| `isRelation` | `isRelation` | Same |
| `type` | `type` | Same values |

### Step 5: Update Actions

**Old:**
```tsx
const actions: DataGridAction[] = [
  {
    label: 'Edit',
    onClick: (row) => handleEdit(row)
  },
  {
    label: 'Delete',
    onClick: (row) => handleDelete(row),
    variant: 'danger'
  }
];
```

**New:** Same structure, but typed
```tsx
const rowActions: RowAction<MyData>[] = [
  {
    label: 'Edit',
    onClick: (row) => handleEdit(row)
  },
  {
    label: 'Delete',
    onClick: (row) => handleDelete(row),
    variant: 'danger'
  }
];
```

### Step 6: Update Handlers

Handler signatures remain the same:

```tsx
// onUpdate: (row, columnKey, newValue) => Promise<void>
const handleUpdate = async (row: MyData, columnKey: string, newValue: any) => {
  // Your update logic
};

// onCreate: (newRow) => Promise<void>
const handleCreate = async (newRow: Partial<MyData>) => {
  // Your create logic
};
```

## Feature Mapping

### Sorting

**Old:** Automatic
**New:** Configure explicitly
```tsx
features: {
  sorting: {
    defaultSort: { column: 'name', direction: 'asc' }
  }
}
```

### Filtering

**Old:** Automatic with search
**New:** Configure explicitly
```tsx
features: {
  filtering: {
    searchable: true,
    searchPlaceholder: 'Search...'
  }
}
```

### Pagination

**Old:** `pageSize={25}`
**New:** 
```tsx
features: {
  pagination: {
    pageSize: 25,
    pageSizeOptions: [10, 25, 50, 100]
  }
}
```

### Selection

**Old:** Automatic
**New:** Configure explicitly
```tsx
features: {
  selection: {
    enabled: true,
    mode: 'multiple' // or 'single'
  }
}
```

### Toolbar

**Old:** No explicit configuration
**New:**
```tsx
toolbar: {
  title: 'My Data',
  search: true,
  actions: <CustomButtons />
}
```

## Complete Migration Example

### Before (FmCommonDataGrid)

```tsx
import { FmCommonDataGrid, DataGridColumn, DataGridAction } from '@/components/common/data/FmCommonDataGrid';

export function FmUserDataGrid() {
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers
  });

  const columns: DataGridColumn[] = [
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      editable: true,
      type: 'email'
    },
    {
      key: 'display_name',
      label: 'Display Name',
      sortable: true,
      editable: true
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      editable: true,
      render: (value) => <RoleBadge role={value} />
    }
  ];

  const actions: DataGridAction[] = [
    {
      label: 'View Profile',
      onClick: (user) => navigate(`/profile/${user.id}`)
    },
    {
      label: 'Reset Password',
      onClick: (user) => handlePasswordReset(user)
    }
  ];

  const handleUpdate = async (user: any, key: string, value: any) => {
    await updateUser(user.id, { [key]: value });
  };

  return (
    <FmCommonDataGrid
      data={users || []}
      columns={columns}
      actions={actions}
      contextMenuActions={actions}
      loading={isLoading}
      pageSize={25}
      onUpdate={handleUpdate}
      resourceName="User"
    />
  );
}
```

### After (DataGrid)

```tsx
import { DataGrid, useDataGridConfig } from '@features/data-grid';
import type { ColumnDef, RowAction } from '@features/data-grid';

interface User {
  id: string;
  email: string;
  display_name: string;
  role: string;
}

export function UserDataGrid() {
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers
  });

  const columns: ColumnDef<User>[] = [
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      editable: true,
      type: 'email'
    },
    {
      key: 'display_name',
      label: 'Display Name',
      sortable: true,
      editable: true
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      editable: true,
      render: (value) => <RoleBadge role={value} />
    }
  ];

  const rowActions: RowAction<User>[] = [
    {
      label: 'View Profile',
      onClick: (user) => navigate(`/profile/${user.id}`)
    },
    {
      label: 'Reset Password',
      onClick: (user) => handlePasswordReset(user)
    }
  ];

  const handleUpdate = async (user: User, key: string, value: any) => {
    await updateUser(user.id, { [key]: value });
  };

  const config = useDataGridConfig<User>({
    data: users || [],
    columns,
    features: {
      sorting: {},
      filtering: { searchable: true },
      pagination: { pageSize: 25 },
      selection: { enabled: true, mode: 'multiple' }
    },
    toolbar: {
      title: 'Users',
      search: true
    },
    rowActions,
    contextMenuActions: rowActions,
    loading: isLoading,
    onUpdate: handleUpdate,
    resourceName: 'User'
  });

  return <DataGrid config={config} />;
}
```

## Common Pitfalls

### 1. Missing Type Parameter

❌ **Wrong:**
```tsx
const columns: ColumnDef[] = [...];
```

✅ **Correct:**
```tsx
const columns: ColumnDef<User>[] = [...];
```

### 2. Not Using useDataGridConfig

While optional, it's recommended to use `useDataGridConfig` for proper memoization:

```tsx
const config = useDataGridConfig<User>({
  // config here
});
```

### 3. Forgetting Feature Configuration

The new system requires explicit feature configuration:

```tsx
features: {
  sorting: {},              // Enable sorting
  filtering: { searchable: true },  // Enable filtering
  pagination: { pageSize: 25 },     // Enable pagination
  selection: { enabled: true }      // Enable selection
}
```

## Testing

The new system is much easier to test since hooks can be tested independently:

```tsx
import { renderHook } from '@testing-library/react';
import { useSorting, useFiltering, usePagination } from '@features/data-grid';

test('sorting works correctly', () => {
  const { result } = renderHook(() => useSorting());
  
  act(() => {
    result.current.handleSort('name');
  });
  
  expect(result.current.sortColumn).toBe('name');
  expect(result.current.sortDirection).toBe('asc');
});
```

## Need Help?

- See [README.md](./README.md) for full API documentation
- Check examples in `src/examples/`
- Ask in the team Slack channel

## Gradual Migration

You can migrate grids gradually - the old `FmCommonDataGrid` will continue to work alongside the new `DataGrid` system.

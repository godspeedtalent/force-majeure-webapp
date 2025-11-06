# Data Grid Feature Package

A modular, type-safe, and highly configurable data grid system for React applications.

## Architecture

The data grid is built using a **hook-based composition pattern** that separates concerns into:

- **Types**: TypeScript definitions for configuration and state
- **Hooks**: Composable hooks for individual features (sorting, filtering, pagination, selection, editing)
- **Context**: React context for sharing state between components
- **Components**: Modular UI components that consume the context

## Features

- ✅ **Type-safe**: Full TypeScript support with generics
- ✅ **Data agnostic**: Works with any data structure
- ✅ **Highly configurable**: Fine-grained control over features
- ✅ **Modular**: Use only what you need
- ✅ **Sortable columns**: Click to sort
- ✅ **Global search**: Search across all columns
- ✅ **Column filters**: Individual column filtering
- ✅ **Pagination**: Configurable page sizes
- ✅ **Row selection**: Single or multiple selection with shift-click
- ✅ **Inline editing**: Edit cells directly
- ✅ **Row creation**: Add new rows inline
- ✅ **Row actions**: Per-row operations
- ✅ **Bulk actions**: Multi-row operations
- ✅ **Toolbar**: Search, filters, and custom actions
- ✅ **Loading states**: Built-in loading indicators
- ✅ **Responsive**: Works on all screen sizes

## Basic Usage

```tsx
import { DataGrid, useDataGridConfig } from '@features/data-grid';
import type { ColumnDef } from '@features/data-grid';

interface User {
  id: string;
  name: string;
  email: string;
  active: boolean;
}

function UserGrid() {
  const [users, setUsers] = useState<User[]>([]);

  const config = useDataGridConfig<User>({
    data: users,
    columns: [
      {
        key: 'name',
        label: 'Name',
        sortable: true,
        editable: true,
        width: '200px'
      },
      {
        key: 'email',
        label: 'Email',
        type: 'email',
        sortable: true
      },
      {
        key: 'active',
        label: 'Active',
        type: 'boolean',
        editable: true
      }
    ],
    features: {
      sorting: {
        defaultSort: { column: 'name', direction: 'asc' }
      },
      filtering: {
        searchable: true,
        searchPlaceholder: 'Search users...'
      },
      pagination: {
        pageSize: 25,
        pageSizeOptions: [10, 25, 50, 100]
      },
      selection: {
        enabled: true,
        mode: 'multiple'
      }
    },
    toolbar: {
      title: 'Users',
      search: true
    },
    rowActions: [
      {
        label: 'Edit',
        onClick: (user) => handleEdit(user)
      },
      {
        label: 'Delete',
        onClick: (user) => handleDelete(user),
        variant: 'danger'
      }
    ],
    bulkActions: [
      {
        label: 'Export Selected',
        onClick: (users) => exportUsers(users)
      }
    ],
    onUpdate: async (user, key, value) => {
      // Handle inline edits
      await updateUser(user.id, { [key]: value });
    },
    onCreate: async (newUser) => {
      // Handle new row creation
      await createUser(newUser);
    }
  });

  return <DataGrid config={config} />;
}
```

## Advanced Usage

### Custom Cell Rendering

```tsx
columns: [
  {
    key: 'avatar',
    label: 'Avatar',
    render: (value, row) => (
      <img src={value} alt={row.name} className="h-8 w-8 rounded-full" />
    )
  },
  {
    key: 'status',
    label: 'Status',
    render: (value) => (
      <Badge variant={value === 'active' ? 'success' : 'secondary'}>
        {value}
      </Badge>
    )
  }
]
```

### Custom Toolbar Actions

```tsx
toolbar: {
  title: 'Users',
  search: true,
  actions: (
    <>
      <Button variant="outline" onClick={handleExport}>
        Export All
      </Button>
      <Button onClick={handleImport}>
        Import
      </Button>
    </>
  )
}
```

### Accessing Grid State Directly

```tsx
import { useDataGrid, DataGridProvider } from '@features/data-grid';

function CustomGrid() {
  const gridState = useDataGrid(config);
  
  // Access state directly
  console.log('Selected rows:', gridState.selection.selectedRows);
  console.log('Current page:', gridState.pagination.currentPage);
  
  return (
    <DataGridProvider value={gridState}>
      {/* Custom UI using grid state */}
      <div>
        <CustomToolbar />
        <CustomTable />
        <CustomPagination />
      </div>
    </DataGridProvider>
  );
}
```

## Column Types

- `text`: Plain text input
- `number`: Numeric input
- `email`: Email input with validation
- `url`: URL input
- `date`: Date picker
- `boolean`: Toggle switch
- `created_date`: Read-only date field

## API Reference

### DataGridConfig<TData>

Main configuration object for the data grid.

| Property | Type | Description |
|----------|------|-------------|
| `data` | `TData[]` | Array of data to display |
| `columns` | `ColumnDef<TData>[]` | Column definitions |
| `features` | `Object` | Feature configurations (sorting, filtering, etc.) |
| `toolbar` | `ToolbarConfig` | Toolbar configuration |
| `rowActions` | `RowAction<TData>[]` | Per-row actions |
| `bulkActions` | `BulkAction<TData>[]` | Multi-row actions |
| `loading` | `boolean` | Loading state |
| `onUpdate` | `Function` | Callback for cell updates |
| `onCreate` | `Function` | Callback for row creation |
| `resourceName` | `string` | Resource name for display |

### ColumnDef<TData>

Column definition object.

| Property | Type | Description |
|----------|------|-------------|
| `key` | `string` | Unique column identifier |
| `label` | `string` | Display label |
| `sortable` | `boolean` | Enable sorting |
| `filterable` | `boolean` | Enable filtering |
| `editable` | `boolean` | Enable inline editing |
| `readonly` | `boolean` | Mark as readonly |
| `required` | `boolean` | Required for new rows |
| `render` | `Function` | Custom render function |
| `width` | `string` | Column width |
| `type` | `string` | Input type |

## Migration Guide

See [MIGRATION_FROM_FMCOMMONDATAGRID.md](./MIGRATION_FROM_FMCOMMONDATAGRID.md) for detailed migration instructions from the old `FmCommonDataGrid` component.

## Architecture Benefits

1. **Separation of Concerns**: Each hook manages one feature
2. **Testability**: Hooks can be tested independently
3. **Reusability**: Can be used in any React application
4. **Type Safety**: Full TypeScript support
5. **Performance**: Optimized with useMemo and useCallback
6. **Flexibility**: Easy to customize and extend
7. **Maintainability**: Clear structure and single responsibility

## Examples

See the following files for complete examples:

- **Simple Grid**: `src/examples/SimpleDataGrid.tsx`
- **Advanced Grid**: `src/examples/AdvancedDataGrid.tsx`
- **Custom Components**: `src/examples/CustomDataGrid.tsx`

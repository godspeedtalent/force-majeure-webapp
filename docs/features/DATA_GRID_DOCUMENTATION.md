# DataGrid Documentation

## Overview

The Force Majeure DataGrid system provides a powerful, feature-rich data table component for displaying and managing tabular data. Built with React, TypeScript, and Radix UI, it offers advanced features like virtual scrolling, keyboard navigation, column management, filtering, grouping, and bulk operations.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Core Components](#core-components)
3. [Features](#features)
4. [Hooks](#hooks)
5. [Utilities](#utilities)
6. [Advanced Usage](#advanced-usage)
7. [API Reference](#api-reference)

## Quick Start

### Basic Usage

```tsx
import { FmDataGrid } from '@/features/data-grid';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

function UserList() {
  const [users, setUsers] = useState<User[]>([]);

  const columns = [
    { key: 'name', label: 'Name', sortable: true, filterable: true },
    { key: 'email', label: 'Email', sortable: true, type: 'email' },
    { key: 'role', label: 'Role', sortable: true, filterable: true },
  ];

  return (
    <FmDataGrid
      data={users}
      columns={columns}
      resourceName='User'
      pageSize={25}
    />
  );
}
```

## Core Components

### FmDataGrid

The main data grid component with full functionality.

**Key Props:**

- `data: T[]` - Array of data objects to display
- `columns: DataGridColumn<T>[]` - Column configuration
- `actions?: DataGridAction<T>[]` - Action buttons per row
- `onUpdate?: (item: T) => Promise<void>` - Update handler
- `onCreate?: (item: Partial<T>) => Promise<void>` - Create handler
- `onBatchDelete?: (items: T[]) => Promise<void>` - Batch delete handler
- `pageSize?: number` - Rows per page (default: 10)
- `resourceName?: string` - Display name for the resource
- `enableVirtualization?: boolean` - Enable virtual scrolling (default: true for >100 rows)
- `enableExport?: boolean` - Enable data export (default: true)

### FmConfigurableDataGrid

Extended DataGrid with column visibility and persistence.

**Additional Props:**

- `persistenceKey?: string` - LocalStorage key for state persistence
- `defaultHiddenColumns?: string[]` - Columns hidden by default

```tsx
<FmConfigurableDataGrid
  data={data}
  columns={columns}
  persistenceKey='my-grid-state'
  defaultHiddenColumns={['internal_id', 'created_at']}
/>
```

### FmAdvancedFilterDialog

Dialog for building complex filter queries.

**Features:**

- 12 filter operators (equals, contains, greater_than, etc.)
- AND/OR logic combinations
- Save/load filter presets
- Multiple rules per filter

```tsx
<FmAdvancedFilterDialog
  open={showFilters}
  onOpenChange={setShowFilters}
  columns={columns}
  data={data}
  onApplyFilters={filtered => setFilteredData(filtered)}
/>
```

### FmDataGridExportDialog

Dialog for exporting data to various formats.

**Supported Formats:**

- CSV (Comma-separated values)
- TSV (Tab-separated values)
- JSON (JavaScript Object Notation)

```tsx
<FmDataGridExportDialog
  open={showExport}
  onOpenChange={setShowExport}
  columns={columns}
  data={data}
  filename='my-export'
  onExport={(selectedColumns, format) => {
    exportData(data, columns, selectedColumns, format, 'my-export');
  }}
/>
```

### FmDataGridGroupDialog

Dialog for grouping data with aggregations.

**Aggregation Types:**

- count - Count of rows in group
- sum - Sum of numeric values
- avg - Average of numeric values
- min - Minimum value
- max - Maximum value

```tsx
<FmDataGridGroupDialog
  open={showGroup}
  onOpenChange={setShowGroup}
  columns={columns}
  currentGroupConfig={groupConfig}
  onApply={config => setGroupConfig(config)}
  onClear={() => setGroupConfig(null)}
/>
```

### FmBulkEditDialog

Dialog for editing multiple rows simultaneously.

**Features:**

- Toggle fields to edit
- Type-aware input controls
- Preview affected rows
- Validation support

```tsx
<FmBulkEditDialog
  open={showBulkEdit}
  onOpenChange={setShowBulkEdit}
  columns={columns}
  selectedRows={selectedRowsData}
  onApply={updates => bulkUpdate(updates)}
/>
```

## Features

### 1. Column Configuration

Define columns with rich metadata:

```tsx
const columns: DataGridColumn<User>[] = [
  {
    key: 'id',
    label: 'ID',
    sortable: true,
    readonly: true, // Cannot be edited
  },
  {
    key: 'name',
    label: 'Full Name',
    sortable: true,
    filterable: true,
    editable: true,
    required: true,
    type: 'text',
  },
  {
    key: 'email',
    label: 'Email Address',
    sortable: true,
    editable: true,
    type: 'email',
    render: value => <a href={`mailto:${value}`}>{value}</a>,
  },
  {
    key: 'active',
    label: 'Active',
    type: 'boolean',
    editable: true,
  },
  {
    key: 'created_at',
    label: 'Created',
    type: 'created_date',
    sortable: true,
    render: value => formatDate(value, 'PPP'),
  },
];
```

**Column Types:**

- `text` - Plain text input (default)
- `number` - Numeric input
- `email` - Email input with validation
- `url` - URL input
- `date` - Date picker
- `boolean` - Switch/toggle
- `created_date` - Read-only timestamp

### 2. Inline Editing

Click cells to edit in-place (when `editable: true`):

```tsx
<FmDataGrid
  data={users}
  columns={columns}
  onUpdate={async user => {
    await api.updateUser(user.id, user);
  }}
/>
```

### 3. Row Selection

Multiple selection modes:

- Click - Single row selection
- Shift+Click - Range selection
- Drag - Multi-row selection
- Ctrl/Cmd+Click - Add to selection

```tsx
// Access selected rows in actions
const actions = [
  {
    label: 'Delete Selected',
    onClick: rows => deleteRows(rows),
  },
];
```

### 4. Sorting & Filtering

**Universal Search:**

```tsx
// Search across all columns automatically
<FmDataGrid
  data={data}
  columns={columns}
  // Search bar appears automatically
/>
```

**Column Filters:**

```tsx
// Individual column filters
const columns = [{ key: 'status', label: 'Status', filterable: true }];
```

**Advanced Filters:**

```tsx
// Complex filter queries with operators
<FmAdvancedFilterDialog
// ... see Advanced Filtering section
/>
```

### 5. Virtual Scrolling

Automatically enabled for datasets >100 rows:

```tsx
<FmDataGrid
  data={largeDataset}
  columns={columns}
  enableVirtualization={true} // default: true
  estimateRowSize={48} // default: 48px
/>
```

### 6. Column Resizing

Drag column borders to resize:

```tsx
// Automatically enabled
// Min width: 80px
// Widths stored in component state
```

### 7. Column Reordering

Drag column headers to reorder:

```tsx
<FmConfigurableDataGrid
  // Reordering built-in with persistence
  persistenceKey='my-grid'
/>
```

### 8. Data Export

Export filtered/sorted data:

```tsx
import { exportData } from '@/features/data-grid';

// Export to CSV
exportData(data, columns, ['name', 'email'], 'csv', 'users');

// Export to JSON
exportData(
  data,
  columns,
  columns.map(c => c.key),
  'json',
  'users-full'
);
```

**Export Features:**

- Choose columns to export
- Respects current filters/sorting
- Smart type conversion (dates, booleans, relations)
- Proper CSV escaping

### 9. Grouping & Aggregation

Group data by any column with aggregations:

```tsx
const groupConfig = {
  columnKey: 'status',
  aggregations: [
    { columnKey: 'amount', type: 'sum' },
    { columnKey: 'amount', type: 'avg' },
  ],
};

// Groups show:
// - Group value (e.g., "Active")
// - Row count (e.g., "23 rows")
// - Aggregations (e.g., "sum: $45,600")
// - Expand/collapse icon
```

### 10. Bulk Edit

Edit multiple rows simultaneously:

```tsx
// Select rows and click "Edit X" button
// Toggle fields to update
// All selected rows get the same values
```

### 11. Keyboard Navigation

**Navigation:**

- `Arrow Keys` - Move between cells
- `Tab/Shift+Tab` - Next/previous focusable cell
- `Enter` - Start editing cell
- `Escape` - Cancel editing

**Accessibility:**

- Full ARIA support
- Screen reader friendly
- Keyboard-only operation

### 12. Context Menu

Right-click rows for context actions:

```tsx
const contextMenuActions = [
  {
    label: 'Edit',
    icon: <Edit className='h-4 w-4' />,
    onClick: row => navigate(`/edit/${row.id}`),
  },
  {
    label: 'Delete',
    icon: <Trash className='h-4 w-4' />,
    onClick: row => deleteRow(row),
    variant: 'destructive',
    separator: true,
  },
];

<FmDataGrid
  data={data}
  columns={columns}
  contextMenuActions={contextMenuActions}
/>;
```

### 13. Batch Operations

Delete multiple rows:

```tsx
<FmDataGrid
  data={data}
  columns={columns}
  onBatchDelete={async rows => {
    await api.deleteRows(rows.map(r => r.id));
  }}
/>
```

### 14. State Persistence

Save grid state to localStorage:

```tsx
<FmConfigurableDataGrid
  persistenceKey='my-grid-v1'
  // Saves:
  // - Column order
  // - Column visibility
  // - Column widths
  // - Sort state
  // - Filters
/>
```

## Hooks

### useDataGridState

Manages core grid state:

```tsx
import { useDataGridState } from '@/features/data-grid';

const {
  currentPage,
  setCurrentPage,
  pageSize,
  setPageSize,
  sortColumn,
  setSortColumn,
  sortDirection,
  setSortDirection,
} = useDataGridState({
  initialPageSize: 25,
});
```

### useDataGridFilters

Manages filtering state:

```tsx
import { useDataGridFilters } from '@/features/data-grid';

const {
  searchQuery,
  setSearchQuery,
  columnFilters,
  setColumnFilter,
  clearFilters,
  filteredData,
} = useDataGridFilters({
  data,
  columns,
});
```

### useDataGridSelection

Manages row selection:

```tsx
import { useDataGridSelection } from '@/features/data-grid';

const {
  selectedRows,
  selectRow,
  selectRange,
  selectAll,
  clearSelection,
  isSelected,
} = useDataGridSelection({
  totalRows: data.length,
});
```

### useDataGridKeyboardNav

Implements keyboard navigation:

```tsx
import { useDataGridKeyboardNav } from '@/features/data-grid';

const { handleTableKeyDown, getFocusableCellProps } = useDataGridKeyboardNav({
  rows: data,
  columns,
  isEditing: false,
  onStartEditing: (rowIndex, columnKey) => {
    // Start editing cell
  },
});
```

### useDataGridVirtualization

Implements virtual scrolling:

```tsx
import { useDataGridVirtualization } from '@/features/data-grid';

const { parentRef, virtualRows, totalSize, isEnabled } =
  useDataGridVirtualization({
    rowCount: data.length,
    estimateSize: 48,
    enabled: true,
  });
```

### useDataGridPersistence

Persists state to localStorage:

```tsx
import { useDataGridPersistence } from '@/features/data-grid';

const { persistedState, saveState, clearState } = useDataGridPersistence({
  key: 'my-grid',
  defaultState: {
    columnOrder: columns.map(c => c.key),
    hiddenColumns: [],
  },
});
```

## Utilities

### Advanced Filtering

```tsx
import { applyAdvancedFilters } from '@/features/data-grid';

const filterGroup = {
  logic: 'AND',
  rules: [
    {
      columnKey: 'status',
      operator: 'equals',
      value: 'active',
    },
    {
      columnKey: 'amount',
      operator: 'greater_than',
      value: '1000',
    },
  ],
};

const filtered = applyAdvancedFilters(data, filterGroup, columns);
```

**Available Operators:**

- `equals` / `not_equals`
- `contains` / `not_contains`
- `starts_with` / `ends_with`
- `greater_than` / `greater_or_equal`
- `less_than` / `less_or_equal`
- `is_empty` / `is_not_empty`

### Data Export

```tsx
import {
  exportData,
  exportToCSV,
  exportToTSV,
  exportToJSON,
} from '@/features/data-grid';

// High-level export
exportData(data, columns, selectedColumns, 'csv', 'filename');

// Low-level exports
const csvContent = exportToCSV(data, columns, selectedColumns);
const tsvContent = exportToTSV(data, columns, selectedColumns);
const jsonContent = exportToJSON(data, columns, selectedColumns);
```

### Grouping

```tsx
import {
  groupData,
  flattenGroupedData,
  toggleGroupExpanded,
  formatAggregation,
} from '@/features/data-grid';

// Group data
const grouped = groupData(
  data,
  {
    columnKey: 'category',
    aggregations: [
      { columnKey: 'price', type: 'sum' },
      { columnKey: 'price', type: 'avg' },
    ],
  },
  columns
);

// Flatten for rendering
const flattened = flattenGroupedData(grouped);

// Toggle group
const updated = toggleGroupExpanded(grouped, 'Electronics');

// Format aggregation value
const formatted = formatAggregation(12345.67, 'sum'); // "$12,345.67"
```

## Advanced Usage

### Custom Cell Rendering

```tsx
const columns = [
  {
    key: 'avatar',
    label: 'User',
    render: (value, row) => (
      <div className='flex items-center gap-2'>
        <img src={row.avatar} className='h-8 w-8 rounded-full' />
        <span>{row.name}</span>
      </div>
    ),
  },
  {
    key: 'status',
    label: 'Status',
    render: value => (
      <Badge variant={value === 'active' ? 'success' : 'default'}>
        {value}
      </Badge>
    ),
  },
];
```

### Custom Actions

```tsx
const actions = [
  {
    label: 'View Details',
    onClick: row => navigate(`/details/${row.id}`),
  },
  {
    label: 'Download Report',
    onClick: async row => {
      const report = await generateReport(row.id);
      downloadFile(report, `report-${row.id}.pdf`);
    },
  },
];
```

### Toolbar Actions

```tsx
<FmDataGrid
  data={data}
  columns={columns}
  toolbarActions={
    <>
      <Button onClick={() => importData()}>
        <Upload className='h-4 w-4 mr-2' />
        Import
      </Button>
      <Button onClick={() => refreshData()}>
        <RefreshCw className='h-4 w-4 mr-2' />
        Refresh
      </Button>
    </>
  }
/>
```

### Relation Fields

```tsx
// Define relation
const columns = [
  {
    key: 'organization_id',
    label: 'Organization',
    isRelation: true,
    render: (value, row) => row.organization?.name || 'N/A',
  },
];

// Utility checks
import { isRelationField, getRelationConfig } from '@/features/data-grid';

if (isRelationField('organization_id')) {
  const config = getRelationConfig('organization_id');
  // config = { table: 'organizations', column: 'name' }
}
```

### Conditional Formatting

```tsx
const columns = [
  {
    key: 'balance',
    label: 'Balance',
    type: 'number',
    render: value => (
      <span
        className={cn(
          value < 0 && 'text-red-500 font-semibold',
          value > 1000 && 'text-green-500 font-semibold'
        )}
      >
        ${value.toLocaleString()}
      </span>
    ),
  },
];
```

## API Reference

### DataGridColumn<T>

```typescript
interface DataGridColumn<T> {
  key: string; // Data key
  label: string; // Display label
  sortable?: boolean; // Enable sorting
  filterable?: boolean; // Enable filtering
  editable?: boolean; // Enable inline editing
  readonly?: boolean; // Prevent editing
  required?: boolean; // Required for creation
  width?: string; // Column width (CSS)
  type?: ColumnType; // Input type
  isRelation?: boolean; // Foreign key relation
  render?: (value: any, row: T) => ReactNode;
}

type ColumnType =
  | 'text'
  | 'number'
  | 'email'
  | 'url'
  | 'date'
  | 'boolean'
  | 'created_date';
```

### DataGridAction<T>

```typescript
interface DataGridAction<T> {
  label: string; // Action label
  icon?: ReactNode; // Icon element
  onClick?: (row: T | T[]) => void | Promise<void>;
  variant?: 'default' | 'destructive';
  separator?: boolean; // Add separator after
  hidden?: (row: T) => boolean; // Conditional visibility
}
```

### FmDataGridProps<T>

```typescript
interface FmDataGridProps<T> {
  // Data
  data: T[];
  columns: DataGridColumn<T>[];

  // Actions
  actions?: DataGridAction<T>[];
  contextMenuActions?: DataGridAction<T>[];
  onUpdate?: (item: T) => Promise<void>;
  onCreate?: (item: Partial<T>) => Promise<void>;
  onBatchDelete?: (items: T[]) => Promise<void>;
  onCreateButtonClick?: () => void;
  onHideColumn?: (columnKey: string) => void;

  // Configuration
  resourceName?: string;
  createButtonLabel?: string;
  pageSize?: number;
  loading?: boolean;
  className?: string;

  // Features
  enableVirtualization?: boolean;
  enableExport?: boolean;
  exportFilename?: string;
  estimateRowSize?: number;
  toolbarActions?: ReactNode;
}
```

### GroupConfig

```typescript
interface GroupConfig {
  columnKey: string;
  aggregations?: {
    columnKey: string;
    type: AggregationType;
  }[];
}

type AggregationType = 'count' | 'sum' | 'avg' | 'min' | 'max';
```

### FilterGroup

```typescript
interface FilterGroup {
  logic: 'AND' | 'OR';
  rules: FilterRule[];
}

interface FilterRule {
  columnKey: string;
  operator: FilterOperator;
  value: string;
}

type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'greater_or_equal'
  | 'less_than'
  | 'less_or_equal'
  | 'is_empty'
  | 'is_not_empty';
```

## Best Practices

### 1. Performance

```tsx
// Use memoization for large datasets
const columns = useMemo(() => [...], []);
const actions = useMemo(() => [...], []);

// Enable virtualization for large lists
<FmDataGrid
  data={largeDataset}
  enableVirtualization={true}
/>

// Limit page size
<FmDataGrid
  data={data}
  pageSize={25} // Don't use 100+ without virtualization
/>
```

### 2. Type Safety

```tsx
// Define strong types
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

// Use typed components
<FmDataGrid<User>
  data={users}
  columns={columns}
  onUpdate={async (user: User) => {
    // Full type safety
  }}
/>;
```

### 3. Error Handling

```tsx
<FmDataGrid
  data={data}
  columns={columns}
  onUpdate={async item => {
    try {
      await api.update(item);
    } catch (error) {
      toast.error('Update failed');
      throw error; // Re-throw to trigger grid error handling
    }
  }}
/>
```

### 4. Loading States

```tsx
const [loading, setLoading] = useState(false);

<FmDataGrid
  data={data}
  columns={columns}
  loading={loading}
  onCreate={async item => {
    setLoading(true);
    try {
      await api.create(item);
    } finally {
      setLoading(false);
    }
  }}
/>;
```

## Examples

See `/docs/examples/` for full working examples:

- Basic CRUD operations
- Advanced filtering and grouping
- Custom rendering and formatting
- Integration with Supabase
- Real-time updates with subscriptions

## Troubleshooting

### Grid not rendering

- Check that `data` is an array
- Verify `columns` have valid `key` properties
- Ensure data objects have keys matching column keys

### Editing not working

- Set `editable: true` on columns
- Provide `onUpdate` handler
- Check `readonly` is not set

### Performance issues

- Enable virtualization for >100 rows
- Reduce page size
- Memoize columns and actions
- Debounce search/filter inputs

### State not persisting

- Verify `persistenceKey` is unique
- Check localStorage is enabled
- Clear browser cache if needed

## Support

For issues, questions, or feature requests:

- GitHub Issues: [force-majeure-webapp/issues]
- Documentation: `/docs/`
- Code Examples: `/docs/examples/`

/**
 * @features/data-grid
 * 
 * A modular, type-safe, and highly configurable data grid system for React applications.
 * Built with hooks and composition for maximum flexibility and reusability.
 * 
 * @example Basic Usage
 * ```tsx
 * import { DataGrid, useDataGridConfig } from '@features/data-grid';
 * 
 * function MyGrid() {
 *   const config = useDataGridConfig({
 *     data: myData,
 *     columns: [
 *       { key: 'name', label: 'Name', sortable: true, editable: true },
 *       { key: 'email', label: 'Email', type: 'email' }
 *     ],
 *     features: {
 *       sorting: { defaultSort: { column: 'name', direction: 'asc' } },
 *       filtering: { searchable: true },
 *       pagination: { pageSize: 25 },
 *       selection: { enabled: true, mode: 'multiple' }
 *     },
 *     toolbar: { title: 'My Data', search: true },
 *     rowActions: [
 *       { label: 'Edit', onClick: handleEdit },
 *       { label: 'Delete', onClick: handleDelete, variant: 'danger' }
 *     ]
 *   });
 *   
 *   return <DataGrid config={config} />;
 * }
 * ```
 */

// Main component
export { DataGrid } from './components/DataGrid';

// Hooks
export { useDataGrid } from './hooks/useDataGrid';
export { useDataGridConfig } from './hooks/useDataGridConfig';
export { useSorting } from './hooks/useSorting';
export { useFiltering } from './hooks/useFiltering';
export { usePagination } from './hooks/usePagination';
export { useSelection } from './hooks/useSelection';
export { useEditing } from './hooks/useEditing';
export { useCreation } from './hooks/useCreation';

// Context
export { DataGridProvider, useDataGridContext } from './context/DataGridContext';

// Types
export type {
  DataGridConfig,
  DataGridState,
  ColumnDef,
  RowAction,
  BulkAction,
  ToolbarConfig,
  SortingState,
  SortingOptions,
  FilteringState,
  FilteringOptions,
  PaginationState,
  PaginationOptions,
  SelectionState,
  SelectionOptions,
  EditingState,
  CreationState,
} from './types';

// Components (for advanced customization)
export { DataGridHeader } from './components/Header/DataGridHeader';
export { DataGridBody } from './components/Body/DataGridBody';
export { DataGridRow } from './components/Body/DataGridRow';
export { DataGridCell } from './components/Body/DataGridCell';
export { DataGridToolbar } from './components/Toolbar/DataGridToolbar';
export { DataGridFooter } from './components/Footer/DataGridFooter';

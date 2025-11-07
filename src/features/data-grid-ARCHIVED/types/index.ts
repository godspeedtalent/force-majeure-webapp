import { ReactNode } from 'react';

/**
 * Column definition for data grid
 */
export interface ColumnDef<TData = any> {
  /** Unique identifier for the column */
  key: string;
  /** Display label for the column header */
  label: string;
  /** Whether the column can be sorted */
  sortable?: boolean;
  /** Whether the column can be filtered */
  filterable?: boolean;
  /** Whether the column can be edited inline */
  editable?: boolean;
  /** Mark field as readonly (cannot be edited) */
  readonly?: boolean;
  /** Mark field as required for new row creation */
  required?: boolean;
  /** Custom render function for cell content */
  render?: (value: any, row: TData) => ReactNode;
  /** Column width (CSS value) */
  width?: string;
  /** Mark this column as a foreign key relation */
  isRelation?: boolean;
  /** Input type for editing */
  type?: 'text' | 'number' | 'email' | 'url' | 'date' | 'boolean' | 'created_date';
  /** Accessor function to get value from row data */
  accessor?: keyof TData | ((row: TData) => any);
}

/**
 * Sort state
 */
export interface SortState {
  column: string | null;
  direction: 'asc' | 'desc';
}

/**
 * Sorting configuration options
 */
export interface SortingOptions {
  /** Initial sort state */
  defaultSort?: SortState;
  /** Enable multi-column sorting */
  multiSort?: boolean;
}

/**
 * Sorting state and actions
 */
export interface SortingState {
  /** Current sort column */
  sortColumn: string | null;
  /** Current sort direction */
  sortDirection: 'asc' | 'desc';
  /** Toggle sort on a column */
  handleSort: (columnKey: string) => void;
  /** Clear all sorting */
  clearSort: () => void;
  /** Sort data based on current state */
  sortData: <T>(data: T[]) => T[];
}

/**
 * Filtering configuration options
 */
export interface FilteringOptions {
  /** Enable global search across all columns */
  searchable?: boolean;
  /** Columns to include in search */
  searchColumns?: string[];
  /** Search placeholder text */
  searchPlaceholder?: string;
}

/**
 * Filtering state and actions
 */
export interface FilteringState {
  /** Global search query */
  searchQuery: string;
  /** Column-specific filters */
  columnFilters: Record<string, string>;
  /** Update search query */
  setSearchQuery: (query: string) => void;
  /** Update column filter */
  setColumnFilter: (columnKey: string, value: string) => void;
  /** Clear all filters */
  clearFilters: () => void;
  /** Filter data based on current state */
  filterData: <T>(data: T[], columns: ColumnDef<T>[]) => T[];
}

/**
 * Pagination configuration options
 */
export interface PaginationOptions {
  /** Number of rows per page */
  pageSize?: number;
  /** Available page size options */
  pageSizeOptions?: number[];
  /** Enable pagination */
  enabled?: boolean;
}

/**
 * Pagination state and actions
 */
export interface PaginationState {
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Rows per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
  /** Available page size options */
  pageSizeOptions: number[];
  /** Whether pagination is enabled */
  enabled: boolean;
  /** Go to specific page */
  goToPage: (page: number) => void;
  /** Go to next page */
  nextPage: () => void;
  /** Go to previous page */
  prevPage: () => void;
  /** Change page size */
  setPageSize: (size: number) => void;
  /** Paginate data based on current state */
  paginateData: <T>(data: T[]) => T[];
}

/**
 * Selection configuration options
 */
export interface SelectionOptions {
  /** Enable row selection */
  enabled?: boolean;
  /** Selection mode */
  mode?: 'single' | 'multiple';
  /** Callback when selection changes */
  onSelectionChange?: (selectedRows: Set<number>) => void;
}

/**
 * Selection state and actions
 */
export interface SelectionState {
  /** Set of selected row indices */
  selectedRows: Set<number>;
  /** Whether selection is enabled */
  enabled: boolean;
  /** Selection mode */
  mode: 'single' | 'multiple';
  /** Last selected row index for shift-select */
  lastSelectedIndex: number | null;
  /** Select/deselect a row */
  toggleRow: (index: number, event?: React.MouseEvent) => void;
  /** Select all rows */
  selectAll: () => void;
  /** Clear selection */
  clearSelection: () => void;
  /** Check if all rows are selected */
  isAllSelected: (totalRows: number) => boolean;
  /** Get selected row data */
  getSelectedData: <T>(data: T[]) => T[];
}

/**
 * Row action definition
 */
export interface RowAction<TData = any> {
  /** Action label */
  label: string;
  /** Action icon (lucide icon name or component) */
  icon?: ReactNode | string;
  /** Action callback */
  onClick: (row: TData, index: number) => void | Promise<void>;
  /** Whether the action is disabled */
  disabled?: (row: TData) => boolean;
  /** Action variant/style */
  variant?: 'default' | 'danger' | 'success' | 'warning';
  /** Show action in dropdown menu only */
  menuOnly?: boolean;
}

/**
 * Bulk action definition (operates on multiple rows)
 */
export interface BulkAction<TData = any> {
  /** Action label */
  label: string;
  /** Action icon */
  icon?: ReactNode | string;
  /** Action callback with selected rows */
  onClick: (selectedRows: TData[]) => void | Promise<void>;
  /** Whether the action is disabled */
  disabled?: boolean;
  /** Action variant/style */
  variant?: 'default' | 'danger' | 'success' | 'warning';
}

/**
 * Toolbar configuration
 */
export interface ToolbarConfig {
  /** Toolbar title */
  title?: string;
  /** Show search bar */
  search?: boolean;
  /** Search placeholder text */
  searchPlaceholder?: string;
  /** Show filter controls */
  filters?: boolean;
  /** Custom actions/buttons in toolbar */
  actions?: ReactNode;
  /** Show export button */
  showExport?: boolean;
}

/**
 * Main data grid configuration
 */
export interface DataGridConfig<TData = any> {
  /** Data to display */
  data: TData[];
  /** Column definitions */
  columns: ColumnDef<TData>[];
  /** Sorting configuration */
  features?: {
    sorting?: SortingOptions;
    filtering?: FilteringOptions;
    pagination?: PaginationOptions;
    selection?: SelectionOptions;
  };
  /** Toolbar configuration */
  toolbar?: ToolbarConfig;
  /** Row actions (per-row operations) */
  rowActions?: RowAction<TData>[];
  /** Bulk actions (multi-row operations) */
  bulkActions?: BulkAction<TData>[];
  /** Loading state */
  loading?: boolean;
  /** Custom CSS class */
  className?: string;
  /** Callback when a cell is updated */
  onUpdate?: (row: TData, columnKey: string, newValue: any) => Promise<void>;
  /** Callback when a new row is created */
  onCreate?: (newRow: Partial<TData>) => Promise<void>;
  /** Custom create button click handler */
  onCreateButtonClick?: () => void;
  /** Resource name for display (e.g., "Artist", "Venue") */
  resourceName?: string;
  /** Custom create button label */
  createButtonLabel?: string;
  /** Context menu actions (right-click menu) */
  contextMenuActions?: RowAction<TData>[];
}

/**
 * Complete data grid state (combined from all hooks)
 */
export interface DataGridState<TData = any> {
  /** Processed data (after filtering, sorting, pagination) */
  data: TData[];
  /** Original unprocessed data */
  originalData: TData[];
  /** Column definitions */
  columns: ColumnDef<TData>[];
  /** Sorting state */
  sorting: SortingState;
  /** Filtering state */
  filtering: FilteringState;
  /** Pagination state */
  pagination: PaginationState;
  /** Selection state */
  selection: SelectionState;
  /** Toolbar configuration */
  toolbar?: ToolbarConfig;
  /** Row actions */
  rowActions?: RowAction<TData>[];
  /** Bulk actions */
  bulkActions?: BulkAction<TData>[];
  /** Loading state */
  loading: boolean;
  /** Editing state */
  editing: EditingState;
  /** Row creation state */
  creation: CreationState<TData>;
}

/**
 * Cell editing state
 */
export interface EditingState {
  /** Currently editing cell */
  editingCell: { rowIndex: number; columnKey: string } | null;
  /** Current edit value */
  editValue: string;
  /** Start editing a cell */
  startEdit: (rowIndex: number, columnKey: string, currentValue: any) => void;
  /** Cancel editing */
  cancelEdit: () => void;
  /** Save edited value */
  saveEdit: <T>(row: T, columnKey: string, overrideValue?: any) => Promise<void>;
  /** Update edit value */
  setEditValue: (value: string) => void;
}

/**
 * Row creation state
 */
export interface CreationState<TData = any> {
  /** Whether currently creating a new row */
  isCreating: boolean;
  /** New row data */
  newRowData: Partial<TData>;
  /** Start creating a new row */
  startCreate: () => void;
  /** Cancel row creation */
  cancelCreate: () => void;
  /** Save new row */
  saveCreate: () => Promise<void>;
  /** Update new row field */
  updateNewRowField: (key: string, value: any) => void;
}

/**
 * Drag selection state
 */
export interface DragSelectionState {
  /** Whether in drag mode */
  isDragMode: boolean;
  /** Starting row index for drag */
  dragStartRow: number | null;
  /** Current row index during drag */
  dragCurrentRow: number | null;
  /** Column currently being hovered */
  hoveredColumn: string | null;
  /** Set hovered column */
  setHoveredColumn: (column: string | null) => void;
}

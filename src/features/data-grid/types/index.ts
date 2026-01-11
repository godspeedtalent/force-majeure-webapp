import { ContextMenuAction } from '@/components/common/modals/FmCommonContextMenu';

/**
 * Represents a column configuration for the data grid
 */
/**
 * Option for select-type columns
 */
export interface SelectOption {
  value: string;
  label: string;
}

export interface DataGridColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  readonly?: boolean; // Mark field as readonly (cannot be edited inline or in forms)
  required?: boolean; // Mark field as required for new row creation
  render?: (value: any, row: T) => React.ReactNode;
  filterValue?: (row: T) => string; // Extract searchable string from row for filtering
  width?: string;
  isRelation?: boolean; // Mark this column as a foreign key relation
  isImage?: boolean; // Mark this column as an image (for mobile layout)
  multiline?: boolean; // Use textarea for multiline text editing
  rows?: number; // Number of rows for multiline textarea (default: 3)
  type?:
    | 'text'
    | 'number'
    | 'email'
    | 'url'
    | 'date'
    | 'boolean'
    | 'created_date'
    | 'select'; // Input type for editing
  options?: SelectOption[]; // Options for select type columns
}

/**
 * Re-export ContextMenuAction as DataGridAction for backward compatibility
 */
export type DataGridAction<T = any> = ContextMenuAction<T>;

/**
 * Props for the main FmDataGrid component
 */
export interface FmDataGridProps<T = any> {
  data: T[];
  columns: DataGridColumn<T>[];
  actions?: DataGridAction<T>[];
  contextMenuActions?: DataGridAction<T>[];
  loading?: boolean;
  pageSize?: number;
  className?: string;
  onUpdate?: (row: T, columnKey: string, newValue: any) => Promise<void>;
  onCreate?: (item: Partial<T>) => Promise<void>;
  onCreateButtonClick?: () => void; // Custom handler for create button
  resourceName?: string;
  createButtonLabel?: string;
  onHideColumn?: (columnKey: string) => void; // Callback for hiding a column
}

/**
 * Cell editing state
 */
export interface CellEditState {
  rowIndex: number;
  columnKey: string;
  value: string;
}

/**
 * Configuration for a data grid column (used in configurable grids)
 */
export interface DataGridColumnConfig {
  key: string;
  visible: boolean;
  order: number;
  width?: string;
}

/**
 * Complete configuration for a data grid instance
 */
export interface DataGridConfig {
  columns: DataGridColumnConfig[];
  pageSize?: number;
}

/**
 * Flattened row type for grouped data grids
 */
export type FlattenedRow<T> = 
  | { type: 'group'; groupData: { groupValue: string; items: T[]; count: number }; depth: number }
  | { type: 'data'; row: T; depth: number };

/**
 * Grouped row structure
 */
export interface GroupedRow<T> {
  groupValue: string;
  items: T[];
  count: number;
}

/**
 * Column configuration with extended properties
 */
export interface ColumnConfig {
  key: string;
  visible: boolean;
  order: number;
  width?: number;
  frozen?: boolean;
  customLabel?: string;
  type?:
    | 'text'
    | 'number'
    | 'email'
    | 'url'
    | 'date'
    | 'boolean'
    | 'created_date'
    | 'select';
}

/**
 * Grid configuration with column configs
 */
export interface GridConfig {
  columns: ColumnConfig[];
  pageSize?: number;
}

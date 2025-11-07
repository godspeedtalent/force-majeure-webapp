import { ContextMenuAction } from '../../modals/FmCommonContextMenu';

/**
 * Represents a column configuration for the data grid
 */
export interface DataGridColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  readonly?: boolean; // Mark field as readonly (cannot be edited inline or in forms)
  required?: boolean; // Mark field as required for new row creation
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
  isRelation?: boolean; // Mark this column as a foreign key relation
  type?: 'text' | 'number' | 'email' | 'url' | 'date' | 'boolean' | 'created_date'; // Input type for editing
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
  onUpdate?: (item: T) => Promise<void>;
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

import { DataGridColumn, DataGridAction } from '../../types';
import type { PaginationMode } from '../FmDataGrid';

/**
 * Configuration for which fields to show on mobile cards
 */
export interface MobileCardFieldConfig {
  key: string;
  priority: number; // Lower = more important, shown first
  showLabel: boolean;
  isTitle?: boolean; // If true, renders as card title
  isSubtitle?: boolean; // If true, renders as secondary text
  isImage?: boolean; // If true, renders as featured image in left column
}

/**
 * Props for the mobile data grid container
 */
export interface FmMobileDataGridProps<T = any> {
  data: T[];
  columns: DataGridColumn<T>[];
  actions?: DataGridAction<T>[];
  loading?: boolean;
  className?: string;
  onUpdate?: (item: T, columnKey: string, newValue: any) => Promise<void>;
  resourceName?: string;

  // Persistence
  storageKey?: string; // Unique key for persisting grid state to localStorage

  // Mobile-specific configuration
  cardFieldConfig?: MobileCardFieldConfig[];
  onCardFieldConfigChange?: (config: MobileCardFieldConfig[]) => void;

  // Pagination
  pageSize?: number;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;

  // Filtering
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  columnFilters?: Record<string, string>;
  onColumnFilter?: (columnKey: string, value: string) => void;
  onClearFilters?: () => void;
  activeFilterCount?: number;

  // Sorting
  sortColumn?: string | null;
  sortDirection?: 'asc' | 'desc';
  onSort?: (columnKey: string) => void;

  // Pagination mode
  /** Pagination mode: 'infinite' (default) loads more as you scroll, 'paged' shows traditional pagination */
  paginationMode?: PaginationMode;
}

/**
 * Props for an individual mobile card
 */
export interface FmMobileDataGridCardProps<T = any> {
  row: T;
  columns: DataGridColumn<T>[];
  fieldConfig: MobileCardFieldConfig[];
  onClick?: () => void;
  isSelected?: boolean;
  actions?: DataGridAction<T>[];
}

/**
 * Props for a single field within a card
 */
export interface FmMobileDataGridFieldProps {
  label: string;
  value: React.ReactNode;
  showLabel?: boolean;
  isTitle?: boolean;
  isSubtitle?: boolean;
  className?: string;
}

/**
 * Props for the detail drawer
 */
export interface FmMobileDataGridDetailDrawerProps<T = any> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: T | null;
  columns: DataGridColumn<T>[];
  actions?: DataGridAction<T>[];
  onUpdate?: (item: T, columnKey: string, newValue: any) => Promise<void>;
  resourceName?: string;
}

/**
 * Props for the mobile toolbar/header
 */
export interface FmMobileDataGridToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenFilters: () => void;
  onOpenSort: () => void;
  onOpenColumnConfig: () => void;
  activeFilterCount: number;
  sortColumn?: string | null;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Props for the filter sheet
 */
export interface FmMobileDataGridFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: DataGridColumn[];
  columnFilters: Record<string, string>;
  onColumnFilter: (columnKey: string, value: string) => void;
  onClearFilters: () => void;
}

/**
 * Props for the sort sheet
 */
export interface FmMobileDataGridSortProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: DataGridColumn[];
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  onSort: (columnKey: string) => void;
}

/**
 * Props for column configuration sheet
 */
export interface FmMobileDataGridColumnConfigProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  columns: DataGridColumn[];
  fieldConfig: MobileCardFieldConfig[];
  onFieldConfigChange: (config: MobileCardFieldConfig[]) => void;
}

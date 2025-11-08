/**
 * @features/data-grid
 *
 * Centralized data grid components for Force Majeure
 * All data grid functionality should use these Fm-prefixed components
 */

// Main components
export { FmDataGrid } from './components/FmDataGrid';
export { FmConfigurableDataGrid } from './components/FmConfigurableDataGrid';
export { FmDataGridContextMenu } from './components/FmDataGridContextMenu';
export { FmOrganizationDataGrid } from './components/FmOrganizationDataGrid';
export { FmUserDataGrid } from './components/FmUserDataGrid';
export { FmAdvancedFilterDialog } from './components/FmAdvancedFilterDialog';
export { FmDataGridExportDialog } from './components/FmDataGridExportDialog';
export { FmDataGridGroupDialog } from './components/FmDataGridGroupDialog';
export { FmBulkEditDialog } from './components/FmBulkEditDialog';
export type { ExportFormat } from './components/FmDataGridExportDialog';

// Hooks
export {
  useDataGridState,
  useDataGridFilters,
  useDataGridSelection,
} from './hooks';
export { useDataGridKeyboardNav } from './hooks/useDataGridKeyboardNav';
export { useDataGridPersistence } from './hooks/useDataGridPersistence';
export { useDataGridVirtualization } from './hooks/useDataGridVirtualization';
export type {
  DataGridState,
  DataGridStateActions,
  UseDataGridStateReturn,
  DataGridFiltersState,
  DataGridFiltersActions,
  UseDataGridFiltersReturn,
  DataGridSelectionState,
  DataGridSelectionActions,
  UseDataGridSelectionReturn,
} from './hooks';
export type { UseDataGridKeyboardNavReturn } from './hooks/useDataGridKeyboardNav';
export type { UseDataGridPersistenceReturn } from './hooks/useDataGridPersistence';
export type { UseDataGridVirtualizationReturn } from './hooks/useDataGridVirtualization';

// Types
export type {
  DataGridColumn,
  DataGridAction,
  FmDataGridProps,
  CellEditState,
  DataGridColumnConfig,
  DataGridConfig,
} from './types';

// Cell components
export {
  ImageCell,
  DateCell,
  RelationCell,
  RoleCell,
  BadgeListCell,
} from './components/cells';
export type {
  ImageCellProps,
  DateCellProps,
  RelationCellProps,
  RoleCellProps,
  BadgeListCellProps,
} from './components/cells';

// Utils
export { DataGridColumns } from './utils';
export {
  isRelationField,
  getRelationConfig,
  RELATION_MAPPING,
} from './utils/dataGridRelations';
export { applyAdvancedFilters } from './utils/advancedFilters';
export {
  exportData,
  exportToCSV,
  exportToTSV,
  exportToJSON,
} from './utils/dataExport';
export {
  groupData,
  flattenGroupedData,
  toggleGroupExpanded,
  formatAggregation,
} from './utils/grouping';
export type {
  FilterOperator,
  FilterLogic,
  FilterRule,
  FilterGroup,
  FilterPreset,
} from './components/FmAdvancedFilterDialog';
export type {
  AggregationType,
  GroupConfig,
  GroupedRow,
  FlattenedRow,
} from './utils/grouping';

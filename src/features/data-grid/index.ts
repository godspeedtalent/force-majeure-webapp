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

// Types
export type {
  DataGridColumn,
  DataGridAction,
  FmDataGridProps,
  CellEditState,
  DataGridColumnConfig,
  DataGridConfig,
} from './types';

// Utils
export { isRelationField, getRelationConfig, RELATION_MAPPING } from './utils/dataGridRelations';

import { Table } from '@/components/common/shadcn/table';
import { DataGridProvider } from '../context/DataGridContext';
import { useDataGrid } from '../hooks/useDataGrid';
import { DataGridConfig } from '../types';
import { DataGridToolbar } from './Toolbar/DataGridToolbar';
import { DataGridHeader } from './Header/DataGridHeader';
import { DataGridBody } from './Body/DataGridBody';
import { DataGridFooter } from './Footer/DataGridFooter';
import { cn } from '@/shared/utils/utils';

interface DataGridProps<TData = any> {
  config: DataGridConfig<TData>;
}

/**
 * Main DataGrid component
 * This is the primary entry point for using the data grid system.
 * 
 * @example
 * ```tsx
 * import { DataGrid } from '@features/data-grid';
 * 
 * function MyComponent() {
 *   const config = {
 *     data: myData,
 *     columns: [
 *       { key: 'name', label: 'Name', sortable: true },
 *       { key: 'email', label: 'Email' }
 *     ],
 *     features: {
 *       sorting: { defaultSort: { column: 'name', direction: 'asc' } },
 *       pagination: { pageSize: 25 },
 *       selection: { enabled: true, mode: 'multiple' }
 *     },
 *     toolbar: { title: 'Users', search: true }
 *   };
 *   
 *   return <DataGrid config={config} />;
 * }
 * ```
 */
export function DataGrid<TData>({ config }: DataGridProps<TData>) {
  const gridState = useDataGrid(config);

  return (
    <DataGridProvider value={gridState}>
      <div className={cn('data-grid rounded-md border bg-background', config.className)}>
        {config.toolbar && <DataGridToolbar />}
        
        <div className="relative overflow-x-auto">
          {gridState.loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 border-4 border-fm-gold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <Table>
              <DataGridHeader />
              <DataGridBody />
            </Table>
          )}
        </div>

        {config.features?.pagination && <DataGridFooter />}
      </div>
    </DataGridProvider>
  );
}

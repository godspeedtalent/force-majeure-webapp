import { useMemo } from 'react';
import { DataGridConfig, DataGridState } from '../types';
import { useSorting } from './useSorting';
import { useFiltering } from './useFiltering';
import { usePagination } from './usePagination';
import { useSelection } from './useSelection';
import { useEditing } from './useEditing';
import { useCreation } from './useCreation';

/**
 * Main composable hook that combines all data grid functionality
 * This is the primary hook that processes data and returns the complete grid state
 */
export function useDataGrid<TData>(config: DataGridConfig<TData>): DataGridState<TData> {
  const {
    data,
    columns,
    features,
    toolbar,
    rowActions,
    bulkActions,
    loading = false,
    onUpdate,
    onCreate,
    resourceName = 'Resource',
  } = config;

  // Initialize feature hooks
  const sorting = useSorting(features?.sorting);
  const filtering = useFiltering(features?.filtering);
  
  // Process data through filtering and sorting first to get accurate count
  const filteredData = useMemo(() => {
    return filtering.filterData(data, columns);
  }, [data, columns, filtering]);

  const sortedData = useMemo(() => {
    return sorting.sortData(filteredData);
  }, [filteredData, sorting]);

  // Pagination needs the filtered+sorted count
  const pagination = usePagination(sortedData.length, features?.pagination);

  // Selection operates on current page
  const paginatedData = useMemo(() => {
    return pagination.paginateData(sortedData);
  }, [sortedData, pagination]);

  const selection = useSelection(paginatedData.length, features?.selection);
  
  // Editing and creation hooks
  const editing = useEditing<TData>(onUpdate, resourceName);
  const creation = useCreation<TData>(onCreate, resourceName);

  return {
    data: paginatedData,
    originalData: data,
    columns,
    sorting,
    filtering,
    pagination,
    selection,
    toolbar,
    rowActions,
    bulkActions,
    loading,
    editing,
    creation,
  };
}

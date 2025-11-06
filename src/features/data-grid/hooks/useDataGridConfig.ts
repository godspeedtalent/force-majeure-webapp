import { useMemo } from 'react';
import { DataGridConfig } from '../types';

/**
 * Helper hook for creating and validating data grid configuration
 * Provides type-safe config creation with defaults
 * 
 * @example
 * ```tsx
 * const config = useDataGridConfig<User>({
 *   data: users,
 *   columns: [...],
 *   features: { pagination: { pageSize: 25 } }
 * });
 * ```
 */
export function useDataGridConfig<TData>(
  config: DataGridConfig<TData>
): DataGridConfig<TData> {
  return useMemo(() => {
    // Apply defaults
    const defaults: Partial<DataGridConfig<TData>> = {
      loading: false,
      resourceName: 'Resource',
      features: {
        sorting: {},
        filtering: { searchable: true },
        pagination: { pageSize: 10, enabled: true },
        selection: { enabled: false },
        ...config.features,
      },
    };

    return {
      ...defaults,
      ...config,
      features: {
        ...defaults.features,
        ...config.features,
      },
    } as DataGridConfig<TData>;
  }, [config]);
}

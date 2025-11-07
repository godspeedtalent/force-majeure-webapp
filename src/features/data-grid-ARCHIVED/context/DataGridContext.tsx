import React, { createContext, useContext } from 'react';
import { DataGridState } from '../types';

/**
 * Context for sharing data grid state between components
 */
const DataGridContext = createContext<DataGridState<any> | null>(null);

/**
 * Provider component for data grid context
 */
export function DataGridProvider<TData>({
  children,
  value,
}: {
  children: React.ReactNode;
  value: DataGridState<TData>;
}) {
  return <DataGridContext.Provider value={value}>{children}</DataGridContext.Provider>;
}

/**
 * Hook to access data grid context
 * Throws an error if used outside DataGridProvider
 */
export function useDataGridContext<TData = any>(): DataGridState<TData> {
  const context = useContext(DataGridContext);
  if (!context) {
    throw new Error('useDataGridContext must be used within a DataGridProvider');
  }
  return context as DataGridState<TData>;
}

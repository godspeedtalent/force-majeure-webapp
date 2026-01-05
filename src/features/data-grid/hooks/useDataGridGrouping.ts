import { useState, useCallback } from 'react';
import {
  groupData,
  flattenGroupedData,
  toggleGroupExpanded,
  type GroupConfig,
  type GroupedRow,
  type FlattenedRow,
} from '../utils/grouping';
import { DataGridColumn } from '../components/FmDataGrid';

interface UseDataGridGroupingOptions<T extends Record<string, unknown>> {
  data: T[];
  columns: DataGridColumn<T>[];
  onPageReset?: () => void;
}

interface UseDataGridGroupingReturn<T extends Record<string, unknown>> {
  groupConfig: GroupConfig | null;
  groupedRows: GroupedRow<T>[];
  expandedGroups: Set<string>;
  /** Get flattened display data (grouped or regular) */
  getDisplayData: (paginatedData: T[]) => FlattenedRow<T>[];
  handleApplyGrouping: (config: GroupConfig) => void;
  handleClearGrouping: () => void;
  handleToggleGroup: (groupValue: string) => void;
}

/**
 * Hook for managing data grid grouping functionality
 * Handles group state, expansion, and data transformation
 */
export function useDataGridGrouping<T extends Record<string, unknown>>({
  data,
  columns,
  onPageReset,
}: UseDataGridGroupingOptions<T>): UseDataGridGroupingReturn<T> {
  const [groupConfig, setGroupConfig] = useState<GroupConfig | null>(null);
  const [groupedRows, setGroupedRows] = useState<GroupedRow<T>[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const handleApplyGrouping = useCallback((config: GroupConfig) => {
    setGroupConfig(config);
    // Cast to satisfy the groupData function signature
    const grouped = groupData(data as Record<string, unknown>[], config, columns as DataGridColumn<Record<string, unknown>>[]) as GroupedRow<T>[];
    setGroupedRows(grouped);
    const allGroupKeys = grouped.map(g => g.groupValue);
    setExpandedGroups(new Set(allGroupKeys));
    onPageReset?.();
  }, [data, columns, onPageReset]);

  const handleClearGrouping = useCallback(() => {
    setGroupConfig(null);
    setGroupedRows([]);
    setExpandedGroups(new Set());
  }, []);

  const handleToggleGroup = useCallback((groupValue: string) => {
    setGroupedRows(prev => {
      const updated = toggleGroupExpanded(prev as GroupedRow<Record<string, unknown>>[], groupValue);
      return updated as GroupedRow<T>[];
    });
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupValue)) next.delete(groupValue);
      else next.add(groupValue);
      return next;
    });
  }, []);

  const getDisplayData = useCallback((paginatedData: T[]): FlattenedRow<T>[] => {
    if (groupConfig && groupedRows.length > 0) {
      return flattenGroupedData(groupedRows as GroupedRow<Record<string, unknown>>[]) as FlattenedRow<T>[];
    }
    return paginatedData.map(row => ({ type: 'data' as const, row, depth: 0 }));
  }, [groupConfig, groupedRows]);

  return {
    groupConfig,
    groupedRows,
    expandedGroups,
    getDisplayData,
    handleApplyGrouping,
    handleClearGrouping,
    handleToggleGroup,
  };
}

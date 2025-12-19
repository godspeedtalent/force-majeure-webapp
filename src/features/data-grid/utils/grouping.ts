import type { DataGridColumn } from '../components/FmDataGrid';

export type AggregationType = 'count' | 'sum' | 'avg' | 'min' | 'max';

export interface GroupConfig {
  columnKey: string;
  aggregations?: {
    columnKey: string;
    type: AggregationType;
  }[];
}

export interface GroupedRow<T = any> {
  isGroup: true;
  groupValue: string;
  groupKey: string;
  count: number;
  rows: T[];
  aggregations?: Record<string, number>;
  isExpanded: boolean;
}

export interface FlattenedRow<T = any> {
  type: 'group' | 'data';
  row: GroupedRow<T> | T;
  depth: number;
}

/**
 * Group data by a column and optionally calculate aggregations
 */
export function groupData<T extends Record<string, any>>(
  data: T[],
  config: GroupConfig,
  _columns: DataGridColumn<T>[]
): GroupedRow<T>[] {
  const { columnKey, aggregations = [] } = config;

  // Group data by column value
  const groups = new Map<string, T[]>();

  data.forEach(row => {
    const value = row[columnKey];
    const groupKey = String(value ?? '(Empty)');

    if (!groups.has(groupKey)) {
      groups.set(groupKey, []);
    }
    groups.get(groupKey)!.push(row);
  });

  // Create grouped rows with aggregations
  const groupedRows: GroupedRow<T>[] = [];

  groups.forEach((rows, groupKey) => {
    const aggregationResults: Record<string, number> = {};

    // Calculate aggregations
    aggregations.forEach(agg => {
      const values = rows
        .map(row => row[agg.columnKey])
        .filter(val => val != null && !isNaN(Number(val)))
        .map(val => Number(val));

      switch (agg.type) {
        case 'count':
          aggregationResults[agg.columnKey] = rows.length;
          break;
        case 'sum':
          aggregationResults[agg.columnKey] = values.reduce(
            (sum, val) => sum + val,
            0
          );
          break;
        case 'avg':
          aggregationResults[agg.columnKey] =
            values.length > 0
              ? values.reduce((sum, val) => sum + val, 0) / values.length
              : 0;
          break;
        case 'min':
          aggregationResults[agg.columnKey] =
            values.length > 0 ? Math.min(...values) : 0;
          break;
        case 'max':
          aggregationResults[agg.columnKey] =
            values.length > 0 ? Math.max(...values) : 0;
          break;
      }
    });

    groupedRows.push({
      isGroup: true,
      groupValue: groupKey,
      groupKey,
      count: rows.length,
      rows,
      aggregations: aggregationResults,
      isExpanded: false,
    });
  });

  // Sort groups by count (descending)
  groupedRows.sort((a, b) => b.count - a.count);

  return groupedRows;
}

/**
 * Flatten grouped data for rendering (handles expand/collapse)
 */
export function flattenGroupedData<T extends Record<string, any>>(
  groupedRows: GroupedRow<T>[]
): FlattenedRow<T>[] {
  const flattened: FlattenedRow<T>[] = [];

  groupedRows.forEach(group => {
    // Add group row
    flattened.push({
      type: 'group',
      row: group,
      depth: 0,
    });

    // Add data rows if expanded
    if (group.isExpanded) {
      group.rows.forEach(dataRow => {
        flattened.push({
          type: 'data',
          row: dataRow,
          depth: 1,
        });
      });
    }
  });

  return flattened;
}

/**
 * Toggle expand/collapse state for a group
 */
export function toggleGroupExpanded<T extends Record<string, any>>(
  groupedRows: GroupedRow<T>[],
  groupKey: string
): GroupedRow<T>[] {
  return groupedRows.map(group =>
    group.groupKey === groupKey
      ? { ...group, isExpanded: !group.isExpanded }
      : group
  );
}

/**
 * Format aggregation value for display
 */
export function formatAggregation(
  value: number,
  type: AggregationType
): string {
  switch (type) {
    case 'count':
      return value.toString();
    case 'sum':
      return value.toFixed(2);
    case 'avg':
      return value.toFixed(2);
    case 'min':
    case 'max':
      return value.toFixed(2);
    default:
      return value.toString();
  }
}

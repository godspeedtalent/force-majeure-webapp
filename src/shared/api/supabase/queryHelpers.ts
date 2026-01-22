/**
 * Type-safe Supabase query helpers for dynamic table operations
 *
 * These helpers provide type-safe alternatives to scattered `as any` casts when
 * working with dynamic table names in Supabase queries.
 *
 * Note: When table names are only known at runtime, type assertions are unavoidable.
 * These helpers centralize and document those assertions.
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

/**
 * Union type of all public table names in the database
 */
export type TableName = keyof Database['public']['Tables'];

/**
 * Get the Row type for a given table name
 */
export type TableRow<T extends TableName> = Database['public']['Tables'][T]['Row'];

/**
 * Filter operators supported by Supabase
 */
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'is' | 'in' | 'not' | 'ilike' | 'like';

/**
 * A type-safe filter definition
 */
export interface QueryFilter {
  column: string;
  operator: FilterOperator;
  value: unknown;
}

/**
 * Generic query result type for when the exact table type isn't known at compile time
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GenericRow = Record<string, any>;

/**
 * Create a select query for a table with dynamic name
 *
 * This function provides a centralized way to query tables when the table name
 * is only known at runtime. The type assertion is documented and centralized here.
 *
 * @example
 * ```ts
 * const { data } = await createDynamicQuery('artists', 'id, name')
 *   .ilike('name', '%search%')
 *   .limit(10);
 * ```
 */
export function createDynamicQuery(tableName: string, selectFields: string) {
  // Type assertion is necessary for dynamic table names
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return supabase.from(tableName as any).select(selectFields);
}

/**
 * Apply a single filter to a query builder
 *
 * @param query - The Supabase query builder
 * @param filter - The filter to apply
 * @returns The query builder with the filter applied
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyFilter(query: any, filter: QueryFilter): any {
  const { column, operator, value } = filter;

  switch (operator) {
    case 'eq':
      return query.eq(column, value);
    case 'neq':
      return query.neq(column, value);
    case 'gt':
      return query.gt(column, value);
    case 'gte':
      return query.gte(column, value);
    case 'lt':
      return query.lt(column, value);
    case 'lte':
      return query.lte(column, value);
    case 'is':
      return query.is(column, value as boolean | null);
    case 'in':
      return query.in(column, value as unknown[]);
    case 'not':
      return query.not(column, 'is', value);
    case 'ilike':
      return query.ilike(column, value as string);
    case 'like':
      return query.like(column, value as string);
    default:
      return query;
  }
}

/**
 * Apply multiple filters to a query builder
 *
 * @param query - The Supabase query builder
 * @param filters - Array of filters to apply
 * @returns The query builder with all filters applied
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyFilters(query: any, filters: QueryFilter[]): any {
  return filters.reduce((q, filter) => applyFilter(q, filter), query);
}

/**
 * Safely cast a generic row to a specific type
 *
 * Use this when you know the structure of the data but TypeScript doesn't.
 * This is still an assertion, but it's explicit and documented.
 */
export function castRow<T>(row: GenericRow): T {
  return row as T;
}

/**
 * Safely cast an array of generic rows to a specific type
 */
export function castRows<T>(rows: GenericRow[]): T[] {
  return rows as T[];
}

/**
 * Type guard to check if a value is an array
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

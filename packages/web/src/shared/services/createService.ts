import { supabase } from '@force-majeure/shared';
import { logger } from '@force-majeure/shared';

/**
 * Generic Service Factory
 *
 * Creates standardized CRUD operations for Supabase tables.
 * Eliminates boilerplate by providing consistent patterns for:
 * - Error handling with structured logging
 * - PGRST116 (not found) handling
 * - Type-safe returns
 *
 * Usage:
 * ```typescript
 * const baseService = createService<Venue, CreateVenueData, VenueFilters>({
 *   tableName: 'venues',
 *   serviceName: 'venueService',
 *   defaultSelect: 'id, name, address',
 *   defaultOrder: { column: 'name', ascending: true },
 * });
 *
 * export const venueService = {
 *   ...baseService,
 *   // Custom methods:
 *   async searchVenues(query: string) { ... },
 * };
 * ```
 */

export interface ServiceConfig {
  /** Supabase table name */
  tableName: string;
  /** Service name for logging context */
  serviceName: string;
  /** Default select columns (default: '*') */
  defaultSelect?: string;
  /** Default ordering */
  defaultOrder?: { column: string; ascending: boolean };
}

export interface BaseService<T, CreateData> {
  /** Fetch all records */
  getAll(): Promise<T[]>;
  /** Fetch a single record by ID, returns null if not found */
  getById(id: string): Promise<T | null>;
  /** Create a new record */
  create(data: CreateData): Promise<T>;
  /** Update an existing record */
  update(id: string, data: Partial<CreateData>): Promise<T>;
  /** Delete a record */
  delete(id: string): Promise<void>;
  /** Count records with optional filter */
  count(column?: string, value?: string | number | boolean): Promise<number>;
  /** Check if a record exists */
  exists(id: string): Promise<boolean>;
}

/**
 * Creates a base service with standard CRUD operations
 */
export function createService<T, CreateData>(
  config: ServiceConfig
): BaseService<T, CreateData> {
  const { tableName, serviceName, defaultSelect = '*', defaultOrder } = config;

  return {
    async getAll(): Promise<T[]> {
      let query = supabase.from(tableName).select(defaultSelect);

      if (defaultOrder) {
        query = query.order(defaultOrder.column, { ascending: defaultOrder.ascending });
      }

      const { data, error } = await query;

      if (error) {
        logger.error(`Error fetching ${tableName}`, {
          error: error.message,
          source: serviceName,
        });
        throw error;
      }

      return (data || []) as T[];
    },

    async getById(id: string): Promise<T | null> {
      const { data, error } = await supabase
        .from(tableName)
        .select(defaultSelect)
        .eq('id', id)
        .single();

      if (error) {
        // PGRST116 = no rows returned (not found)
        if (error.code === 'PGRST116') {
          return null;
        }
        logger.error(`Error fetching ${tableName} by ID`, {
          error: error.message,
          source: serviceName,
          id,
        });
        throw error;
      }

      return data as T;
    },

    async create(data: CreateData): Promise<T> {
      const { data: result, error } = await supabase
        .from(tableName)
        .insert([data as Record<string, unknown>])
        .select()
        .single();

      if (error) {
        logger.error(`Error creating ${tableName}`, {
          error: error.message,
          source: serviceName,
        });
        throw error;
      }

      return result as T;
    },

    async update(id: string, data: Partial<CreateData>): Promise<T> {
      const { data: result, error } = await supabase
        .from(tableName)
        .update(data as Record<string, unknown>)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error(`Error updating ${tableName}`, {
          error: error.message,
          source: serviceName,
          id,
        });
        throw error;
      }

      return result as T;
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase.from(tableName).delete().eq('id', id);

      if (error) {
        logger.error(`Error deleting ${tableName}`, {
          error: error.message,
          source: serviceName,
          id,
        });
        throw error;
      }
    },

    async count(column?: string, value?: string | number | boolean): Promise<number> {
      let query = supabase.from(tableName).select('*', { count: 'exact', head: true });

      if (column && value !== undefined) {
        query = query.eq(column, value);
      }

      const { count, error } = await query;

      if (error) {
        logger.error(`Error counting ${tableName}`, {
          error: error.message,
          source: serviceName,
          column,
          value,
        });
        return 0;
      }

      return count ?? 0;
    },

    async exists(id: string): Promise<boolean> {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .eq('id', id);

      if (error) {
        logger.error(`Error checking ${tableName} existence`, {
          error: error.message,
          source: serviceName,
          id,
        });
        return false;
      }

      return (count ?? 0) > 0;
    },
  };
}

/**
 * Helper to create a filtered query builder
 * Useful for services that need custom filter logic
 */
export function createFilteredQuery<Filters extends Record<string, unknown>>(
  tableName: string,
  select: string,
  filters: Filters,
  filterMappings: {
    [K in keyof Filters]?: {
      column: string;
      operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike';
    };
  }
) {
  let query = supabase.from(tableName).select(select);

  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null) continue;

    const mapping = filterMappings[key as keyof Filters];
    if (!mapping) continue;

    const { column, operator } = mapping;

    switch (operator) {
      case 'eq':
        query = query.eq(column, value);
        break;
      case 'neq':
        query = query.neq(column, value);
        break;
      case 'gt':
        query = query.gt(column, value);
        break;
      case 'gte':
        query = query.gte(column, value);
        break;
      case 'lt':
        query = query.lt(column, value);
        break;
      case 'lte':
        query = query.lte(column, value);
        break;
      case 'like':
        query = query.like(column, value as string);
        break;
      case 'ilike':
        query = query.ilike(column, value as string);
        break;
    }
  }

  return query;
}

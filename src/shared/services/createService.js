import { supabase } from '@/shared';
import { logger } from '@/shared';
// Helper to get a typed query builder for any table
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getTable = (table) => supabase.from(table);
/**
 * Creates a base service with standard CRUD operations
 */
export function createService(config) {
    const { tableName, serviceName, defaultSelect = '*', defaultOrder } = config;
    return {
        async getAll() {
            let query = getTable(tableName).select(defaultSelect);
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
            return (data || []);
        },
        async getById(id) {
            const { data, error } = await getTable(tableName)
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
            return data;
        },
        async create(data) {
            const { data: result, error } = await getTable(tableName)
                .insert([data])
                .select()
                .single();
            if (error) {
                logger.error(`Error creating ${tableName}`, {
                    error: error.message,
                    source: serviceName,
                });
                throw error;
            }
            return result;
        },
        async update(id, data) {
            const { data: result, error } = await getTable(tableName)
                .update(data)
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
            return result;
        },
        async delete(id) {
            const { error } = await getTable(tableName).delete().eq('id', id);
            if (error) {
                logger.error(`Error deleting ${tableName}`, {
                    error: error.message,
                    source: serviceName,
                    id,
                });
                throw error;
            }
        },
        async count(column, value) {
            let query = getTable(tableName).select('*', { count: 'exact', head: true });
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
        async exists(id) {
            const { count, error } = await getTable(tableName)
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
export function createFilteredQuery(tableName, select, filters, filterMappings) {
    let query = getTable(tableName).select(select);
    for (const [key, value] of Object.entries(filters)) {
        if (value === undefined || value === null)
            continue;
        const mapping = filterMappings[key];
        if (!mapping)
            continue;
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
                query = query.like(column, value);
                break;
            case 'ilike':
                query = query.ilike(column, value);
                break;
        }
    }
    return query;
}

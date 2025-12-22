import { useState, useMemo } from 'react';
/**
 * Hook to manage search and filtering logic for the DataGrid
 * Applies universal search and per-column filters
 */
export function useDataGridFilters({ data, columns, }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [columnFilters, setColumnFilters] = useState({});
    // Apply all filters to data
    const filteredData = useMemo(() => {
        let filtered = [...data];
        // Apply universal search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(row => columns.some(col => {
                const value = row[col.key];
                return value?.toString().toLowerCase().includes(query);
            }));
        }
        // Apply column filters
        Object.entries(columnFilters).forEach(([key, value]) => {
            if (value) {
                const query = value.toLowerCase();
                filtered = filtered.filter(row => {
                    const cellValue = row[key];
                    return cellValue?.toString().toLowerCase().includes(query);
                });
            }
        });
        return filtered;
    }, [data, searchQuery, columns, columnFilters]);
    // Count active filters
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (searchQuery)
            count++;
        count += Object.values(columnFilters).filter(v => v).length;
        return count;
    }, [searchQuery, columnFilters]);
    const hasActiveFilters = activeFilterCount > 0;
    // Update a specific column filter
    const handleColumnFilter = (columnKey, value) => {
        setColumnFilters(prev => ({
            ...prev,
            [columnKey]: value,
        }));
    };
    // Clear all filters
    const clearFilters = () => {
        setSearchQuery('');
        setColumnFilters({});
    };
    // Clear a specific column filter
    const clearColumnFilter = (columnKey) => {
        setColumnFilters(prev => {
            const newFilters = { ...prev };
            delete newFilters[columnKey];
            return newFilters;
        });
    };
    return {
        // State
        searchQuery,
        columnFilters,
        // Actions
        setSearchQuery,
        setColumnFilters,
        handleColumnFilter,
        clearFilters,
        clearColumnFilter,
        // Computed values
        filteredData,
        activeFilterCount,
        hasActiveFilters,
    };
}

import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { FmCommonSearchDropdown, } from './FmCommonSearchDropdown';
import { supabase } from '@/shared';
import { useRecentSelections } from '@/shared';
/**
 * Factory function to create a search dropdown component with common functionality
 *
 * @example
 * ```tsx
 * export const FmArtistSearchDropdown = createSearchDropdown({
 *   tableName: 'artists',
 *   searchField: 'name',
 *   selectFields: 'id, name, image_url',
 *   formatLabel: (artist) => artist.name,
 *   renderIcon: (artist) => <img src={artist.image_url} />,
 *   defaultPlaceholder: 'Search for an artist...',
 *   createNewLabel: '+ Create New Artist',
 *   useRecents: true,
 *   recentsKey: 'artists',
 * });
 * ```
 */
export function createSearchDropdown(config) {
    const { tableName, searchField, selectFields, formatLabel, formatValue, valueField = 'id', renderIcon, defaultPlaceholder, createNewLabel, createRoute, useRecents = false, recentsKey, typeIcon, typeTooltip, editRoute, entityTypeName, } = config;
    return function SearchDropdown({ value, onChange, onCreateNew, placeholder = defaultPlaceholder, disabled = false, additionalFilters = [], }) {
        const navigate = useNavigate();
        const [selectedItem, setSelectedItem] = React.useState(null);
        const { recentItems, addRecentItem } = useRecents && recentsKey
            ? useRecentSelections(recentsKey)
            : { recentItems: [], addRecentItem: () => { } };
        // Helper to apply additional filters to a query
        const applyFilters = (queryBuilder) => {
            for (const filter of additionalFilters) {
                switch (filter.operator) {
                    case 'eq':
                        queryBuilder = queryBuilder.eq(filter.column, filter.value);
                        break;
                    case 'neq':
                        queryBuilder = queryBuilder.neq(filter.column, filter.value);
                        break;
                    case 'gt':
                        queryBuilder = queryBuilder.gt(filter.column, filter.value);
                        break;
                    case 'gte':
                        queryBuilder = queryBuilder.gte(filter.column, filter.value);
                        break;
                    case 'lt':
                        queryBuilder = queryBuilder.lt(filter.column, filter.value);
                        break;
                    case 'lte':
                        queryBuilder = queryBuilder.lte(filter.column, filter.value);
                        break;
                    case 'is':
                        queryBuilder = queryBuilder.is(filter.column, filter.value);
                        break;
                    case 'in':
                        queryBuilder = queryBuilder.in(filter.column, filter.value);
                        break;
                    case 'not':
                        queryBuilder = queryBuilder.not(filter.column, 'is', filter.value);
                        break;
                }
            }
            return queryBuilder;
        };
        // Load selected item when value changes
        React.useEffect(() => {
            if (value) {
                supabase
                    .from(tableName)
                    .select(selectFields)
                    .eq(valueField, value)
                    .single()
                    .then(({ data }) => {
                    if (data) {
                        setSelectedItem({ label: formatLabel(data), data: data });
                    }
                });
            }
            else {
                setSelectedItem(null);
            }
        }, [value]);
        // Search handler
        const handleSearch = async (query) => {
            let queryBuilder = supabase.from(tableName).select(selectFields);
            // Apply search filter
            if (typeof searchField === 'function') {
                queryBuilder = queryBuilder.or(searchField(query));
            }
            else {
                queryBuilder = queryBuilder.ilike(searchField, `%${query}%`);
            }
            // Apply additional filters
            queryBuilder = applyFilters(queryBuilder);
            const { data, error } = await queryBuilder.limit(10);
            if (error || !data)
                return [];
            return data.map((item) => ({
                id: formatValue ? formatValue(item) : item.id,
                label: formatLabel(item),
                icon: renderIcon(item),
                data: item,
            }));
        };
        // Recent options handler
        const handleGetRecentOptions = async () => {
            if (!useRecents || recentItems.length === 0)
                return [];
            const { data, error } = await supabase
                .from(tableName)
                .select(selectFields)
                .in(valueField, recentItems.map(item => item.id));
            if (error || !data)
                return [];
            return data.map((item) => ({
                id: formatValue ? formatValue(item) : item.id,
                label: formatLabel(item),
                icon: renderIcon(item),
                data: item,
            }));
        };
        // Change handler
        const handleChange = (newValue, label, data) => {
            onChange(newValue, data);
            if (useRecents && label) {
                addRecentItem(newValue, label);
            }
        };
        // Create new handler - passes returnTo param so create page can return with new entity
        const handleCreateNew = () => {
            if (onCreateNew) {
                onCreateNew();
            }
            else if (createRoute) {
                const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
                navigate(`${createRoute}?returnTo=${returnTo}`);
            }
        };
        return (_jsx(FmCommonSearchDropdown, { onChange: handleChange, onSearch: handleSearch, onGetRecentOptions: handleGetRecentOptions, onCreateNew: createRoute || onCreateNew ? handleCreateNew : undefined, placeholder: placeholder, createNewLabel: createNewLabel, selectedLabel: selectedItem?.label, disabled: disabled, typeIcon: typeIcon, typeTooltip: typeTooltip, selectedValue: value || undefined, editRoute: editRoute, entityTypeName: entityTypeName }));
    };
}

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FmCommonSearchDropdown,
  SearchDropdownOption,
} from './FmCommonSearchDropdown';
import { supabase } from '@force-majeure/shared';
import { useRecentSelections } from '@force-majeure/shared';

/**
 * Configuration for creating a search dropdown component
 */
/** Filter configuration for additional query constraints */
export interface SearchDropdownFilter {
  column: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'is' | 'in' | 'not';
  value: unknown;
}

export interface SearchDropdownConfig<T = any> {
  /** Supabase table name */
  tableName: string;
  /** Field to search against (or custom filter function) */
  searchField: string | ((query: string) => string);
  /** Fields to select from the table */
  selectFields: string;
  /** Format the label for display */
  formatLabel: (item: T) => string;
  /** Format the value to be returned (defaults to item.id) */
  formatValue?: (item: T) => string;
  /** Field to use for value lookups (defaults to 'id') */
  valueField?: string;
  /** Render the icon for the option */
  renderIcon: (item: T) => React.ReactNode;
  /** Default placeholder text */
  defaultPlaceholder: string;
  /** Label for the create new button */
  createNewLabel: string;
  /** Route to navigate to when creating a new item */
  createRoute?: string;
  /** Whether to use recent selections */
  useRecents?: boolean;
  /** Recent selections key */
  recentsKey?: string;
  /** Optional icon representing the entity type */
  typeIcon?: React.ReactNode;
  /** Tooltip text for the type icon */
  typeTooltip?: string;
  /** Route pattern for editing entity (e.g., '/developer/database/artists/edit') - ID will be appended */
  editRoute?: string;
  /** Entity type name for context menu (e.g., 'Artist', 'Venue') */
  entityTypeName?: string;
}

interface SearchDropdownProps<T = any> {
  value?: string | null;
  onChange: (value: string, item?: T) => void;
  onCreateNew?: () => void;
  placeholder?: string;
  disabled?: boolean;
  /** Additional filters to apply to the search query */
  additionalFilters?: SearchDropdownFilter[];
}

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
export function createSearchDropdown<T = any>(config: SearchDropdownConfig<T>) {
  const {
    tableName,
    searchField,
    selectFields,
    formatLabel,
    formatValue,
    valueField = 'id',
    renderIcon,
    defaultPlaceholder,
    createNewLabel,
    createRoute,
    useRecents = false,
    recentsKey,
    typeIcon,
    typeTooltip,
    editRoute,
    entityTypeName,
  } = config;

  return function SearchDropdown({
    value,
    onChange,
    onCreateNew,
    placeholder = defaultPlaceholder,
    disabled = false,
    additionalFilters = [],
  }: SearchDropdownProps<T>) {
    const navigate = useNavigate();
    const [selectedItem, setSelectedItem] = React.useState<{
      label: string;
      data?: T;
    } | null>(null);
    const { recentItems, addRecentItem } =
      useRecents && recentsKey
        ? useRecentSelections(recentsKey)
        : { recentItems: [], addRecentItem: () => {} };

    // Helper to apply additional filters to a query
    const applyFilters = (queryBuilder: any) => {
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
            queryBuilder = queryBuilder.in(filter.column, filter.value as any[]);
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
          .from(tableName as any)
          .select(selectFields)
          .eq(valueField, value)
          .single()
          .then(({ data }) => {
            if (data) {
              setSelectedItem({ label: formatLabel(data as T), data: data as T });
            }
          });
      } else {
        setSelectedItem(null);
      }
    }, [value]);

    // Search handler
    const handleSearch = async (
      query: string
    ): Promise<SearchDropdownOption[]> => {
      let queryBuilder = supabase.from(tableName as any).select(selectFields);

      // Apply search filter
      if (typeof searchField === 'function') {
        queryBuilder = queryBuilder.or(searchField(query));
      } else {
        queryBuilder = queryBuilder.ilike(searchField, `%${query}%`);
      }

      // Apply additional filters
      queryBuilder = applyFilters(queryBuilder);

      const { data, error } = await queryBuilder.limit(10);

      if (error || !data) return [];

      return data.map((item: any) => ({
        id: formatValue ? formatValue(item as T) : item.id,
        label: formatLabel(item as T),
        icon: renderIcon(item as T),
        data: item as T,
      }));
    };

    // Recent options handler
    const handleGetRecentOptions = async (): Promise<
      SearchDropdownOption[]
    > => {
      if (!useRecents || recentItems.length === 0) return [];

      const { data, error } = await supabase
        .from(tableName as any)
        .select(selectFields)
        .in(
          valueField,
          recentItems.map(item => item.id)
        );

      if (error || !data) return [];

      return data.map((item: any) => ({
        id: formatValue ? formatValue(item as T) : item.id,
        label: formatLabel(item as T),
        icon: renderIcon(item as T),
        data: item as T,
      }));
    };

    // Change handler
    const handleChange = (newValue: string, label?: string, data?: any) => {
      onChange(newValue, data as T);
      if (useRecents && label) {
        addRecentItem(newValue, label);
      }
    };

    // Create new handler - passes returnTo param so create page can return with new entity
    const handleCreateNew = () => {
      if (onCreateNew) {
        onCreateNew();
      } else if (createRoute) {
        const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
        navigate(`${createRoute}?returnTo=${returnTo}`);
      }
    };

    return (
      <FmCommonSearchDropdown
        onChange={handleChange}
        onSearch={handleSearch}
        onGetRecentOptions={handleGetRecentOptions}
        onCreateNew={createRoute || onCreateNew ? handleCreateNew : undefined}
        placeholder={placeholder}
        createNewLabel={createNewLabel}
        selectedLabel={selectedItem?.label}
        disabled={disabled}
        typeIcon={typeIcon}
        typeTooltip={typeTooltip}
        selectedValue={value || undefined}
        editRoute={editRoute}
        entityTypeName={entityTypeName}
      />
    );
  };
}

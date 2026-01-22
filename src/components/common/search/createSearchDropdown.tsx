import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FmCommonSearchDropdown,
  SearchDropdownOption,
} from './FmCommonSearchDropdown';
import {
  logger,
  useRecentSelections,
  createDynamicQuery,
  applyFilters as applyQueryFilters,
  type GenericRow,
  type QueryFilter,
} from '@/shared';

/**
 * Configuration for creating a search dropdown component
 */
/** Filter configuration for additional query constraints - re-exported for convenience */
export type SearchDropdownFilter = QueryFilter;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      icon?: React.ReactNode;
      data?: T;
    } | null>(null);
    const { recentItems, addRecentItem } =
      useRecents && recentsKey
        ? useRecentSelections(recentsKey)
        : { recentItems: [], addRecentItem: () => {} };

    // Load selected item when value changes
    React.useEffect(() => {
      if (value) {
        createDynamicQuery(tableName, selectFields)
          .eq(valueField, value)
          .single()
          .then(({ data }) => {
            if (data) {
              setSelectedItem({
                label: formatLabel(data as T),
                icon: renderIcon(data as T),
                data: data as T,
              });
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
      let queryBuilder = createDynamicQuery(tableName, selectFields);

      // Apply search filter
      if (typeof searchField === 'function') {
        queryBuilder = queryBuilder.or(searchField(query));
      } else {
        queryBuilder = queryBuilder.ilike(searchField, `%${query}%`);
      }

      // Apply additional filters
      queryBuilder = applyQueryFilters(queryBuilder, additionalFilters);

      const { data, error } = await queryBuilder.limit(10);

      if (error) {
        logger.error('Search dropdown query failed', {
          source: 'createSearchDropdown',
          tableName,
          query,
          error: error.message,
        });
        return [];
      }

      if (!data) return [];

      logger.debug('Search dropdown results', {
        source: 'createSearchDropdown',
        tableName,
        query,
        resultCount: data.length,
      });

      return (data as T[]).map((item) => ({
        id: formatValue ? formatValue(item) : (item as GenericRow).id as string,
        label: formatLabel(item),
        icon: renderIcon(item),
        data: item,
      }));
    };

    // Recent options handler
    const handleGetRecentOptions = async (): Promise<
      SearchDropdownOption[]
    > => {
      if (!useRecents || recentItems.length === 0) return [];

      const { data, error } = await createDynamicQuery(tableName, selectFields)
        .in(
          valueField,
          recentItems.map(item => item.id)
        );

      if (error || !data) return [];

      return (data as T[]).map((item) => ({
        id: formatValue ? formatValue(item) : (item as GenericRow).id as string,
        label: formatLabel(item),
        icon: renderIcon(item),
        data: item,
      }));
    };

    // Change handler
    const handleChange = (newValue: string, label?: string, data?: unknown) => {
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
        selectedIcon={selectedItem?.icon}
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

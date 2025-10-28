import * as React from 'react';
import { FmCommonSearchDropdown, SearchDropdownOption } from './FmCommonSearchDropdown';
import { supabase } from '@/integrations/supabase/client';
import { useRecentSelections } from '@/shared/hooks/useRecentSelections';

/**
 * Configuration for creating a search dropdown component
 */
export interface SearchDropdownConfig<T = any> {
  /** Supabase table name */
  tableName: string;
  /** Field to search against (or custom filter function) */
  searchField: string | ((query: string) => string);
  /** Fields to select from the table */
  selectFields: string;
  /** Format the label for display */
  formatLabel: (item: T) => string;
  /** Render the icon for the option */
  renderIcon: (item: T) => React.ReactNode;
  /** Default placeholder text */
  defaultPlaceholder: string;
  /** Label for the create new button */
  createNewLabel: string;
  /** Whether to use recent selections */
  useRecents?: boolean;
  /** Recent selections key */
  recentsKey?: string;
}

interface SearchDropdownProps {
  value?: string;
  onChange: (value: string) => void;
  onCreateNew?: () => void;
  placeholder?: string;
  disabled?: boolean;
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
    renderIcon,
    defaultPlaceholder,
    createNewLabel,
    useRecents = false,
    recentsKey,
  } = config;

  return function SearchDropdown({
    value,
    onChange,
    onCreateNew,
    placeholder = defaultPlaceholder,
    disabled = false,
  }: SearchDropdownProps) {
    const [selectedItem, setSelectedItem] = React.useState<{ label: string } | null>(null);
    const { recentItems, addRecentItem } = useRecents && recentsKey
      ? useRecentSelections(recentsKey)
      : { recentItems: [], addRecentItem: () => {} };

    // Load selected item when value changes
    React.useEffect(() => {
      if (value) {
        supabase
          .from(tableName as any)
          .select(selectFields)
          .eq('id', value)
          .single()
          .then(({ data }) => {
            if (data) {
              setSelectedItem({ label: formatLabel(data as T) });
            }
          });
      } else {
        setSelectedItem(null);
      }
    }, [value]);

    // Search handler
    const handleSearch = async (query: string): Promise<SearchDropdownOption[]> => {
      let queryBuilder = supabase
        .from(tableName as any)
        .select(selectFields);

      // Apply search filter
      if (typeof searchField === 'function') {
        queryBuilder = queryBuilder.or(searchField(query));
      } else {
        queryBuilder = queryBuilder.ilike(searchField, `%${query}%`);
      }

      const { data, error } = await queryBuilder.limit(10);

      if (error || !data) return [];

      return data.map((item: any) => ({
        id: item.id,
        label: formatLabel(item as T),
        icon: renderIcon(item as T),
      }));
    };

    // Recent options handler
    const handleGetRecentOptions = async (): Promise<SearchDropdownOption[]> => {
      if (!useRecents || recentItems.length === 0) return [];

      const { data, error } = await supabase
        .from(tableName as any)
        .select(selectFields)
        .in('id', recentItems.map(item => item.id));

      if (error || !data) return [];

      return data.map((item: any) => ({
        id: item.id,
        label: formatLabel(item as T),
        icon: renderIcon(item as T),
      }));
    };

    // Change handler
    const handleChange = (newValue: string, label?: string) => {
      onChange(newValue);
      if (useRecents && label) {
        addRecentItem(newValue, label);
      }
    };

    return (
      <FmCommonSearchDropdown
        onChange={handleChange}
        onSearch={handleSearch}
        onGetRecentOptions={handleGetRecentOptions}
        onCreateNew={onCreateNew}
        placeholder={placeholder}
        createNewLabel={createNewLabel}
        selectedLabel={selectedItem?.label}
        disabled={disabled}
      />
    );
  };
}

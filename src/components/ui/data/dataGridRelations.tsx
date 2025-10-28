import { ReactElement } from 'react';
import { FmCitySearchDropdown } from '../search/FmCitySearchDropdown';
import { FmVenueSearchDropdown } from '../search/FmVenueSearchDropdown';
import { FmArtistSearchDropdown } from '../search/FmArtistSearchDropdown';

export interface RelationConfig {
  component: (props: RelationComponentProps) => ReactElement;
  displayField?: string; // Field to display in the cell when not editing
}

export interface RelationComponentProps {
  value?: string;
  onChange: (value: string) => void;
  onComplete?: () => void;
  disabled?: boolean;
}

/**
 * Maps foreign key column names to their corresponding search dropdown components
 * This allows FmCommonDataGrid to automatically render the appropriate dropdown
 * for relation fields instead of text inputs
 */
export const RELATION_MAPPING: Record<string, RelationConfig> = {
  city_id: {
    component: (props: RelationComponentProps) => (
      <FmCitySearchDropdown
        value={props.value}
        onChange={(value) => {
          props.onChange(value);
          props.onComplete?.();
        }}
        placeholder="Select city..."
        disabled={props.disabled}
      />
    ),
    displayField: 'city', // Will look for row.city to display
  },
  venue_id: {
    component: (props: RelationComponentProps) => (
      <FmVenueSearchDropdown
        value={props.value}
        onChange={(value) => {
          props.onChange(value);
          props.onComplete?.();
        }}
        placeholder="Select venue..."
        disabled={props.disabled}
      />
    ),
    displayField: 'venue',
  },
  artist_id: {
    component: (props: RelationComponentProps) => (
      <FmArtistSearchDropdown
        value={props.value}
        onChange={(value) => {
          props.onChange(value);
          props.onComplete?.();
        }}
        placeholder="Select artist..."
        disabled={props.disabled}
      />
    ),
    displayField: 'artist',
  },
  headliner_id: {
    component: (props: RelationComponentProps) => (
      <FmArtistSearchDropdown
        value={props.value}
        onChange={(value) => {
          props.onChange(value);
          props.onComplete?.();
        }}
        placeholder="Select headliner..."
        disabled={props.disabled}
      />
    ),
    displayField: 'headliner',
  },
};

/**
 * Check if a column is a relation field
 */
export const isRelationField = (columnKey: string): boolean => {
  return columnKey in RELATION_MAPPING;
};

/**
 * Get the relation config for a column
 */
export const getRelationConfig = (columnKey: string): RelationConfig | null => {
  return RELATION_MAPPING[columnKey] || null;
};

import { ReactElement } from 'react';
import { FmCitySearchDropdown } from '@/components/common/search/FmCitySearchDropdown';
import { FmVenueSearchDropdown } from '@/components/common/search/FmVenueSearchDropdown';
import { FmArtistSearchDropdown } from '@/components/common/search/FmArtistSearchDropdown';
import { FmUserSearchDropdown } from '@/components/common/search/FmUserSearchDropdown';
import { FmOrganizationSearchDropdown } from '@/components/common/search/FmOrganizationSearchDropdown';

export interface RelationConfig {
  component: (props: RelationComponentProps) => ReactElement;
  displayField?: string; // Field to display in the cell when not editing
  detailRoute?: (id: string) => string; // Route to the entity's detail page
  entityName?: string; // Human-readable entity name (e.g., "Artist", "Venue")
}

export interface RelationComponentProps {
  value?: string;
  onChange: (value: string) => void;
  onComplete?: () => void;
  disabled?: boolean;
}

/**
 * Maps foreign key column names to their corresponding search dropdown components
 * This allows FmDataGrid to automatically render the appropriate dropdown
 * for relation fields instead of text inputs
 */
export const RELATION_MAPPING: Record<string, RelationConfig> = {
  city_id: {
    component: (props: RelationComponentProps) => (
      <FmCitySearchDropdown
        value={props.value}
        onChange={value => {
          props.onChange(value);
          props.onComplete?.();
        }}
        placeholder='Select city...'
        disabled={props.disabled}
      />
    ),
    displayField: 'city', // Will look for row.city to display
    // Cities don't have detail pages yet
  },
  venue_id: {
    component: (props: RelationComponentProps) => (
      <FmVenueSearchDropdown
        value={props.value}
        onChange={value => {
          props.onChange(value);
          props.onComplete?.();
        }}
        placeholder='Select venue...'
        disabled={props.disabled}
      />
    ),
    displayField: 'venue',
    detailRoute: (id: string) => `/admin/venues/${id}`,
    entityName: 'Venue',
  },
  artist_id: {
    component: (props: RelationComponentProps) => (
      <FmArtistSearchDropdown
        value={props.value}
        onChange={value => {
          props.onChange(value);
          props.onComplete?.();
        }}
        placeholder='Select artist...'
        disabled={props.disabled}
      />
    ),
    displayField: 'artist',
    detailRoute: (id: string) => `/admin/artists/${id}`,
    entityName: 'Artist',
  },
  headliner_id: {
    component: (props: RelationComponentProps) => (
      <FmArtistSearchDropdown
        value={props.value}
        onChange={value => {
          props.onChange(value);
          props.onComplete?.();
        }}
        placeholder='Select headliner...'
        disabled={props.disabled}
      />
    ),
    displayField: 'headliner',
    detailRoute: (id: string) => `/admin/artists/${id}`,
    entityName: 'Headliner',
  },
  owner_id: {
    component: (props: RelationComponentProps) => (
      <FmUserSearchDropdown
        value={props.value}
        onChange={value => {
          props.onChange(value);
          props.onComplete?.();
        }}
        placeholder='Select owner...'
        disabled={props.disabled}
      />
    ),
    displayField: 'owner',
    detailRoute: (id: string) => `/admin/users/${id}`,
    entityName: 'User',
  },
  organization_id: {
    component: (props: RelationComponentProps) => (
      <FmOrganizationSearchDropdown
        value={props.value}
        onChange={value => {
          props.onChange(value);
          props.onComplete?.();
        }}
        placeholder='Select organization...'
        disabled={props.disabled}
      />
    ),
    displayField: 'organization',
    detailRoute: (id: string) => `/admin/organizations/${id}`,
    entityName: 'Organization',
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

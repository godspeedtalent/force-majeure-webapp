import { jsx as _jsx } from "react/jsx-runtime";
import { FmCitySearchDropdown } from '@/components/common/search/FmCitySearchDropdown';
import { FmVenueSearchDropdown } from '@/components/common/search/FmVenueSearchDropdown';
import { FmArtistSearchDropdown } from '@/components/common/search/FmArtistSearchDropdown';
import { FmUserSearchDropdown } from '@/components/common/search/FmUserSearchDropdown';
import { FmOrganizationSearchDropdown } from '@/components/common/search/FmOrganizationSearchDropdown';
/**
 * Maps foreign key column names to their corresponding search dropdown components
 * This allows FmDataGrid to automatically render the appropriate dropdown
 * for relation fields instead of text inputs
 */
export const RELATION_MAPPING = {
    city_id: {
        component: (props) => (_jsx(FmCitySearchDropdown, { value: props.value, onChange: value => {
                props.onChange(value);
                props.onComplete?.();
            }, placeholder: 'Select city...', disabled: props.disabled })),
        displayField: 'city', // Will look for row.city to display
        // Cities don't have detail pages yet
    },
    venue_id: {
        component: (props) => (_jsx(FmVenueSearchDropdown, { value: props.value, onChange: value => {
                props.onChange(value);
                props.onComplete?.();
            }, placeholder: 'Select venue...', disabled: props.disabled })),
        displayField: 'venue',
        detailRoute: (id) => `/admin/venues/${id}`,
        entityName: 'Venue',
    },
    artist_id: {
        component: (props) => (_jsx(FmArtistSearchDropdown, { value: props.value, onChange: value => {
                props.onChange(value);
                props.onComplete?.();
            }, placeholder: 'Select artist...', disabled: props.disabled })),
        displayField: 'artist',
        detailRoute: (id) => `/admin/artists/${id}`,
        entityName: 'Artist',
    },
    headliner_id: {
        component: (props) => (_jsx(FmArtistSearchDropdown, { value: props.value, onChange: value => {
                props.onChange(value);
                props.onComplete?.();
            }, placeholder: 'Select headliner...', disabled: props.disabled })),
        displayField: 'headliner',
        detailRoute: (id) => `/admin/artists/${id}`,
        entityName: 'Headliner',
    },
    owner_id: {
        component: (props) => (_jsx(FmUserSearchDropdown, { value: props.value, onChange: value => {
                props.onChange(value);
                props.onComplete?.();
            }, placeholder: 'Select owner...', disabled: props.disabled })),
        displayField: 'owner',
        detailRoute: (id) => `/admin/users/${id}`,
        entityName: 'User',
    },
    organization_id: {
        component: (props) => (_jsx(FmOrganizationSearchDropdown, { value: props.value, onChange: value => {
                props.onChange(value);
                props.onComplete?.();
            }, placeholder: 'Select organization...', disabled: props.disabled })),
        displayField: 'organization',
        detailRoute: (id) => `/admin/organizations/${id}`,
        entityName: 'Organization',
    },
};
/**
 * Check if a column is a relation field
 */
export const isRelationField = (columnKey) => {
    return columnKey in RELATION_MAPPING;
};
/**
 * Get the relation config for a column
 */
export const getRelationConfig = (columnKey) => {
    return RELATION_MAPPING[columnKey] || null;
};

/**
 * Component Relationship Graph Data
 *
 * This file contains the node and relationship data for the component
 * relationship visualization graph shown in the developer tools.
 */

export interface ComponentNode {
  id: string;
  label: string;
  category: string;
  x: number;
  y: number;
  isBase?: boolean;
  children?: string[];
  parents?: string[];
}

export interface ComponentRelationship {
  from: string;
  to: string;
  type: 'extends' | 'uses';
}

/**
 * All components organized by catalog categories
 */
export const COMPONENT_NODES: ComponentNode[] = [
  // BUTTONS CATEGORY (x: 0-1.5)
  {
    id: 'button-base',
    label: 'FmCommonButton',
    category: 'Buttons',
    x: 0.5,
    y: 8,
    isBase: true,
    children: ['button-create', 'button-nav'],
  },
  {
    id: 'button-create',
    label: 'FmCommonCreateButton',
    category: 'Buttons',
    x: 0.3,
    y: 7,
    parents: ['button-base'],
  },
  {
    id: 'button-nav',
    label: 'FmCommonNavigationButton',
    category: 'Buttons',
    x: 0.7,
    y: 7,
    parents: ['button-base'],
  },

  // CARDS & DISPLAY CATEGORY (x: 1.5-3.5)
  {
    id: 'badge',
    label: 'FmBadge',
    category: 'Cards & Display',
    x: 2,
    y: 9,
    isBase: true,
  },
  {
    id: 'badge-group',
    label: 'FmCommonBadgeGroup',
    category: 'Cards & Display',
    x: 2,
    y: 8,
    isBase: true,
    parents: ['badge'],
  },
  {
    id: 'icon-text',
    label: 'FmCommonIconWithText',
    category: 'Cards & Display',
    x: 2.5,
    y: 8.5,
    isBase: true,
  },
  {
    id: 'price',
    label: 'FmCommonPriceDisplay',
    category: 'Cards & Display',
    x: 3,
    y: 8.5,
    isBase: true,
  },
  {
    id: 'info-card',
    label: 'FmCommonInfoCard',
    category: 'Cards & Display',
    x: 2.5,
    y: 7.5,
    isBase: true,
  },
  {
    id: 'stat-card',
    label: 'FmCommonStatCard',
    category: 'Cards & Display',
    x: 3,
    y: 7.5,
    isBase: true,
    parents: ['badge'],
  },
  {
    id: 'page-header',
    label: 'FmCommonPageHeader',
    category: 'Cards & Display',
    x: 2.5,
    y: 6.5,
    isBase: true,
    parents: ['stat-card', 'icon-text'],
  },
  {
    id: 'detail-section',
    label: 'FmCommonDetailSection',
    category: 'Cards & Display',
    x: 2,
    y: 6.5,
    isBase: true,
    parents: ['icon-text'],
  },

  // DATA CATEGORY (x: 3.5-4.5)
  {
    id: 'list',
    label: 'FmCommonList',
    category: 'Data',
    x: 4,
    y: 8,
    isBase: true,
  },
  {
    id: 'tab',
    label: 'FmCommonTab',
    category: 'Data',
    x: 4,
    y: 7.5,
    isBase: true,
  },
  {
    id: 'collapsible',
    label: 'FmCommonCollapsibleSection',
    category: 'Data',
    x: 4,
    y: 7,
    isBase: true,
  },
  {
    id: 'data-grid',
    label: 'FmCommonDataGrid',
    category: 'Data',
    x: 4,
    y: 6.5,
    isBase: true,
  },

  // DISPLAY (AVATARS) CATEGORY (x: 4.5-5.5)
  {
    id: 'user-photo',
    label: 'FmCommonUserPhoto',
    category: 'Display',
    x: 5,
    y: 8,
    isBase: true,
  },
  {
    id: 'gradient-avatar',
    label: 'FmAnimatedGradientAvatar',
    category: 'Display',
    x: 5,
    y: 7.5,
    isBase: true,
  },

  // FEEDBACK CATEGORY (x: 5.5-6.5)
  {
    id: 'loading-spinner',
    label: 'FmCommonLoadingSpinner',
    category: 'Feedback',
    x: 6,
    y: 8,
    isBase: true,
  },
  {
    id: 'loading-overlay',
    label: 'FmCommonLoadingOverlay',
    category: 'Feedback',
    x: 6,
    y: 7.5,
    isBase: true,
    parents: ['loading-spinner'],
  },
  {
    id: 'error-display',
    label: 'FmErrorDisplay',
    category: 'Feedback',
    x: 6,
    y: 7,
    isBase: true,
  },

  // FORM INPUTS CATEGORY (x: 0-1.5, y: 4-6)
  {
    id: 'text-field',
    label: 'FmCommonTextField',
    category: 'Form Inputs',
    x: 0.5,
    y: 5.5,
    isBase: true,
  },
  {
    id: 'select',
    label: 'FmCommonSelect',
    category: 'Form Inputs',
    x: 0.5,
    y: 5,
    isBase: true,
  },
  {
    id: 'checkbox',
    label: 'FmCommonCheckbox',
    category: 'Form Inputs',
    x: 0.5,
    y: 4.5,
    isBase: true,
  },
  {
    id: 'toggle',
    label: 'FmCommonToggle',
    category: 'Form Inputs',
    x: 1,
    y: 5.5,
    isBase: true,
  },
  {
    id: 'date-picker',
    label: 'FmCommonDatePicker',
    category: 'Form Inputs',
    x: 1,
    y: 5,
    isBase: true,
  },
  {
    id: 'time-picker',
    label: 'FmCommonTimePicker',
    category: 'Form Inputs',
    x: 1,
    y: 4.5,
    isBase: true,
  },
  {
    id: 'password-input',
    label: 'PasswordInput',
    category: 'Form Inputs',
    x: 1.5,
    y: 5.5,
    isBase: true,
  },

  // FORM SYSTEM CATEGORY (x: 1.5-3.5, y: 4-6)
  {
    id: 'form',
    label: 'FmCommonForm',
    category: 'Form System',
    x: 2.5,
    y: 5.5,
    isBase: true,
    children: ['form-section', 'form-field', 'form-select'],
    parents: ['stack-layout'],
  },
  {
    id: 'form-section',
    label: 'FmCommonFormSection',
    category: 'Form System',
    x: 2,
    y: 4.8,
    isBase: true,
    children: ['form-field', 'form-select'],
    parents: ['form'],
  },
  {
    id: 'form-field',
    label: 'FmCommonFormField',
    category: 'Form System',
    x: 2.3,
    y: 4,
    isBase: true,
    parents: ['form', 'form-section'],
  },
  {
    id: 'form-select',
    label: 'FmCommonFormSelect',
    category: 'Form System',
    x: 2.7,
    y: 4,
    isBase: true,
    parents: ['form', 'form-section'],
  },

  // LAYOUT CATEGORY (x: 3.5-4.5, y: 4-6)
  {
    id: 'grid-layout',
    label: 'FmCommonGridLayout',
    category: 'Layout',
    x: 4,
    y: 5.5,
    isBase: true,
  },
  {
    id: 'stack-layout',
    label: 'FmCommonStackLayout',
    category: 'Layout',
    x: 4,
    y: 5,
    isBase: true,
  },

  // MODALS CATEGORY (x: 4.5-5.5, y: 4-6)
  {
    id: 'modal',
    label: 'FmCommonModal',
    category: 'Modals',
    x: 5,
    y: 5.5,
    isBase: true,
  },
  {
    id: 'confirm-dialog',
    label: 'FmCommonConfirmDialog',
    category: 'Modals',
    x: 5,
    y: 5,
    isBase: true,
  },

  // NAVIGATION CATEGORY (x: 5.5-6.5, y: 4-6)
  {
    id: 'back-button',
    label: 'FmCommonBackButton',
    category: 'Navigation',
    x: 6,
    y: 5.5,
    isBase: true,
  },
  {
    id: 'side-nav',
    label: 'FmCommonSideNav',
    category: 'Navigation',
    x: 6,
    y: 5,
    isBase: true,
  },

  // SEARCH CATEGORY (x: 0-2, y: 1.5-3)
  {
    id: 'search-base',
    label: 'FmCommonSearchDropdown',
    category: 'Search',
    x: 1,
    y: 3,
    isBase: true,
    children: [
      'search-artist',
      'search-event',
      'search-venue',
      'search-city',
    ],
  },
  {
    id: 'search-artist',
    label: 'FmArtistSearchDropdown',
    category: 'Search',
    x: 0.3,
    y: 2,
    parents: ['search-base'],
  },
  {
    id: 'search-event',
    label: 'FmEventSearchDropdown',
    category: 'Search',
    x: 0.8,
    y: 2,
    parents: ['search-base'],
  },
  {
    id: 'search-venue',
    label: 'FmVenueSearchDropdown',
    category: 'Search',
    x: 1.2,
    y: 2,
    parents: ['search-base'],
  },
  {
    id: 'search-city',
    label: 'FmCitySearchDropdown',
    category: 'Search',
    x: 1.7,
    y: 2,
    parents: ['search-base'],
  },

  // MISCELLANEOUS CATEGORY (x: 2-4, y: 1.5-3)
  {
    id: 'topographic-bg',
    label: 'TopographicBackground',
    category: 'Misc',
    x: 3,
    y: 3,
    isBase: true,
  },
  {
    id: 'promo-code',
    label: 'FmPromoCodeInput',
    category: 'Misc',
    x: 3,
    y: 2.5,
    isBase: true,
  },
];

/**
 * Component relationships showing inheritance and composition
 */
export const COMPONENT_RELATIONSHIPS: ComponentRelationship[] = [
  // Badge relationships
  { from: 'badge-group', to: 'badge', type: 'uses' },
  { from: 'stat-card', to: 'badge', type: 'uses' },

  // Button inheritance
  { from: 'button-base', to: 'button-create', type: 'extends' },
  { from: 'button-base', to: 'button-nav', type: 'extends' },

  // Form component composition
  { from: 'form', to: 'form-section', type: 'uses' },
  { from: 'form', to: 'form-field', type: 'uses' },
  { from: 'form', to: 'form-select', type: 'uses' },
  { from: 'form', to: 'stack-layout', type: 'uses' },
  { from: 'form-section', to: 'form-field', type: 'uses' },
  { from: 'form-section', to: 'form-select', type: 'uses' },

  // PageHeader composition
  { from: 'page-header', to: 'icon-text', type: 'uses' },
  { from: 'page-header', to: 'stat-card', type: 'uses' },

  // DetailSection composition
  { from: 'detail-section', to: 'icon-text', type: 'uses' },

  // Feedback relationships
  { from: 'loading-overlay', to: 'loading-spinner', type: 'uses' },

  // Search dropdown inheritance
  { from: 'search-base', to: 'search-artist', type: 'extends' },
  { from: 'search-base', to: 'search-event', type: 'extends' },
  { from: 'search-base', to: 'search-venue', type: 'extends' },
  { from: 'search-base', to: 'search-city', type: 'extends' },
];

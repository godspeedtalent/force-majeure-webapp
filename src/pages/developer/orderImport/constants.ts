/**
 * Order CSV Import Constants
 *
 * Centralized constants for field descriptions, defaults, and configuration.
 */

import type {
  FieldMapping,
  ColumnMapping,
  LineItemConfig,
  GuestProfileConfig,
  AssignableField,
  FieldDescription,
  FieldCategory,
  FieldDataType,
} from './types';

// ============================================================================
// DEFAULT VALUES
// ============================================================================

export const DEFAULT_FIELD_MAPPING: FieldMapping = {
  mode: 'column',
  value: '',
  defaultValue: '',
};

export const DEFAULT_COLUMN_MAPPING: ColumnMapping = {
  customer_email: { ...DEFAULT_FIELD_MAPPING },
  customer_name: { ...DEFAULT_FIELD_MAPPING },
  created_at: { ...DEFAULT_FIELD_MAPPING }, // Default will be set from event date
  status: { ...DEFAULT_FIELD_MAPPING, defaultValue: 'paid' },
  external_order_id: { ...DEFAULT_FIELD_MAPPING },
};

export const DEFAULT_LINE_ITEM_CONFIG: LineItemConfig = {
  items: [],
};

export const DEFAULT_GUEST_PROFILE_CONFIG: GuestProfileConfig = {
  enabled: false,
  fields: {
    email: true,
    name: { mode: 'column', value: '', defaultValue: '' },
    phone: { mode: 'column', value: '', defaultValue: '' },
  },
};

// ============================================================================
// DATE DEFAULT OPTIONS
// ============================================================================

/**
 * Special default values for date fields
 */
export const DATE_DEFAULTS = {
  NOW: '$NOW',           // Current timestamp
  EVENT_DATE: '$EVENT',  // Event start date
} as const;

// ============================================================================
// FIELD CATEGORIES
// ============================================================================

export const FIELD_CATEGORIES: Record<FieldCategory, { label: string; tableName: string; description: string }> = {
  profiles: { label: 'profiles', tableName: 'profiles', description: 'User lookup / creation' },
  orders: { label: 'orders', tableName: 'orders', description: 'Order record fields' },
  tickets: { label: 'tickets', tableName: 'tickets', description: 'Applied to all ticket line items' },
};

// ============================================================================
// FIELD DESCRIPTIONS
// ============================================================================

/**
 * Field descriptions for the mapping UI - showing actual DB column names
 * Note: 'tickets' category fields are shown in the Line Items section as "Ticket Defaults"
 */
export const FIELD_DESCRIPTIONS: Record<keyof ColumnMapping, FieldDescription> = {
  customer_email: {
    label: 'email',
    dbColumn: 'email',
    tableName: 'profiles',
    required: true,
    description: 'Looks up existing user or creates profile',
    dataType: 'text',
    supportsDefault: false,
    category: 'profiles',
  },
  customer_name: {
    label: 'attendee_name',
    dbColumn: 'attendee_name',
    tableName: 'tickets',
    required: false,
    description: 'Name on ticket for entry (applied to all tickets)',
    dataType: 'text',
    supportsDefault: true,
    category: 'tickets',
  },
  created_at: {
    label: 'created_at',
    dbColumn: 'created_at',
    tableName: 'orders',
    required: false,
    description: 'Order timestamp (defaults to event date)',
    dataType: 'date',
    supportsDefault: true,
    category: 'orders',
  },
  status: {
    label: 'status',
    dbColumn: 'status',
    tableName: 'orders',
    required: false,
    description: 'paid | refunded | cancelled',
    dataType: 'enum',
    enumValues: ['paid', 'refunded', 'cancelled'],
    supportsDefault: true,
    category: 'orders',
  },
  external_order_id: {
    label: 'external_order_id',
    dbColumn: 'external_order_id',
    tableName: 'orders',
    required: false,
    description: 'For deduplication against previous imports',
    dataType: 'text',
    supportsDefault: false,
    category: 'orders',
  },
};

// ============================================================================
// DATA TYPE DISPLAY
// ============================================================================

/**
 * Data type display labels and colors
 */
export const DATA_TYPE_DISPLAY: Record<FieldDataType, { label: string; color: string }> = {
  text: { label: 'Text', color: 'text-blue-400' },
  integer: { label: 'Integer', color: 'text-green-400' },
  date: { label: 'Date', color: 'text-purple-400' },
  enum: { label: 'Enum', color: 'text-orange-400' },
};

// ============================================================================
// ASSIGNABLE FIELDS
// ============================================================================

/**
 * Fields that can receive unmapped CSV columns
 *
 * The 'user' table is a virtual abstraction that routes to either 'profiles' or 'guests'
 * depending on whether the customer email matches an existing profile.
 */
export const ASSIGNABLE_FIELDS: AssignableField[] = [
  // user table - unified abstraction for profile/guest data
  // Routes to 'profiles' if user exists, 'guests' if not
  { table: 'user', column: 'full_name', dataType: 'text', description: 'Customer full name' },
  { table: 'user', column: 'phone', dataType: 'text', description: 'Customer phone number' },
  { table: 'user', column: 'billing_address_line_1', dataType: 'text', description: 'Customer billing address line 1' },
  { table: 'user', column: 'billing_address_line_2', dataType: 'text', description: 'Customer billing address line 2' },
  { table: 'user', column: 'billing_city', dataType: 'text', description: 'Customer billing city' },
  { table: 'user', column: 'billing_state', dataType: 'text', description: 'Customer billing state/province' },
  { table: 'user', column: 'billing_zip_code', dataType: 'text', description: 'Customer billing postal/zip code' },
  { table: 'user', column: 'billing_country', dataType: 'text', description: 'Customer billing country' },
  // orders table - order-specific data
  { table: 'orders', column: 'customer_email', dataType: 'text', description: 'Order customer email (override)' },
  { table: 'orders', column: 'billing_address_line_1', dataType: 'text', description: 'Order billing address line 1' },
  { table: 'orders', column: 'billing_address_line_2', dataType: 'text', description: 'Order billing address line 2' },
  { table: 'orders', column: 'billing_city', dataType: 'text', description: 'Order billing city' },
  { table: 'orders', column: 'billing_state', dataType: 'text', description: 'Order billing state/province' },
  { table: 'orders', column: 'billing_zip_code', dataType: 'text', description: 'Order billing postal/zip code' },
  { table: 'orders', column: 'billing_country', dataType: 'text', description: 'Order billing country' },
  // tickets table
  { table: 'tickets', column: 'attendee_name', dataType: 'text', description: 'Attendee name on ticket' },
  { table: 'tickets', column: 'attendee_email', dataType: 'text', description: 'Attendee email (if different from purchaser)' },
  { table: 'tickets', column: 'attendee_phone', dataType: 'text', description: 'Attendee phone number' },
];

// ============================================================================
// USER FIELD MAPPING
// ============================================================================

/**
 * Maps unified 'user' fields to their corresponding columns in profiles and guests tables.
 * The 'phone' field maps to different column names in each table.
 */
export const USER_FIELD_MAPPING: Record<string, { profiles: string; guests: string }> = {
  full_name: { profiles: 'full_name', guests: 'full_name' },
  phone: { profiles: 'phone_number', guests: 'phone' },
  billing_address_line_1: { profiles: 'billing_address_line_1', guests: 'billing_address_line_1' },
  billing_address_line_2: { profiles: 'billing_address_line_2', guests: 'billing_address_line_2' },
  billing_city: { profiles: 'billing_city', guests: 'billing_city' },
  billing_state: { profiles: 'billing_state', guests: 'billing_state' },
  billing_zip_code: { profiles: 'billing_zip_code', guests: 'billing_zip_code' },
  billing_country: { profiles: 'billing_country', guests: 'billing_country' },
};

// ============================================================================
// AUTO-DETECT PATTERNS
// ============================================================================

/**
 * Patterns for auto-detecting column mappings based on header names
 */
export const MAPPING_PATTERNS: Record<keyof ColumnMapping, string[]> = {
  customer_email: ['email', 'customeremail', 'buyeremail', 'purchaseremail', 'attendeeemail'],
  customer_name: ['name', 'customername', 'buyername', 'fullname', 'attendeename'],
  created_at: ['createdat', 'orderdate', 'date', 'purchasedate', 'ordertime'],
  status: ['status', 'orderstatus', 'ticketstatus', 'state'],
  external_order_id: ['externalorderid', 'orderid', 'referenceid', 'transactionid', 'originalorderid'],
};

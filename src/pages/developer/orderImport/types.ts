/**
 * Order CSV Import Types
 *
 * Centralized type definitions for the order CSV import functionality.
 * These types define the data structures for parsing CSV files, mapping fields,
 * configuring line items, and tracking import processes.
 */

// ============================================================================
// CSV PARSING TYPES
// ============================================================================

/**
 * A single row from a parsed CSV file
 * Keys are column headers, values are cell contents
 */
export interface CsvRow {
  [key: string]: string;
}

// ============================================================================
// FIELD MAPPING TYPES
// ============================================================================

/**
 * Mapping mode determines how a field value is derived
 * - column: Map to a CSV column
 * - hardcoded: Use a fixed value for all rows
 * - formula: Calculate using an expression
 * - ignore: Skip this field (use default or null)
 */
export type MappingMode = 'column' | 'hardcoded' | 'formula' | 'ignore';

/**
 * Configuration for how a single field should be resolved
 */
export interface FieldMapping {
  mode: MappingMode;
  value: string; // CSV column name, hardcoded value, or formula expression
  defaultValue?: string; // Default value when column is empty or not mapped
}

/**
 * Column mapping configuration - maps database fields to CSV values
 * Each CSV row = one order. Line item quantities are configured separately.
 */
export interface ColumnMapping {
  // Profile lookup (profiles table)
  customer_email: FieldMapping;      // Required: looks up or creates user profile
  // Ticket attendee info (tickets table)
  customer_name: FieldMapping;       // Optional: attendee name on ticket
  // Order metadata (orders table)
  created_at: FieldMapping;          // Optional: order date (defaults to event date)
  status: FieldMapping;              // Optional: completed/refunded/cancelled
  external_order_id: FieldMapping;   // Optional: for deduplication against re-imports
}

// ============================================================================
// LINE ITEM TYPES
// ============================================================================

/**
 * Line item type determines what kind of item this represents
 * - ticket: A ticket from a ticket tier (creates ticket records)
 * - product: A non-ticket product (protection, merchandise, etc.)
 * - fee: A standalone fee line item (service fee, processing fee)
 */
export type LineItemType = 'ticket' | 'product' | 'fee';

/**
 * Price source determines how the unit price is calculated
 * - tier: Use the ticket tier's price_cents (for ticket items)
 * - product: Use the product's price_cents (for product items)
 * - column: Map to a CSV column value
 * - hardcoded: Use a fixed value
 * - formula: Calculate using an expression
 */
export type PriceSource = 'tier' | 'product' | 'column' | 'hardcoded' | 'formula';

/**
 * Individual line item template for import
 * Each line item represents one type of item that will be created per order
 */
export interface LineItemTemplate {
  id: string;                         // Unique ID for UI tracking
  name: string;                       // Display name for this line item
  type: LineItemType;                 // What kind of item this is

  // Item reference (depends on type)
  ticketTierId?: string;              // For ticket type: which tier
  productId?: string;                 // For product type: which product

  // Quantity configuration
  quantity: FieldMapping;             // How many of this item per order

  // Price configuration
  priceSource: PriceSource;           // How to determine unit price
  priceMapping?: FieldMapping;        // If priceSource is column/hardcoded/formula

  // Fee configuration (optional per-unit fee)
  feeSource: PriceSource;             // How to determine unit fee
  feeMapping?: FieldMapping;          // If feeSource is column/hardcoded/formula

  // Conditional creation (optional)
  condition?: LineItemCondition;

  // Sub-items (e.g., ticket protection per ticket)
  subItems?: SubItemTemplate[];
}

/**
 * Condition for when a line item should be created
 */
export interface LineItemCondition {
  type: 'column_equals' | 'column_not_empty' | 'always';
  column?: string;                  // CSV column to check
  value?: string;                   // Value to match (for column_equals)
}

/**
 * Sub-item template for items that should be created alongside a parent
 * Example: Ticket protection for each ticket
 */
export interface SubItemTemplate {
  id: string;
  name: string;
  type: 'product' | 'fee';            // Sub-items can only be products or fees
  productId?: string;                 // For product type

  // Quantity is derived from parent (1:1 ratio)
  // or can be calculated from parent quantity
  quantityMultiplier: number;         // e.g., 1 means 1 sub-item per parent item

  // Price configuration
  priceSource: PriceSource;
  priceMapping?: FieldMapping;

  // Conditional creation
  condition?: LineItemCondition;
}

/**
 * Complete line item configuration for an import
 */
export interface LineItemConfig {
  items: LineItemTemplate[];
}

// ============================================================================
// PARSED ORDER TYPES
// ============================================================================

/**
 * Parsed sub-item (e.g., ticket protection per ticket)
 */
export interface ParsedSubItem {
  templateId: string;
  name: string;
  type: 'product' | 'fee';
  productId?: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
}

/**
 * Parsed line item for a single order
 * Represents one line item that will be created for the order
 */
export interface ParsedLineItem {
  templateId: string;           // Reference to LineItemTemplate.id
  name: string;                 // Display name
  type: LineItemType;           // ticket, product, or fee
  ticketTierId?: string;        // For ticket items
  productId?: string;           // For product items
  quantity: number;             // How many of this item
  unitPriceCents: number;       // Price per unit
  unitFeeCents: number;         // Fee per unit
  totalCents: number;           // (unitPriceCents + unitFeeCents) * quantity
  subItems: ParsedSubItem[];    // Resolved sub-items
}

/**
 * A fully parsed order ready for import
 */
export interface ParsedOrder {
  rowIndex: number;
  customerEmail: string;
  customerName: string;
  // Line items replace single quantity/price
  lineItems: ParsedLineItem[];
  // Totals (calculated from line items)
  subtotalCents: number;        // Sum of all line item prices
  feesCents: number;            // Sum of all line item fees
  totalCents: number;           // subtotalCents + feesCents
  // Order metadata
  orderDate: string;
  status: 'paid' | 'refunded' | 'cancelled';
  externalOrderId?: string;
  // Validation state
  validationErrors: string[];
  existingUserId: string | null;
  isDuplicate: boolean;
}

/**
 * Result of importing a single order
 */
export interface ImportResult {
  rowIndex: number;
  orderId: string | null;
  ticketCount: number;
  email: string;
  status: 'success' | 'failed' | 'pending' | 'importing';
  error?: string;
}

/**
 * Progress state for import process
 */
export interface ImportProgress {
  currentRow: number;
  totalRows: number;
  results: ImportResult[];
}

// ============================================================================
// PROCESS TRACKING TYPES
// ============================================================================

/**
 * Status values for import processes
 */
export type ProcessStatus = 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back';

/**
 * Record of an import process for tracking and rollback
 */
export interface ProcessRecord {
  id: string;
  process_type: string;
  name: string | null;
  status: ProcessStatus;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  total_items: number;
  processed_items: number;
  successful_items: number;
  failed_items: number;
  metadata: Record<string, unknown>;
  rollback_data: Record<string, unknown>;
  created_by: string;
  created_at: string;
}

// ============================================================================
// GUEST PROFILE TYPES
// ============================================================================

/**
 * Guest profile configuration for unmatched users
 * When a user email isn't found, we can create a guest record
 */
export interface GuestProfileConfig {
  enabled: boolean;
  fields: {
    email: boolean;           // Always true when enabled
    name: FieldMapping;       // Guest name
    phone: FieldMapping;      // Phone number
  };
}

// ============================================================================
// UNMAPPED FIELD TYPES
// ============================================================================

/**
 * Data types for field mapping
 */
export type FieldDataType = 'text' | 'integer' | 'date' | 'enum';

/**
 * Available tables and their assignable fields for unmapped columns
 */
export interface AssignableField {
  table: string;
  column: string;
  dataType: FieldDataType;
  description: string;
}

/**
 * An assignment of an unmapped CSV column to a database field
 */
export interface UnmappedFieldAssignment {
  id: string;
  csvColumn: string;
  targetTable: string;
  targetColumn: string;
}

// ============================================================================
// FIELD DESCRIPTION TYPES
// ============================================================================

/**
 * Field categories grouped by database table
 */
export type FieldCategory = 'profiles' | 'orders' | 'tickets';

/**
 * Description of a mappable field
 */
export interface FieldDescription {
  label: string;           // Display label
  dbColumn: string;        // Actual database column name
  tableName: string;       // Table this maps to
  required: boolean;
  description: string;
  dataType: FieldDataType;
  enumValues?: string[];
  supportsDefault: boolean;
  category: FieldCategory;
}

// ============================================================================
// IMPORT STATE TYPES
// ============================================================================

/**
 * Steps in the import wizard
 */
export type ImportStep = 'home' | 'configure' | 'upload' | 'map' | 'preview' | 'complete';

/**
 * Filter options for preview table
 */
export type PreviewFilter = 'all' | 'valid' | 'invalid' | 'linked' | 'orphaned';

/**
 * Statistics calculated from parsed orders
 */
export interface ImportStats {
  valid: ParsedOrder[];
  invalid: ParsedOrder[];
  duplicates: ParsedOrder[];
  withUser: ParsedOrder[];
  orphaned: ParsedOrder[];
  totalTickets: number;
  totalRevenue: number;
}

// ============================================================================
// FORMULA EVALUATION TYPES
// ============================================================================

/**
 * Context for evaluating formulas
 */
export interface FormulaContext {
  tierPrice: number;
  row: CsvRow;
}

/**
 * Extended context for field resolution
 */
export interface ResolveContext {
  tierPrice: number;              // Primary tier price (for backward compat)
  tierPrices: Map<string, number>; // All tier prices by tier ID
  eventDate?: string;             // Event start date (for $EVENT default)
  row: CsvRow;
}

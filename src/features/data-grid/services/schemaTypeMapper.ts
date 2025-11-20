/**
 * Schema Type Mapper Service
 *
 * Maps PostgreSQL data types to DataGrid column types.
 * Provides intelligent type detection based on column names and data types.
 */

import { DataGridColumn } from '../types';

/**
 * PostgreSQL to DataGrid type mapping
 */
const POSTGRES_TYPE_MAP: Record<string, DataGridColumn['type']> = {
  // Text types
  'character varying': 'text',
  'varchar': 'text',
  'character': 'text',
  'char': 'text',
  'text': 'text',

  // Numeric types
  'smallint': 'number',
  'integer': 'number',
  'bigint': 'number',
  'decimal': 'number',
  'numeric': 'number',
  'real': 'number',
  'double precision': 'number',

  // Boolean
  'boolean': 'boolean',

  // Date/Time
  'timestamp without time zone': 'date',
  'timestamp with time zone': 'date',
  'timestamptz': 'date',
  'date': 'date',
  'time': 'date',
  'time without time zone': 'date',
  'time with time zone': 'date',

  // UUID (treat as readonly text)
  'uuid': 'text',

  // JSON (not editable by default)
  'json': 'text',
  'jsonb': 'text',
};

/**
 * Column name patterns that indicate specific types
 */
const COLUMN_NAME_PATTERNS: Array<{
  pattern: RegExp;
  type: DataGridColumn['type'];
  readonly?: boolean;
}> = [
  // Email fields
  { pattern: /email/i, type: 'email' },

  // URL fields
  { pattern: /(url|link|website|webpage)$/i, type: 'url' },

  // Date/time fields
  { pattern: /(created_at|updated_at|deleted_at|timestamp)$/i, type: 'created_date', readonly: true },
  { pattern: /(date|time|scheduled_at|expires_at|starts_at|ends_at)$/i, type: 'date' },

  // ID fields (readonly)
  { pattern: /^id$/i, type: 'text', readonly: true },
  { pattern: /_id$/i, type: 'text' }, // Foreign keys - handled separately by relation detector
];

/**
 * Column metadata from database schema
 */
export interface ColumnMetadata {
  name: string;
  type: string;
  nullable: boolean;
  default: string | null;
  max_length?: number;
  precision?: number;
  is_primary_key: boolean;
  is_unique: boolean;
  position: number;
}

/**
 * Mapped column with DataGrid type and properties
 */
export interface MappedColumn {
  key: string;
  type: DataGridColumn['type'];
  readonly: boolean;
  required: boolean;
  nullable: boolean;
  isPrimaryKey: boolean;
  isUnique: boolean;
  postgresType: string;
}

/**
 * Map PostgreSQL type to DataGrid type
 */
export function mapPostgresType(postgresType: string): DataGridColumn['type'] {
  const normalizedType = postgresType.toLowerCase().trim();
  return POSTGRES_TYPE_MAP[normalizedType] || 'text';
}

/**
 * Detect type from column name patterns
 */
export function detectTypeFromName(columnName: string): {
  type: DataGridColumn['type'] | null;
  readonly?: boolean;
} {
  for (const pattern of COLUMN_NAME_PATTERNS) {
    if (pattern.pattern.test(columnName)) {
      return {
        type: pattern.type,
        readonly: pattern.readonly,
      };
    }
  }
  return { type: null };
}

/**
 * Check if column should be readonly
 */
export function isReadonlyColumn(metadata: ColumnMetadata): boolean {
  // Primary keys are readonly
  if (metadata.is_primary_key) {
    return true;
  }

  // Auto-generated timestamps are readonly
  if (metadata.name.match(/(created_at|updated_at|deleted_at)$/i)) {
    return true;
  }

  // Columns with defaults that look like auto-generated values
  if (metadata.default) {
    const defaultLower = metadata.default.toLowerCase();
    if (
      defaultLower.includes('gen_random_uuid') ||
      defaultLower.includes('now()') ||
      defaultLower.includes('current_timestamp') ||
      defaultLower.includes('nextval')
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Check if column is required (not nullable and no default)
 */
export function isRequiredColumn(metadata: ColumnMetadata): boolean {
  // Primary keys are not required for creation (auto-generated)
  if (metadata.is_primary_key) {
    return false;
  }

  // If column has a default value, it's not required
  if (metadata.default !== null) {
    return false;
  }

  // If nullable, not required
  if (metadata.nullable) {
    return false;
  }

  // Non-nullable with no default = required
  return true;
}

/**
 * Map column metadata to DataGrid column properties
 */
export function mapColumn(metadata: ColumnMetadata): MappedColumn {
  // Start with postgres type mapping
  let type = mapPostgresType(metadata.type);

  // Check for name-based type detection (overrides postgres type)
  const nameDetection = detectTypeFromName(metadata.name);
  if (nameDetection.type) {
    type = nameDetection.type;
  }

  // Determine if readonly
  const readonly =
    nameDetection.readonly ||
    isReadonlyColumn(metadata);

  // Determine if required
  const required = isRequiredColumn(metadata);

  return {
    key: metadata.name,
    type,
    readonly,
    required,
    nullable: metadata.nullable,
    isPrimaryKey: metadata.is_primary_key,
    isUnique: metadata.is_unique,
    postgresType: metadata.type,
  };
}

/**
 * Map multiple columns from metadata
 */
export function mapColumns(metadataArray: ColumnMetadata[]): MappedColumn[] {
  return metadataArray.map(mapColumn);
}

/**
 * Generate human-readable label from column name
 * Converts snake_case to Title Case
 */
export function generateLabel(columnName: string): string {
  return columnName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Check if column type supports sorting
 */
export function isSortableType(type: DataGridColumn['type']): boolean {
  // All types are sortable except maybe complex types in the future
  return true;
}

/**
 * Check if column type supports filtering
 */
export function isFilterableType(type: DataGridColumn['type']): boolean {
  // All types are filterable
  return true;
}

/**
 * Check if column type supports inline editing
 */
export function isEditableType(
  type: DataGridColumn['type'],
  readonly: boolean
): boolean {
  if (readonly) {
    return false;
  }

  // All non-readonly types support editing
  // (created_date is handled as readonly)
  return true;
}

/**
 * Get default width for column type
 */
export function getDefaultWidth(
  type: DataGridColumn['type'],
  columnName: string
): string | undefined {
  // ID columns are narrow
  if (columnName === 'id' || columnName.endsWith('_id')) {
    return '100px';
  }

  // Date columns
  if (type === 'date' || type === 'created_date') {
    return '180px';
  }

  // Boolean columns are narrow
  if (type === 'boolean') {
    return '100px';
  }

  // Email columns
  if (type === 'email') {
    return '250px';
  }

  // URL columns
  if (type === 'url') {
    return '200px';
  }

  // Number columns
  if (type === 'number') {
    return '120px';
  }

  // Text columns - undefined to use flex
  return undefined;
}

/**
 * Validate that a type string is a valid DataGrid type
 */
export function isValidDataGridType(type: string): type is DataGridColumn['type'] {
  const validTypes: DataGridColumn['type'][] = [
    'text',
    'number',
    'email',
    'url',
    'date',
    'boolean',
    'created_date',
  ];
  return validTypes.includes(type as DataGridColumn['type']);
}

/**
 * Type inference priority order
 */
export const TYPE_INFERENCE_PRIORITY = [
  'Column name pattern',      // Highest priority
  'PostgreSQL type mapping',  // Medium priority
  'Default to text',          // Lowest priority (fallback)
] as const;

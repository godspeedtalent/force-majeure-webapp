/**
 * Relation Detector Service
 *
 * Detects foreign key relationships and maps them to existing
 * relation components (search dropdowns) for the data grid.
 */

import { RELATION_MAPPING, isRelationField } from '../utils/dataGridRelations';

/**
 * Foreign key metadata from database
 */
export interface ForeignKeyMetadata {
  column: string;
  referenced_table: string;
  referenced_column: string;
  constraint_name: string;
  on_delete: string;
  on_update: string;
}

/**
 * Detected relation with component information
 */
export interface DetectedRelation {
  columnKey: string;
  referencedTable: string;
  referencedColumn: string;
  hasComponent: boolean;
  componentKey: string | null;
  displayField: string | null;
  detailRoute: ((id: string) => string) | null;
  entityName: string | null;
}

/**
 * Detect if a column is a foreign key based on naming convention
 * Checks for *_id pattern
 */
export function isForeignKeyColumn(columnName: string): boolean {
  return columnName.endsWith('_id') && columnName !== 'id';
}

/**
 * Get the referenced table name from column name
 * E.g., "venue_id" -> "venue", "headliner_id" -> "headliner"
 */
export function getReferencedTableFromColumnName(columnName: string): string | null {
  if (!isForeignKeyColumn(columnName)) {
    return null;
  }

  // Remove _id suffix
  return columnName.slice(0, -3);
}

/**
 * Check if a relation component exists for this column
 */
export function hasRelationComponent(columnKey: string): boolean {
  return isRelationField(columnKey);
}

/**
 * Get relation configuration from RELATION_MAPPING
 */
export function getRelationConfig(columnKey: string) {
  if (!hasRelationComponent(columnKey)) {
    return null;
  }

  const config = RELATION_MAPPING[columnKey];
  return {
    componentKey: columnKey,
    displayField: config.displayField || null,
    detailRoute: config.detailRoute || null,
    entityName: config.entityName || null,
  };
}

/**
 * Detect relation for a column based on metadata and naming
 */
export function detectRelation(
  columnName: string,
  foreignKeyMetadata?: ForeignKeyMetadata
): DetectedRelation | null {
  // Check if it's a foreign key column
  if (!isForeignKeyColumn(columnName)) {
    return null;
  }

  // Get referenced table (from metadata or column name)
  const referencedTable =
    foreignKeyMetadata?.referenced_table ||
    getReferencedTableFromColumnName(columnName);

  if (!referencedTable) {
    return null;
  }

  // Get referenced column (usually 'id')
  const referencedColumn = foreignKeyMetadata?.referenced_column || 'id';

  // Check if we have a component for this relation
  const hasComponent = hasRelationComponent(columnName);
  const config = hasComponent ? getRelationConfig(columnName) : null;

  return {
    columnKey: columnName,
    referencedTable,
    referencedColumn,
    hasComponent,
    componentKey: config?.componentKey || null,
    displayField: config?.displayField || null,
    detailRoute: config?.detailRoute || null,
    entityName: config?.entityName || null,
  };
}

/**
 * Detect all relations for an array of columns
 */
export function detectRelations(
  columnNames: string[],
  foreignKeyMetadata: ForeignKeyMetadata[] = []
): DetectedRelation[] {
  const relations: DetectedRelation[] = [];

  // Create a map of column -> foreign key metadata
  const fkMap = new Map<string, ForeignKeyMetadata>();
  foreignKeyMetadata.forEach(fk => {
    fkMap.set(fk.column, fk);
  });

  // Detect relation for each column
  columnNames.forEach(columnName => {
    const fkMeta = fkMap.get(columnName);
    const relation = detectRelation(columnName, fkMeta);

    if (relation) {
      relations.push(relation);
    }
  });

  return relations;
}

/**
 * Filter relations to only those with available components
 */
export function getRelationsWithComponents(
  relations: DetectedRelation[]
): DetectedRelation[] {
  return relations.filter(r => r.hasComponent);
}

/**
 * Filter relations to those without components (need custom handling)
 */
export function getRelationsWithoutComponents(
  relations: DetectedRelation[]
): DetectedRelation[] {
  return relations.filter(r => !r.hasComponent);
}

/**
 * Generate display field name from referenced table
 * E.g., "venues" -> "venue", "artists" -> "artist"
 */
export function generateDisplayFieldName(referencedTable: string): string {
  // Remove plural 's' if present
  if (referencedTable.endsWith('s')) {
    return referencedTable.slice(0, -1);
  }
  return referencedTable;
}

/**
 * Generate entity name from referenced table
 * E.g., "venues" -> "Venue", "artists" -> "Artist"
 */
export function generateEntityName(referencedTable: string): string {
  const singular = generateDisplayFieldName(referencedTable);
  return singular.charAt(0).toUpperCase() + singular.slice(1);
}

/**
 * Check if a relation should be editable
 * Relations are editable only if they have a component
 */
export function isRelationEditable(relation: DetectedRelation): boolean {
  return relation.hasComponent;
}

/**
 * Get missing relation components (for warning/logging)
 */
export function getMissingRelationComponents(
  foreignKeyMetadata: ForeignKeyMetadata[]
): Array<{ column: string; referencedTable: string }> {
  const missing: Array<{ column: string; referencedTable: string }> = [];

  foreignKeyMetadata.forEach(fk => {
    if (!hasRelationComponent(fk.column)) {
      missing.push({
        column: fk.column,
        referencedTable: fk.referenced_table,
      });
    }
  });

  return missing;
}

/**
 * Available relation components in the system
 * (Exported from RELATION_MAPPING keys)
 */
export function getAvailableRelationComponents(): string[] {
  return Object.keys(RELATION_MAPPING);
}

/**
 * Map referenced table to potential relation component key
 * Helps suggest which component might be needed
 */
export function suggestRelationComponentKey(
  columnName: string,
  referencedTable: string
): string {
  // If column matches pattern, use it directly
  if (hasRelationComponent(columnName)) {
    return columnName;
  }

  // Try singular form of referenced table + _id
  const singular = generateDisplayFieldName(referencedTable);
  const suggestedKey = `${singular}_id`;

  return suggestedKey;
}

/**
 * Validate relation metadata
 */
export function isValidRelation(relation: DetectedRelation | null): relation is DetectedRelation {
  if (!relation) {
    return false;
  }

  return Boolean(
    relation.columnKey &&
    relation.referencedTable &&
    relation.referencedColumn
  );
}

/**
 * Get relation info for logging/debugging
 */
export function getRelationInfo(relation: DetectedRelation): string {
  const status = relation.hasComponent ? '✅ HAS COMPONENT' : '❌ NO COMPONENT';
  return `${relation.columnKey} -> ${relation.referencedTable}.${relation.referencedColumn} [${status}]`;
}

/**
 * Common foreign key patterns
 */
export const COMMON_FK_PATTERNS = {
  USER: ['user_id', 'owner_id', 'created_by', 'updated_by', 'author_id'],
  ORGANIZATION: ['organization_id', 'org_id'],
  VENUE: ['venue_id', 'location_id'],
  ARTIST: ['artist_id', 'performer_id', 'headliner_id'],
  EVENT: ['event_id'],
  CITY: ['city_id'],
} as const;

/**
 * Categorize foreign key by common patterns
 */
export function categorizeForeignKey(
  columnName: string
): keyof typeof COMMON_FK_PATTERNS | 'OTHER' {
  for (const [category, patterns] of Object.entries(COMMON_FK_PATTERNS)) {
    if ((patterns as readonly string[]).includes(columnName)) {
      return category as keyof typeof COMMON_FK_PATTERNS;
    }
  }
  return 'OTHER';
}

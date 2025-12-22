/**
 * Relation Detector Service
 *
 * Detects foreign key relationships and maps them to existing
 * relation components (search dropdowns) for the data grid.
 */
import { RELATION_MAPPING, isRelationField } from '../utils/dataGridRelations';
/**
 * Detect if a column is a foreign key based on naming convention
 * Checks for *_id pattern
 */
export function isForeignKeyColumn(columnName) {
    return columnName.endsWith('_id') && columnName !== 'id';
}
/**
 * Get the referenced table name from column name
 * E.g., "venue_id" -> "venue", "headliner_id" -> "headliner"
 */
export function getReferencedTableFromColumnName(columnName) {
    if (!isForeignKeyColumn(columnName)) {
        return null;
    }
    // Remove _id suffix
    return columnName.slice(0, -3);
}
/**
 * Check if a relation component exists for this column
 */
export function hasRelationComponent(columnKey) {
    return isRelationField(columnKey);
}
/**
 * Get relation configuration from RELATION_MAPPING
 */
export function getRelationConfig(columnKey) {
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
export function detectRelation(columnName, foreignKeyMetadata) {
    // Check if it's a foreign key column
    if (!isForeignKeyColumn(columnName)) {
        return null;
    }
    // Get referenced table (from metadata or column name)
    const referencedTable = foreignKeyMetadata?.referenced_table ||
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
export function detectRelations(columnNames, foreignKeyMetadata = []) {
    const relations = [];
    // Create a map of column -> foreign key metadata
    const fkMap = new Map();
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
export function getRelationsWithComponents(relations) {
    return relations.filter(r => r.hasComponent);
}
/**
 * Filter relations to those without components (need custom handling)
 */
export function getRelationsWithoutComponents(relations) {
    return relations.filter(r => !r.hasComponent);
}
/**
 * Generate display field name from referenced table
 * E.g., "venues" -> "venue", "artists" -> "artist"
 */
export function generateDisplayFieldName(referencedTable) {
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
export function generateEntityName(referencedTable) {
    const singular = generateDisplayFieldName(referencedTable);
    return singular.charAt(0).toUpperCase() + singular.slice(1);
}
/**
 * Check if a relation should be editable
 * Relations are editable only if they have a component
 */
export function isRelationEditable(relation) {
    return relation.hasComponent;
}
/**
 * Get missing relation components (for warning/logging)
 */
export function getMissingRelationComponents(foreignKeyMetadata) {
    const missing = [];
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
export function getAvailableRelationComponents() {
    return Object.keys(RELATION_MAPPING);
}
/**
 * Map referenced table to potential relation component key
 * Helps suggest which component might be needed
 */
export function suggestRelationComponentKey(columnName, referencedTable) {
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
export function isValidRelation(relation) {
    if (!relation) {
        return false;
    }
    return Boolean(relation.columnKey &&
        relation.referencedTable &&
        relation.referencedColumn);
}
/**
 * Get relation info for logging/debugging
 */
export function getRelationInfo(relation) {
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
};
/**
 * Categorize foreign key by common patterns
 */
export function categorizeForeignKey(columnName) {
    for (const [category, patterns] of Object.entries(COMMON_FK_PATTERNS)) {
        if (patterns.includes(columnName)) {
            return category;
        }
    }
    return 'OTHER';
}

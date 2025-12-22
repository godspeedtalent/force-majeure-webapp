import { jsx as _jsx } from "react/jsx-runtime";
import { ImageCell } from '../components/cells/ImageCell';
import { DateCell } from '../components/cells/DateCell';
import { RelationCell } from '../components/cells/RelationCell';
import { RoleCell } from '../components/cells/RoleCell';
import { BadgeListCell } from '../components/cells/BadgeListCell';
import { JsonCell } from '../cells/JsonCell';
/**
 * Preset column type configurations for FmDataGrid
 *
 * These helper functions provide standardized column definitions with built-in
 * cell renderers for common data types (images, dates, relations, roles, etc.).
 *
 * ## Basic Usage:
 * ```tsx
 * import { DataGridColumns } from '@/features/data-grid/utils';
 *
 * const columns: DataGridColumn<User>[] = [
 *   DataGridColumns.image({
 *     key: 'avatar_url',
 *     label: 'Avatar',
 *     shape: 'circle',
 *   }),
 *   DataGridColumns.text({
 *     key: 'email',
 *     label: 'Email',
 *   }),
 *   DataGridColumns.date({
 *     key: 'created_at',
 *     label: 'Joined',
 *     format: 'relative',
 *   }),
 *   DataGridColumns.roles({
 *     key: 'roles',
 *     label: 'Roles',
 *     onClick: (user) => openRoleManager(user.id),
 *   }),
 * ];
 * ```
 *
 * ## Adding Extra Properties:
 * Helper functions don't include all DataGridColumn properties (like `filterable`, `editable`).
 * Use the spread operator to add extra properties:
 *
 * ```tsx
 * const columns: DataGridColumn[] = [
 *   {
 *     ...DataGridColumns.date({
 *       key: 'date',
 *       label: 'Date',
 *       format: 'short',
 *     }),
 *     filterable: true,  // Add extra property
 *     editable: true,    // Add extra property
 *   },
 *   {
 *     ...DataGridColumns.relation({
 *       key: 'venue_id',
 *       label: 'Venue',
 *     }),
 *     editable: true,
 *     filterable: true,
 *   },
 * ];
 * ```
 *
 * ## Available Types:
 * - `text()` - Plain text display with optional formatting
 * - `image()` - Image with fallback, supports circle/square shapes
 * - `date()` - Date formatting (relative, short, long, datetime)
 * - `relation()` - Foreign key relationships with optional links
 * - `roles()` - Role badges with icons and click handlers
 * - `badgeList()` - List of badges (tags, categories, etc.)
 * - `link()` - Clickable links (internal or external)
 */
export const DataGridColumns = {
    /**
     * Text column - basic text display
     */
    text: (config) => ({
        key: config.key,
        label: config.label,
        sortable: config.sortable,
        filterable: config.filterable,
        editable: config.editable,
        width: config.width,
    }),
    /**
     * Image column - displays images with fallback and upload functionality
     */
    image: (config) => ({
        key: config.key,
        label: config.label,
        width: config.width || '75px',
        render: (value, row) => (_jsx(ImageCell, { value: value, alt: config.alt, fallback: config.fallback, shape: config.shape, entityType: config.entityType, entityName: config.entityName, editable: config.editable, bucket: config.bucket, storagePath: config.storagePath, onImageUpdate: config.onImageUpdate
                ? (newUrl) => config.onImageUpdate(row, newUrl)
                : undefined })),
    }),
    /**
     * Date column - formatted date display
     */
    date: (config) => ({
        key: config.key,
        label: config.label,
        sortable: config.sortable ?? true,
        width: config.width || '150px',
        render: (value) => (_jsx(DateCell, { value: value, format: config.format, emptyText: config.emptyText })),
    }),
    /**
     * Relation column - displays related entity with optional link
     */
    relation: (config) => ({
        key: config.key,
        label: config.label,
        sortable: config.sortable,
        width: config.width,
        render: (value, row) => (_jsx(RelationCell, { value: value, label: config.getLabel?.(row), href: config.getHref?.(row), external: config.external, emptyText: config.emptyText })),
    }),
    /**
     * Roles column - displays user roles with optional click handler
     */
    roles: (config) => ({
        key: config.key,
        label: config.label,
        width: config.width || '200px',
        render: (value, row) => (_jsx(RoleCell, { roles: value, onClick: config.onClick ? () => config.onClick(row) : undefined, emptyText: config.emptyText })),
    }),
    /**
     * Badge list column - displays array of items as badges
     */
    badgeList: (config) => ({
        key: config.key,
        label: config.label,
        width: config.width || '200px',
        render: (value) => (_jsx(BadgeListCell, { items: value, variant: config.variant, emptyText: config.emptyText })),
    }),
    /**
     * Link column - displays a clickable link
     */
    link: (config) => ({
        key: config.key,
        label: config.label,
        width: config.width,
        render: (value, row) => (_jsx(RelationCell, { value: value, href: config.getHref(row), external: config.external })),
    }),
    /**
     * Address column - displays formatted multi-line address
     */
    address: (config) => ({
        key: config.keys.line1,
        label: config.label,
        sortable: config.sortable,
        width: config.width || '250px',
        render: (_value, row) => {
            const parts = [
                row[config.keys.line1],
                row[config.keys.line2],
                [
                    row[config.keys.city],
                    row[config.keys.state],
                ]
                    .filter(Boolean)
                    .join(', '),
                row[config.keys.zipCode],
            ].filter(Boolean);
            return parts.length > 0 ? (_jsx("span", { className: "text-sm", children: parts.join(', ') })) : (_jsx("span", { className: "text-xs text-muted-foreground", children: "\u2014" }));
        },
    }),
    /**
     * JSON column - displays JSONB data as expandable key-value pairs
     */
    json: (config) => ({
        key: config.key,
        label: config.label,
        width: config.width || '200px',
        render: (_value, row) => {
            const jsonData = row[config.key];
            return (_jsx(JsonCell, { data: jsonData || null, maxHeight: config.maxHeight, formatValue: config.formatValue }));
        },
    }),
};

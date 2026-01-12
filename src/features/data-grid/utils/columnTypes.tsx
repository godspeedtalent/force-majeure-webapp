import { LucideIcon } from 'lucide-react';
import { DataGridColumn } from '../types';
import { AddressCell } from '../components/cells/AddressCell';
import { ImageCell } from '../components/cells/ImageCell';
import { DateCell } from '../components/cells/DateCell';
import { RelationCell } from '../components/cells/RelationCell';
import { RoleCell } from '../components/cells/RoleCell';
import { BadgeListCell } from '../components/cells/BadgeListCell';
import { JsonCell } from '../cells/JsonCell';
import { EntityType } from '@/components/common/display/FmEntityAvatar';
import { AddressData } from '@/components/common/modals/FmAddressEditModal';

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
  text: <T = any,>(config: {
    key: keyof T | string;
    label: string;
    sortable?: boolean;
    filterable?: boolean;
    editable?: boolean;
    width?: string;
  }): DataGridColumn<T> => ({
    key: config.key as string,
    label: config.label,
    sortable: config.sortable,
    filterable: config.filterable,
    editable: config.editable,
    width: config.width,
  }),

  /**
   * Image column - displays images with fallback and upload functionality
   */
  image: <T = any,>(config: {
    key: keyof T | string;
    label: string;
    alt?: string;
    fallback?: string;
    shape?: 'square' | 'circle';
    width?: string;
    entityType?: EntityType;
    entityName?: string;
    editable?: boolean;
    bucket?: string;
    storagePath?: string;
    onImageUpdate?: (row: T, newImageUrl: string) => void;
  }): DataGridColumn<T> => ({
    key: config.key as string,
    label: config.label,
    width: config.width || '75px',
    isImage: true, // Mark as image column for mobile layout
    render: (value: any, row: T) => (
      <ImageCell
        value={value as string}
        alt={config.alt}
        fallback={config.fallback}
        shape={config.shape}
        entityType={config.entityType}
        entityName={config.entityName}
        editable={config.editable}
        bucket={config.bucket}
        storagePath={config.storagePath}
        onImageUpdate={
          config.onImageUpdate
            ? (newUrl) => config.onImageUpdate!(row, newUrl)
            : undefined
        }
      />
    ),
  }),

  /**
   * Date column - formatted date display
   */
  date: <T = any,>(config: {
    key: keyof T | string;
    label: string;
    format?: 'relative' | 'short' | 'long' | 'datetime';
    sortable?: boolean;
    width?: string;
    emptyText?: string;
  }): DataGridColumn<T> => ({
    key: config.key as string,
    label: config.label,
    sortable: config.sortable ?? true,
    width: config.width || '150px',
    render: (value: any) => (
      <DateCell
        value={value as string | Date}
        format={config.format}
        emptyText={config.emptyText}
      />
    ),
  }),

  /**
   * Relation column - displays related entity with optional link and icon
   */
  relation: <T = any,>(config: {
    key: keyof T | string;
    label: string;
    getLabel?: (row: T) => string;
    getHref?: (row: T) => string;
    /** Optional function to get the entity's image URL (displayed instead of icon if available) */
    getImageUrl?: (row: T) => string | null | undefined;
    external?: boolean;
    sortable?: boolean;
    width?: string;
    emptyText?: string;
    /** Optional icon to display before the label (used as fallback if no image) */
    icon?: LucideIcon;
  }): DataGridColumn<T> => ({
    key: config.key as string,
    label: config.label,
    sortable: config.sortable,
    width: config.width,
    render: (value: any, row: T) => (
      <RelationCell
        value={value as string}
        label={config.getLabel?.(row)}
        href={config.getHref?.(row)}
        external={config.external}
        emptyText={config.emptyText}
        icon={config.icon}
        imageUrl={config.getImageUrl?.(row) ?? null}
      />
    ),
  }),

  /**
   * Roles column - displays user roles with optional click handler
   */
  roles: <T = any,>(config: {
    key: keyof T | string;
    label: string;
    onClick?: (row: T) => void;
    width?: string;
    emptyText?: string;
  }): DataGridColumn<T> => ({
    key: config.key as string,
    label: config.label,
    width: config.width || '200px',
    render: (value: any, row: T) => (
      <RoleCell
        roles={value as any}
        onClick={config.onClick ? () => config.onClick!(row) : undefined}
        emptyText={config.emptyText}
      />
    ),
  }),

  /**
   * Badge list column - displays array of items as badges
   */
  badgeList: <T = any,>(config: {
    key: keyof T | string;
    label: string;
    variant?: 'default' | 'gold' | 'muted';
    width?: string;
    emptyText?: string;
  }): DataGridColumn<T> => ({
    key: config.key as string,
    label: config.label,
    width: config.width || '200px',
    render: (value: any) => (
      <BadgeListCell
        items={value as string[]}
        variant={config.variant}
        emptyText={config.emptyText}
      />
    ),
  }),

  /**
   * Link column - displays a clickable link
   */
  link: <T = any,>(config: {
    key: keyof T | string;
    label: string;
    getHref: (row: T) => string;
    external?: boolean;
    width?: string;
  }): DataGridColumn<T> => ({
    key: config.key as string,
    label: config.label,
    width: config.width,
    render: (value: any, row: T) => (
      <RelationCell
        value={value as string}
        href={config.getHref(row)}
        external={config.external}
      />
    ),
  }),

  /**
   * Address column - displays formatted multi-line address with optional edit modal
   *
   * When editable=true, clicking the address opens a modal to edit all address fields.
   * The onAddressUpdate callback receives the updated AddressData object with all fields.
   */
  address: <T = any,>(config: {
    keys: {
      line1: keyof T | string;
      line2?: keyof T | string;
      city?: keyof T | string;
      state?: keyof T | string;
      zipCode?: keyof T | string;
      country?: keyof T | string;
    };
    label: string;
    sortable?: boolean;
    width?: string;
    editable?: boolean;
    onAddressUpdate?: (row: T, address: AddressData) => void;
  }): DataGridColumn<T> => ({
    key: config.keys.line1 as string,
    label: config.label,
    sortable: config.sortable,
    width: config.width || '250px',
    render: (_value: any, row: T) => {
      // Build address data object from row
      const addressData: AddressData = {
        line1: (row[config.keys.line1 as keyof T] as string) || null,
        line2: config.keys.line2
          ? (row[config.keys.line2 as keyof T] as string) || null
          : null,
        city: config.keys.city
          ? (row[config.keys.city as keyof T] as string) || null
          : null,
        state: config.keys.state
          ? (row[config.keys.state as keyof T] as string) || null
          : null,
        zipCode: config.keys.zipCode
          ? (row[config.keys.zipCode as keyof T] as string) || null
          : null,
        country: config.keys.country
          ? (row[config.keys.country as keyof T] as string) || null
          : null,
      };

      return (
        <AddressCell
          address={addressData}
          editable={config.editable}
          onAddressUpdate={
            config.onAddressUpdate
              ? (newAddress) => config.onAddressUpdate!(row, newAddress)
              : undefined
          }
        />
      );
    },
  }),

  /**
   * JSON column - displays JSONB data as expandable key-value pairs
   */
  json: <T = any,>(config: {
    key: keyof T | string;
    label: string;
    maxHeight?: string;
    formatValue?: (key: string, value: any) => string;
    width?: string;
  }): DataGridColumn<T> => ({
    key: config.key as string,
    label: config.label,
    width: config.width || '200px',
    render: (_value: any, row: T) => {
      const jsonData = row[config.key as keyof T] as Record<string, any> | null | undefined;
      return (
        <JsonCell
          data={jsonData || null}
          maxHeight={config.maxHeight}
          formatValue={config.formatValue}
        />
      );
    },
  }),
};


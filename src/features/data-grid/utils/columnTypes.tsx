import { DataGridColumn } from '../types';
import { ImageCell } from '../components/cells/ImageCell';
import { DateCell } from '../components/cells/DateCell';
import { RelationCell } from '../components/cells/RelationCell';
import { RoleCell } from '../components/cells/RoleCell';
import { BadgeListCell } from '../components/cells/BadgeListCell';
import { EntityType } from '@/components/common/display/FmEntityAvatar';
import {
  Type,
  Hash,
  Mail,
  Link as LinkIcon,
  Calendar,
  ToggleLeft,
  Clock,
  ImageIcon,
  Users,
  Shield,
  Tag,
} from 'lucide-react';

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
    icon?: React.ReactNode;
  }): DataGridColumn<T> => ({
    key: config.key as string,
    label: config.label,
    icon: config.icon || <Type className='h-4 w-4' />,
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
    icon?: React.ReactNode;
  }): DataGridColumn<T> => ({
    key: config.key as string,
    label: config.label,
    icon: config.icon || <ImageIcon className='h-4 w-4' />,
    width: config.width || '75px',
    cellClassName: 'p-0', // Remove default TableCell padding for images
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
    icon?: React.ReactNode;
  }): DataGridColumn<T> => ({
    key: config.key as string,
    label: config.label,
    icon: config.icon || <Calendar className='h-4 w-4' />,
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
   * Relation column - displays related entity with optional link
   */
  relation: <T = any,>(config: {
    key: keyof T | string;
    label: string;
    getLabel?: (row: T) => string;
    getHref?: (row: T) => string;
    external?: boolean;
    sortable?: boolean;
    width?: string;
    emptyText?: string;
    icon?: React.ReactNode;
  }): DataGridColumn<T> => ({
    key: config.key as string,
    label: config.label,
    icon: config.icon || <Users className='h-4 w-4' />,
    sortable: config.sortable,
    width: config.width,
    render: (value: any, row: T) => (
      <RelationCell
        value={value as string}
        label={config.getLabel?.(row)}
        href={config.getHref?.(row)}
        external={config.external}
        emptyText={config.emptyText}
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
    icon?: React.ReactNode;
  }): DataGridColumn<T> => ({
    key: config.key as string,
    label: config.label,
    icon: config.icon || <Shield className='h-4 w-4' />,
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
    icon?: React.ReactNode;
  }): DataGridColumn<T> => ({
    key: config.key as string,
    label: config.label,
    icon: config.icon || <Tag className='h-4 w-4' />,
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
    icon?: React.ReactNode;
  }): DataGridColumn<T> => ({
    key: config.key as string,
    label: config.label,
    icon: config.icon || <LinkIcon className='h-4 w-4' />,
    width: config.width,
    render: (value: any, row: T) => (
      <RelationCell
        value={value as string}
        href={config.getHref(row)}
        external={config.external}
      />
    ),
  }),
};


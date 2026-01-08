import { ReactNode, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FmConfigurableDataGrid,
  DataGridAction,
  DataGridColumn,
} from '@/features/data-grid';
import { FmCommonConfirmDialog } from '@/components/common/modals/FmCommonConfirmDialog';
import { FmFormSectionHeader } from '@/components/common/forms/FmFormSectionHeader';
import { useDeleteConfirmation, type UseDeleteConfirmationOptions } from '@/shared';
import { Trash2 } from 'lucide-react';

export interface FmCommonAdminGridPageProps<T extends { id: string }> {
  /** Page title */
  title: string;
  /** Page description */
  description: string;
  /** Unique grid identifier for persistence */
  gridId: string;
  /** Data to display in grid */
  data: T[];
  /** Column definitions */
  columns: DataGridColumn[];
  /** Whether data is loading */
  loading?: boolean;
  /** Number of rows per page */
  pageSize?: number;
  /** Resource name for empty states (e.g., "Event", "User") */
  resourceName: string;
  /** Handler for inline updates */
  onUpdate?: (row: T, columnKey: string, newValue: unknown) => Promise<void>;
  /** Label for create button (if provided, shows create button) */
  createButtonLabel?: string;
  /** Handler for create button click */
  onCreateButtonClick?: () => void;
  /** Additional context menu actions (delete is added automatically) */
  contextMenuActions?: DataGridAction[];
  /** Configuration for delete confirmation */
  deleteConfig: Omit<UseDeleteConfirmationOptions<T>, 'source'>;
  /** Get the label to identify an item in delete confirmation (e.g., row.name) */
  getItemLabel: (item: T) => string;
  /** Delete dialog title */
  deleteDialogTitle: string;
  /** Translation key for single item delete confirm message (receives {itemName}) */
  deleteConfirmSingleKey: string;
  /** Translation key for multiple items delete confirm message (receives {count}) */
  deleteConfirmMultipleKey: string;
  /** Additional content to render (e.g., create dialog) */
  children?: ReactNode;
  /** Custom delete context action label (defaults to common.table.delete) */
  deleteActionLabel?: string;
  /** Whether to include the delete action in context menu (default: true) */
  includeDeleteAction?: boolean;
}

/**
 * Common admin grid page layout with standardized structure:
 * - Page header (title + description)
 * - FmConfigurableDataGrid
 * - Delete confirmation dialog
 *
 * Reduces boilerplate for admin management pages by ~40-60 lines per page.
 *
 * @example
 * ```tsx
 * <FmCommonAdminGridPage
 *   title={t('pageTitles.eventsManagement')}
 *   description={t('pageTitles.eventsManagementDescription')}
 *   gridId="events"
 *   data={events}
 *   columns={columns}
 *   loading={isLoading}
 *   resourceName="Event"
 *   deleteConfig={{
 *     table: 'events',
 *     queryKey: ['events'],
 *     messages: { ... }
 *   }}
 *   getItemLabel={(event) => event.title}
 *   deleteDialogTitle={t('table.deleteEvent')}
 *   deleteConfirmSingleKey="dialogs.deleteEventConfirm"
 *   deleteConfirmMultipleKey="dialogs.deleteEventsConfirm"
 *   contextMenuActions={[
 *     { label: 'Edit', icon: <Edit />, onClick: (row) => navigate(`/edit/${row.id}`) }
 *   ]}
 *   createButtonLabel={t('table.addEvent')}
 *   onCreateButtonClick={() => navigate('/events/create')}
 * />
 * ```
 */
export function FmCommonAdminGridPage<T extends { id: string }>({
  title,
  description,
  gridId,
  data,
  columns,
  loading = false,
  pageSize = 15,
  resourceName,
  onUpdate,
  createButtonLabel,
  onCreateButtonClick,
  contextMenuActions = [],
  deleteConfig,
  getItemLabel,
  deleteDialogTitle,
  deleteConfirmSingleKey,
  deleteConfirmMultipleKey,
  children,
  deleteActionLabel,
  includeDeleteAction = true,
}: FmCommonAdminGridPageProps<T>) {
  const { t } = useTranslation('common');

  // Delete confirmation hook
  const {
    showConfirm: showDeleteConfirm,
    itemsToDelete,
    isDeleting,
    openConfirm: handleDeleteClick,
    confirmDelete: handleDelete,
    setShowConfirm: setShowDeleteConfirm,
  } = useDeleteConfirmation<T>({
    ...deleteConfig,
    source: `${resourceName}Management`,
  });

  // Generate delete confirmation message
  const getDeleteConfirmMessage = useCallback(() => {
    if (itemsToDelete.length === 1) {
      return t(deleteConfirmSingleKey, { itemName: getItemLabel(itemsToDelete[0]) });
    }
    return t(deleteConfirmMultipleKey, { count: itemsToDelete.length });
  }, [itemsToDelete, t, deleteConfirmSingleKey, deleteConfirmMultipleKey, getItemLabel]);

  // Build context menu actions with delete at the end
  const allContextActions: DataGridAction[] = [
    ...contextMenuActions,
    ...(includeDeleteAction
      ? [
          {
            label: deleteActionLabel || t('table.delete'),
            icon: <Trash2 className='h-4 w-4' />,
            onClick: handleDeleteClick,
            variant: 'destructive' as const,
          },
        ]
      : []),
  ];

  return (
    <div className='space-y-6'>
      {/* Header */}
      <FmFormSectionHeader
        title={title}
        description={description}
      />

      {/* Data Grid */}
      <FmConfigurableDataGrid
        gridId={gridId}
        data={data}
        columns={columns}
        contextMenuActions={allContextActions}
        loading={loading}
        pageSize={pageSize}
        resourceName={resourceName}
        onUpdate={onUpdate}
        createButtonLabel={createButtonLabel}
        onCreateButtonClick={onCreateButtonClick}
      />

      {/* Delete Confirmation Dialog */}
      <FmCommonConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={deleteDialogTitle}
        description={getDeleteConfirmMessage()}
        confirmText={t('buttons.delete')}
        onConfirm={handleDelete}
        variant='destructive'
        isLoading={isDeleting}
      />

      {/* Additional content (e.g., create dialogs) */}
      {children}
    </div>
  );
}

FmCommonAdminGridPage.displayName = 'FmCommonAdminGridPage';

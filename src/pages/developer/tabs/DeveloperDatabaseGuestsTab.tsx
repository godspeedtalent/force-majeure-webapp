import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, Trash2, Users } from 'lucide-react';
import { DataGridAction, FmConfigurableDataGrid } from '@/features/data-grid';
import { FmCommonConfirmDialog } from '@/components/common/modals/FmCommonConfirmDialog';
import { FmSectionHeader } from '@/components/common/display/FmSectionHeader';
import { createGuestColumns } from '@/pages/admin/config/adminGridColumns';
import { useGuestsData, GuestRecord } from '../hooks/useDeveloperDatabaseData';

export function DeveloperDatabaseGuestsTab() {
  const { t } = useTranslation('common');
  const { guests, isLoading, handleUpdate, handleDelete, handleAddressUpdate } = useGuestsData();

  // Create columns with address update handler
  const columns = useMemo(
    () => createGuestColumns({ onAddressUpdate: handleAddressUpdate }),
    [handleAddressUpdate]
  );

  const [guestToDelete, setGuestToDelete] = useState<GuestRecord | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = (guest: GuestRecord) => {
    setGuestToDelete(guest);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!guestToDelete) return;
    await handleDelete(guestToDelete);
    setShowDeleteConfirm(false);
    setGuestToDelete(null);
  };

  const contextActions: DataGridAction[] = [
    {
      label: t('devTools.database.viewGuest'),
      icon: <Eye className='h-4 w-4' />,
      onClick: (_guest: GuestRecord) => {
        // Guests don't have a dedicated view page
        // Could potentially link to their orders in the future
      },
      disabled: true,
    },
    {
      label: t('devTools.database.deleteGuest'),
      icon: <Trash2 className='h-4 w-4' />,
      onClick: handleDeleteClick,
      variant: 'destructive',
    },
  ];

  return (
    <div className='space-y-6'>
      <FmSectionHeader
        title={t('pageTitles.guestsManagement')}
        description={t('pageTitles.guestsManagementDescription')}
        icon={Users}
      />

      <FmConfigurableDataGrid
        gridId='dev-guests'
        data={guests}
        columns={columns}
        contextMenuActions={contextActions}
        loading={isLoading}
        pageSize={15}
        onUpdate={(row, columnKey, newValue) => handleUpdate(row as GuestRecord, columnKey, newValue)}
        resourceName='Guest'
      />

      <FmCommonConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t('devTools.database.deleteGuest')}
        description={t('devTools.database.confirmDeleteGuest', { email: guestToDelete?.email })}
        confirmText={t('buttons.delete')}
        onConfirm={handleConfirmDelete}
        variant="destructive"
      />
    </div>
  );
}

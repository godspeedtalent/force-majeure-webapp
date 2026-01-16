import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Trash2 } from 'lucide-react';
import { DataGridAction, FmConfigurableDataGrid } from '@/features/data-grid';
import { FmCommonConfirmDialog } from '@/components/common/modals/FmCommonConfirmDialog';
import { FmSectionHeader } from '@/components/common/display/FmSectionHeader';
import { venueColumns } from '@/pages/admin/config/adminGridColumns';
import { useVenuesData, VenueRecord } from '../hooks/useDeveloperDatabaseData';

export function DeveloperDatabaseVenuesTab() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { venues, isLoading, handleUpdate, handleDelete } = useVenuesData();

  const [venueToDelete, setVenueToDelete] = useState<VenueRecord | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = (venue: VenueRecord) => {
    setVenueToDelete(venue);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!venueToDelete) return;
    await handleDelete(venueToDelete);
    setShowDeleteConfirm(false);
    setVenueToDelete(null);
  };

  const contextActions: DataGridAction[] = [
    {
      label: t('devTools.database.editVenue'),
      icon: <MapPin className='h-4 w-4' />,
      onClick: (venue: VenueRecord) => navigate(`/venues/${venue.id}/manage`),
    },
    {
      label: t('devTools.database.deleteVenue'),
      icon: <Trash2 className='h-4 w-4' />,
      onClick: handleDeleteClick,
      variant: 'destructive',
    },
  ];

  return (
    <div className='space-y-6'>
      <FmSectionHeader
        title={t('pageTitles.venuesManagement')}
        description={t('pageTitles.venuesManagementDescription')}
        icon={MapPin}
      />

      <FmConfigurableDataGrid
        gridId='dev-venues'
        data={venues}
        columns={venueColumns}
        contextMenuActions={contextActions}
        loading={isLoading}
        pageSize={15}
        onUpdate={(row, columnKey, newValue) => handleUpdate(row as VenueRecord, columnKey, newValue)}
        resourceName='Venue'
        createButtonLabel={t('table.addVenue')}
        onCreateButtonClick={() => navigate('/venues/create')}
      />

      <FmCommonConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t('devTools.database.deleteVenue')}
        description={t('devTools.database.confirmDeleteVenue', { name: venueToDelete?.name })}
        confirmText={t('buttons.delete')}
        onConfirm={handleConfirmDelete}
        variant="destructive"
      />
    </div>
  );
}

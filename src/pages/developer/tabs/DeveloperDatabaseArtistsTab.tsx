import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, Mic2, Trash2 } from 'lucide-react';
import { DataGridAction, FmConfigurableDataGrid } from '@/features/data-grid';
import { FmCommonConfirmDialog } from '@/components/common/modals/FmCommonConfirmDialog';
import { FmSectionHeader } from '@/components/common/display/FmSectionHeader';
import { artistColumns } from '@/pages/admin/config/adminGridColumns';
import { useArtistsData, ArtistRecord } from '../hooks/useDeveloperDatabaseData';

export function DeveloperDatabaseArtistsTab() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { artists, isLoading, handleUpdate, handleCreate, handleDelete } = useArtistsData();

  const [artistToDelete, setArtistToDelete] = useState<ArtistRecord | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = (artist: ArtistRecord) => {
    setArtistToDelete(artist);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!artistToDelete) return;
    await handleDelete(artistToDelete);
    setShowDeleteConfirm(false);
    setArtistToDelete(null);
  };

  const contextActions: DataGridAction[] = [
    {
      label: t('devTools.database.viewArtist'),
      icon: <Eye className='h-4 w-4' />,
      onClick: (artist: ArtistRecord) => navigate(`/artists/${artist.id}`),
    },
    {
      label: t('devTools.database.editArtist'),
      icon: <Mic2 className='h-4 w-4' />,
      onClick: (artist: ArtistRecord) => navigate(`/artists/${artist.id}/manage`),
    },
    {
      label: t('devTools.database.deleteArtist'),
      icon: <Trash2 className='h-4 w-4' />,
      onClick: handleDeleteClick,
      variant: 'destructive',
    },
  ];

  return (
    <div className='space-y-6'>
      <FmSectionHeader
        title='Artists Management'
        description='Manage artist profiles, genres, and metadata.'
        icon={Mic2}
      />

      <FmConfigurableDataGrid
        gridId='dev-artists'
        data={artists}
        columns={artistColumns}
        contextMenuActions={contextActions}
        loading={isLoading}
        pageSize={15}
        onUpdate={(row, columnKey, newValue) => handleUpdate(row as ArtistRecord, columnKey, newValue)}
        onCreate={handleCreate}
        resourceName='Artist'
        createButtonLabel='Add Artist'
        onCreateButtonClick={() => navigate('/artists/create')}
      />

      <FmCommonConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t('devTools.database.deleteArtist')}
        description={t('devTools.database.confirmDeleteArtist', { name: artistToDelete?.name })}
        confirmText={t('buttons.delete')}
        onConfirm={handleConfirmDelete}
        variant="destructive"
      />
    </div>
  );
}

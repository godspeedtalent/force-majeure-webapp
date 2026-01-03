import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, ExternalLink, RefreshCw, Star, Trash2 } from 'lucide-react';
import { DataGridAction, FmConfigurableDataGrid } from '@/features/data-grid';
import { FmCommonConfirmDialog } from '@/components/common/modals/FmCommonConfirmDialog';
import { recordingColumns } from '@/pages/admin/config/adminGridColumns';
import { useRecordingsData, RecordingRecord } from '../hooks/useDeveloperDatabaseData';

export function DeveloperDatabaseRecordingsTab() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { recordings, isLoading, handleUpdate, handleDelete, handleRefreshDetails } = useRecordingsData();

  const [recordingToDelete, setRecordingToDelete] = useState<RecordingRecord | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = (recording: RecordingRecord) => {
    setRecordingToDelete(recording);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!recordingToDelete) return;
    await handleDelete(recordingToDelete);
    setShowDeleteConfirm(false);
    setRecordingToDelete(null);
  };

  const contextActions: DataGridAction[] = [
    {
      label: 'View Recording Details',
      icon: <Eye className='h-4 w-4' />,
      onClick: (recording: RecordingRecord) => navigate(`/recordings/${recording.id}`),
    },
    {
      label: 'Rate Recording',
      icon: <Star className='h-4 w-4' />,
      onClick: (recording: RecordingRecord) => navigate(`/recordings/${recording.id}#ratings`),
    },
    {
      label: 'Go to Spotify',
      icon: <ExternalLink className='h-4 w-4' />,
      onClick: (recording: RecordingRecord) => {
        if (recording.url) {
          window.open(recording.url, '_blank', 'noopener,noreferrer');
        }
      },
      hidden: (recording: RecordingRecord) => recording.platform?.toLowerCase() !== 'spotify' || !recording.url,
    },
    {
      label: 'Go to SoundCloud',
      icon: <ExternalLink className='h-4 w-4' />,
      onClick: (recording: RecordingRecord) => {
        if (recording.url) {
          window.open(recording.url, '_blank', 'noopener,noreferrer');
        }
      },
      hidden: (recording: RecordingRecord) => recording.platform?.toLowerCase() !== 'soundcloud' || !recording.url,
    },
    {
      label: 'Refresh Details',
      icon: <RefreshCw className='h-4 w-4' />,
      onClick: handleRefreshDetails,
    },
    {
      label: 'Delete Recording',
      icon: <Trash2 className='h-4 w-4' />,
      onClick: handleDeleteClick,
      variant: 'destructive',
    },
  ];

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-canela font-bold text-foreground mb-2'>
          Recordings Management
        </h1>
        <p className='text-muted-foreground'>
          Manage artist recordings from Spotify and SoundCloud.
        </p>
      </div>

      <FmConfigurableDataGrid
        gridId='dev-recordings'
        data={recordings}
        columns={recordingColumns}
        contextMenuActions={contextActions}
        loading={isLoading}
        pageSize={15}
        onUpdate={(row, columnKey, newValue) => handleUpdate(row as RecordingRecord, columnKey, newValue)}
        resourceName='Recording'
      />

      <FmCommonConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title={t('devTools.database.deleteRecording')}
        description={t('devTools.database.confirmDeleteRecording', { name: recordingToDelete?.name })}
        confirmText={t('buttons.delete')}
        onConfirm={handleConfirmDelete}
        variant="destructive"
      />
    </div>
  );
}

/**
 * ArtistMusicTab
 *
 * Music tab for artist management - recordings grid with add/edit/delete.
 */

import { useTranslation } from 'react-i18next';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { FmCommonConfirmDialog } from '@/components/common/modals/FmCommonConfirmDialog';
import { FmI18nCommon } from '@/components/common/i18n';
import { FmRecordingsGrid } from '@/components/artist/FmRecordingsGrid';
import { AddRecordingModal } from '@/features/artists/components/AddRecordingModal';
import { EditRecordingModal } from '@/features/artists/components/EditRecordingModal';
import type {
  ArtistRecording,
  CreateRecordingData,
} from '@/shared/api/queries/recordingQueries';

interface ArtistMusicTabProps {
  artistId: string;
  recordings: ArtistRecording[];
  isRecordingsLoading: boolean;
  isAddRecordingModalOpen: boolean;
  onAddRecordingModalChange: (open: boolean) => void;
  editingRecording: ArtistRecording | null;
  onEditingRecordingChange: (recording: ArtistRecording | null) => void;
  recordingToDelete: ArtistRecording | null;
  onRecordingToDeleteChange: (recording: ArtistRecording | null) => void;
  isDeleting: boolean;
  onAddRecording: (data: CreateRecordingData) => void;
  onEditRecording: (recording: ArtistRecording) => void;
  onUpdateRecording: (recordingId: string, data: Partial<CreateRecordingData>) => void;
  onDeleteRecording: (recording: ArtistRecording) => void;
  onConfirmDeleteRecording: () => void;
  onRefetchRecording: (recording: ArtistRecording) => void;
  onSetPrimaryRecording: (recording: ArtistRecording) => void;
}

export function ArtistMusicTab({
  artistId,
  recordings,
  isRecordingsLoading,
  isAddRecordingModalOpen,
  onAddRecordingModalChange,
  editingRecording,
  onEditingRecordingChange,
  recordingToDelete,
  onRecordingToDeleteChange,
  isDeleting,
  onAddRecording,
  onEditRecording,
  onUpdateRecording,
  onDeleteRecording,
  onConfirmDeleteRecording,
  onRefetchRecording,
  onSetPrimaryRecording,
}: ArtistMusicTabProps) {
  const { t } = useTranslation('common');

  return (
    <div className='space-y-6'>
      <FmCommonCard size='lg' hoverable={false}>
        <div className='mb-6'>
          <FmI18nCommon i18nKey='sections.recordings' as='h2' className='text-xl font-semibold' />
          <FmI18nCommon i18nKey='sections.recordingsDescription' as='p' className='text-muted-foreground text-sm mt-1' />
        </div>

        {/* Recordings Grid */}
        <FmRecordingsGrid
          recordings={recordings}
          editable
          hideHeader
          columns={3}
          onEdit={onEditRecording}
          onDelete={onDeleteRecording}
          onRefetch={onRefetchRecording}
          onSetPrimary={onSetPrimaryRecording}
          onAdd={() => onAddRecordingModalChange(true)}
          isLoading={isRecordingsLoading}
          className='mt-0'
        />

        {/* Add Recording Modal */}
        <AddRecordingModal
          open={isAddRecordingModalOpen}
          onOpenChange={onAddRecordingModalChange}
          artistId={artistId}
          onAddRecording={onAddRecording}
        />

        {/* Edit Recording Modal */}
        <EditRecordingModal
          recording={editingRecording}
          onClose={() => onEditingRecordingChange(null)}
          onSave={(data) => {
            if (editingRecording) {
              onUpdateRecording(editingRecording.id, data);
            }
          }}
        />

        {/* Delete Confirmation Dialog */}
        <FmCommonConfirmDialog
          open={!!recordingToDelete}
          onOpenChange={(open) => !open && onRecordingToDeleteChange(null)}
          title={t('dialogs.deleteRecording')}
          description={t('dialogs.deleteRecordingConfirm', { name: recordingToDelete?.name })}
          confirmText={t('buttons.delete')}
          onConfirm={onConfirmDeleteRecording}
          variant='destructive'
          isLoading={isDeleting}
        />
      </FmCommonCard>
    </div>
  );
}

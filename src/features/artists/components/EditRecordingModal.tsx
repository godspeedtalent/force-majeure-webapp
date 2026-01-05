/**
 * EditRecordingModal Component
 *
 * Modal for editing an existing recording's details.
 * Works with the artist_recordings database table.
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Disc, Radio, ExternalLink, Music } from 'lucide-react';
import { FaSpotify, FaSoundcloud } from 'react-icons/fa6';
import { FmCommonModal } from '@/components/common/modals/FmCommonModal';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { cn } from '@/shared';
import type { ArtistRecording, UpdateRecordingData } from '@/shared/api/queries/recordingQueries';

interface EditRecordingModalProps {
  recording: ArtistRecording | null;
  onClose: () => void;
  onSave: (data: UpdateRecordingData) => void;
}

export function EditRecordingModal({ recording, onClose, onSave }: EditRecordingModalProps) {
  const { t } = useTranslation('common');
  const [name, setName] = useState('');
  const [isPrimaryDjSet, setIsPrimaryDjSet] = useState(false);

  // Reset state when recording changes
  useEffect(() => {
    if (recording) {
      setName(recording.name);
      setIsPrimaryDjSet(recording.is_primary_dj_set);
    }
  }, [recording]);

  const handleSave = () => {
    if (!recording) return;

    onSave({
      name,
      is_primary_dj_set: isPrimaryDjSet,
    });
  };

  if (!recording) return null;

  return (
    <FmCommonModal
      open={!!recording}
      onOpenChange={(open) => !open && onClose()}
      title={t('dialogs.editRecording')}
      description={t('dialogs.editRecordingDescription')}
    >
      <div className="space-y-6">
        {/* Recording Preview */}
        <FmCommonCard variant="default" className="p-0 overflow-hidden">
          <div className="flex gap-4">
            {/* Cover Art */}
            <div className="w-20 h-20 flex-shrink-0 relative">
              {recording.cover_art ? (
                <img
                  src={recording.cover_art}
                  alt={recording.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-fm-gold/20 to-fm-gold/5 flex items-center justify-center">
                  <Music className="h-6 w-6 text-fm-gold/50" />
                </div>
              )}
              {/* Platform badge */}
              <div className="absolute bottom-1 right-1">
                {recording.platform === 'spotify' ? (
                  <FaSpotify className="h-4 w-4 text-[#5aad7a] drop-shadow-lg" />
                ) : (
                  <FaSoundcloud className="h-4 w-4 text-[#d48968] drop-shadow-lg" />
                )}
              </div>
            </div>

            {/* Recording Info */}
            <div className="flex-1 py-2 pr-4">
              <p className="text-xs text-muted-foreground mb-1 capitalize">
                {recording.platform}
              </p>
              <a
                href={recording.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-fm-gold transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                {t('forms.tracks.preview')}
              </a>
            </div>
          </div>
        </FmCommonCard>

        {/* Name Input */}
        <FmCommonTextField
          label={t('labels.name')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('forms.tracks.namePlaceholder')}
        />

        {/* Recording Type Selector */}
        <div className="space-y-2">
          <label className="text-xs uppercase text-muted-foreground">{t('formLabels.recordingType')}</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsPrimaryDjSet(false)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-3 border transition-all',
                !isPrimaryDjSet
                  ? 'border-fm-gold bg-fm-gold/10 text-fm-gold'
                  : 'border-white/20 hover:border-white/40 text-muted-foreground'
              )}
            >
              <Disc className="h-4 w-4" />
              <span className="font-medium">{t('formLabels.track')}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsPrimaryDjSet(true)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-3 border transition-all',
                isPrimaryDjSet
                  ? 'border-fm-gold bg-fm-gold/10 text-fm-gold'
                  : 'border-white/20 hover:border-white/40 text-muted-foreground'
              )}
            >
              <Radio className="h-4 w-4" />
              <span className="font-medium">{t('formLabels.djSet')}</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <FmCommonButton
            variant="secondary"
            onClick={onClose}
          >
            {t('buttons.cancel')}
          </FmCommonButton>
          <FmCommonButton
            icon={Save}
            onClick={handleSave}
            disabled={!name.trim()}
          >
            {t('formActions.saveChanges')}
          </FmCommonButton>
        </div>
      </div>
    </FmCommonModal>
  );
}

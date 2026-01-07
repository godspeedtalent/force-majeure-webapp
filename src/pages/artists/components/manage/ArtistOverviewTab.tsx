/**
 * ArtistOverviewTab
 *
 * Overview tab for artist management - basic info, bio, and genres.
 */

import { useTranslation } from 'react-i18next';
import { Trash2, User } from 'lucide-react';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmFormSection } from '@/components/common/forms/FmFormSection';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmGenreMultiSelect } from '@/features/artists/components/FmGenreMultiSelect';
import type { Genre } from '@/features/artists/types';

interface ArtistOverviewTabProps {
  name: string;
  onNameChange: (value: string) => void;
  bio: string;
  onBioChange: (value: string) => void;
  selectedGenres: Genre[];
  onGenreChange: (genres: Genre[]) => void;
  onDeleteClick: () => void;
  isDeleting: boolean;
  // Save handled by parent via sticky footer
  onSave?: () => void;
  isSaving?: boolean;
}

export function ArtistOverviewTab({
  name,
  onNameChange,
  bio,
  onBioChange,
  selectedGenres,
  onGenreChange,
  onDeleteClick,
  isDeleting,
}: ArtistOverviewTabProps) {
  const { t } = useTranslation('common');

  return (
    <div className='space-y-6'>
      <FmFormSection
        title={t('sections.basicInformation')}
        description={t('sections.basicInformationDescription', 'Core details about this artist.')}
        icon={User}
      >
        <FmCommonTextField
          label={t('labels.artistName')}
          required
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={t('forms.artists.namePlaceholder')}
        />
        <div>
          <FmGenreMultiSelect
            selectedGenres={selectedGenres}
            onChange={onGenreChange}
            maxGenres={5}
            label={t('labels.genres')}
          />
        </div>

        <FmCommonTextField
          label={t('labels.bio')}
          multiline
          autoSize
          minRows={3}
          maxRows={15}
          value={bio}
          onChange={(e) => onBioChange(e.target.value)}
          placeholder={t('forms.artists.bioPlaceholder')}
        />
      </FmFormSection>

      {/* Delete button stays inline */}
      <div className='flex justify-start'>
        <FmCommonButton
          variant='destructive'
          icon={Trash2}
          onClick={onDeleteClick}
          disabled={isDeleting}
        >
          {isDeleting ? t('buttons.deleting') : t('buttons.deleteArtist')}
        </FmCommonButton>
      </div>
    </div>
  );
}

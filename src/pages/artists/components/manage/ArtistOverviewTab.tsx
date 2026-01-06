/**
 * ArtistOverviewTab
 *
 * Overview tab for artist management - basic info, bio, and genres.
 */

import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmI18nCommon } from '@/components/common/i18n';
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
      <FmCommonCard size='lg' hoverable={false}>
        <FmI18nCommon i18nKey='sections.basicInformation' as='h2' className='text-xl font-semibold mb-6' />

        <div className='space-y-4'>
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
        </div>
      </FmCommonCard>

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

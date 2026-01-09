import { useTranslation } from 'react-i18next';
import { Trash2, AlertTriangle } from 'lucide-react';
import { SiSoundcloud, SiSpotify } from 'react-icons/si';
import { FmCommonCard } from '@/components/common/display/FmCommonCard';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmGenreMultiSelect } from '@/features/artists/components/FmGenreMultiSelect';
import { FmCityDropdown } from '@/components/common/forms/FmCityDropdown';
import { FmFormSection } from '@/components/common/forms/FmFormSection';
import { FmI18nCommon } from '@/components/common/i18n';
import type { Genre } from '@/features/artists/types';

interface ArtistManageOverviewTabProps {
  // Basic info
  name: string;
  setName: (value: string) => void;
  bio: string;
  setBio: (value: string) => void;
  website: string;
  setWebsite: (value: string) => void;
  cityId: string | null;
  setCityId: (value: string | null) => void;
  
  // Music platform URLs
  soundcloudUrl: string;
  setSoundcloudUrl: (value: string) => void;
  spotifyUrl: string;
  setSpotifyUrl: (value: string) => void;
  
  // Genres
  selectedGenres: Genre[];
  onGenreChange: (genres: Genre[]) => void;
  
  // Actions
  triggerAutoSave: () => void;
  onSave: () => void;
  onDelete: () => void;
  isSaving: boolean;
  isDeleting: boolean;
  canDeleteDirectly: boolean;
  isArtistOwner: boolean;
}

export function ArtistManageOverviewTab({
  name,
  setName,
  bio,
  setBio,
  website,
  setWebsite,
  cityId,
  setCityId,
  soundcloudUrl,
  setSoundcloudUrl,
  spotifyUrl,
  setSpotifyUrl,
  selectedGenres,
  onGenreChange,
  triggerAutoSave,
  onSave: _onSave,
  onDelete,
  isSaving: _isSaving,
  isDeleting,
  canDeleteDirectly,
  isArtistOwner: _isArtistOwner,
}: ArtistManageOverviewTabProps) {
  const { t } = useTranslation('common');

  return (
    <div className='space-y-6 pb-24 md:pb-6'>
      <FmCommonCard size='lg' hoverable={false}>
        <FmI18nCommon i18nKey='sections.basicInformation' as='h2' className='text-xl font-semibold mb-6' />

        <div className='space-y-4'>
          <FmCommonTextField
            label={t('labels.artistName')}
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              triggerAutoSave();
            }}
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

          <FmCityDropdown
            value={cityId}
            onChange={(id) => {
              setCityId(id);
              triggerAutoSave();
            }}
            label={t('labels.city')}
            stateFilter="TX"
            placeholder={t('placeholders.selectCity')}
          />

          <FmCommonTextField
            label={t('labels.bio')}
            multiline
            autoSize
            minRows={3}
            maxRows={15}
            value={bio}
            onChange={(e) => {
              setBio(e.target.value);
              triggerAutoSave();
            }}
            placeholder={t('forms.artists.bioPlaceholder')}
          />

          <FmCommonTextField
            label={t('labels.website')}
            value={website}
            onChange={(e) => {
              setWebsite(e.target.value);
              triggerAutoSave();
            }}
            placeholder={t('forms.artists.websitePlaceholder')}
          />
        </div>
      </FmCommonCard>

      {/* Music Platform Links */}
      <FmCommonCard size='lg' hoverable={false}>
        <FmI18nCommon i18nKey='sections.musicPlatforms' as='h2' className='text-xl font-semibold mb-6' />
        <p className='text-muted-foreground text-sm mb-4'>{t('sections.musicPlatformsDescription')}</p>

        <div className='space-y-4'>
          <div className='flex items-center gap-3'>
            <SiSoundcloud className='h-5 w-5 text-[#d48968] flex-shrink-0' />
            <FmCommonTextField
              label={t('labels.soundcloudUrl')}
              value={soundcloudUrl}
              onChange={(e) => {
                setSoundcloudUrl(e.target.value);
                triggerAutoSave();
              }}
              placeholder={t('placeholders.exampleSoundcloudUrl')}
              className='flex-1'
            />
          </div>

          <div className='flex items-center gap-3'>
            <SiSpotify className='h-5 w-5 text-[#5aad7a] flex-shrink-0' />
            <FmCommonTextField
              label={t('labels.spotifyArtistUrl')}
              value={spotifyUrl}
              onChange={(e) => {
                setSpotifyUrl(e.target.value);
                triggerAutoSave();
              }}
              placeholder={t('placeholders.exampleSpotifyArtistUrl')}
              className='flex-1'
            />
          </div>
        </div>
      </FmCommonCard>

      {/* Danger Zone - Delete/Request Deletion */}
      <FmFormSection
        title={t('sections.dangerZone')}
        description={t('sections.dangerZoneDescription')}
        icon={AlertTriangle}
        className='border-fm-danger/30'
      >
        <div className='space-y-3'>
          <p className='text-sm text-muted-foreground'>
            {canDeleteDirectly
              ? t('artistManage.deleteArtistInfo')
              : t('artistManage.requestDeletionInfo')
            }
          </p>
          <FmCommonButton
            variant='destructive-outline'
            icon={Trash2}
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting
              ? t('buttons.processing')
              : canDeleteDirectly
                ? t('buttons.deleteArtist')
                : t('artistManage.requestArtistDeletion')
            }
          </FmCommonButton>
        </div>
      </FmFormSection>
    </div>
  );
}

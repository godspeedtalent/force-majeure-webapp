import { useTranslation } from 'react-i18next';
import { Save, Trash2, AlertCircle } from 'lucide-react';
import { SiSoundcloud, SiSpotify } from 'react-icons/si';
import { FmCommonCard } from '@/components/common/layout/FmCommonCard';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmGenreMultiSelect } from '@/features/artists/components/FmGenreMultiSelect';
import { FmCityDropdown } from '@/components/common/forms/FmCityDropdown';
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
  onSave,
  onDelete,
  isSaving,
  isDeleting,
  canDeleteDirectly,
  isArtistOwner,
}: ArtistManageOverviewTabProps) {
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
            rows={5}
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

      {/* Actions */}
      <div className='flex justify-between'>
        <FmCommonButton
          variant={canDeleteDirectly ? 'destructive' : 'destructive-outline'}
          icon={canDeleteDirectly ? Trash2 : AlertCircle}
          onClick={onDelete}
          disabled={isDeleting}
        >
          {isDeleting 
            ? t('buttons.deleting') 
            : canDeleteDirectly 
              ? t('buttons.deleteArtist')
              : t('buttons.requestDeletion')
          }
        </FmCommonButton>

        <FmCommonButton
          icon={Save}
          onClick={onSave}
          disabled={isSaving || !name}
        >
          {isSaving ? t('buttons.saving') : t('buttons.saveChanges')}
        </FmCommonButton>
      </div>

      {/* Info note for artist owners */}
      {isArtistOwner && !canDeleteDirectly && (
        <p className='text-xs text-muted-foreground text-center'>
          {t('artistManage.deletionRequiresApproval')}
        </p>
      )}
    </div>
  );
}

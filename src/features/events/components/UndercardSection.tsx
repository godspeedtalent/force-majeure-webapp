import { useTranslation } from 'react-i18next';
import { FmCommonRowManager } from '@/components/common/forms/FmCommonRowManager';
import { FmArtistSearchDropdown } from '@/components/common/search/FmArtistSearchDropdown';
import { EventFormState } from '../hooks/useEventData';

/**
 * UndercardSection Component
 *
 * Reusable form section for managing undercard artists.
 * Allows adding/removing up to 5 undercard artists.
 *
 * Shared between create and edit event flows.
 */

interface UndercardSectionProps {
  formState: EventFormState;
  setFormState: React.Dispatch<React.SetStateAction<EventFormState>>;
}

export const UndercardSection = ({
  formState,
  setFormState,
}: UndercardSectionProps) => {
  const { t } = useTranslation('common');

  const handleAdd = () => {
    setFormState(prev => ({
      ...prev,
      undercardArtists: [...prev.undercardArtists, { artistId: '' }],
    }));
  };

  const handleRemove = (index: number) => {
    setFormState(prev => ({
      ...prev,
      undercardArtists: prev.undercardArtists.filter((_, i) => i !== index),
    }));
  };

  const handleArtistChange = (index: number, artistId: string) => {
    setFormState(prev => {
      const updated = [...prev.undercardArtists];
      updated[index].artistId = artistId;
      return { ...prev, undercardArtists: updated };
    });
  };

  return (
    <FmCommonRowManager
      items={formState.undercardArtists}
      onAdd={handleAdd}
      onRemove={handleRemove}
      addLabel={t('undercardSection.addUndercardArtist')}
      minItems={0}
      maxItems={5}
      renderRow={(item, index) => (
        <FmArtistSearchDropdown
          value={item.artistId}
          onChange={id => handleArtistChange(index, id)}
          placeholder={t('undercardSection.searchPlaceholder')}
        />
      )}
    />
  );
};

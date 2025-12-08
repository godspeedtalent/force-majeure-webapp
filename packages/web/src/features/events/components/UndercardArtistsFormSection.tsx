import { FmCommonRowManager } from '@/components/common/forms/FmCommonRowManager';
import { FmArtistSearchDropdown } from '@/components/common/search/FmArtistSearchDropdown';
import { EventFormState, EventFormActions, UndercardArtist } from '../hooks/useEventFormState';

interface UndercardArtistsFormSectionProps {
  state: EventFormState;
  actions: EventFormActions;
}

/**
 * UndercardArtistsFormSection
 *
 * Shared form section for managing undercard artists.
 * Used by both FmCreateEventButton and FmEditEventButton.
 */
export function UndercardArtistsFormSection({
  state,
  actions,
}: UndercardArtistsFormSectionProps) {
  const handleAdd = () => {
    actions.setUndercardArtists([...state.undercardArtists, { artistId: '' }]);
  };

  const handleRemove = (index: number) => {
    actions.setUndercardArtists(state.undercardArtists.filter((_, i) => i !== index));
  };

  const handleUpdate = (index: number, artistId: string) => {
    const updated = [...state.undercardArtists];
    updated[index].artistId = artistId;
    actions.setUndercardArtists(updated);
  };

  return (
    <FmCommonRowManager
      items={state.undercardArtists}
      onAdd={handleAdd}
      onRemove={handleRemove}
      addLabel='Add Undercard Artist'
      minItems={0}
      maxItems={5}
      renderRow={(item: UndercardArtist, index: number) => (
        <FmArtistSearchDropdown
          value={item.artistId}
          onChange={artistId => handleUpdate(index, artistId)}
          placeholder='Search for undercard artist...'
        />
      )}
    />
  );
}

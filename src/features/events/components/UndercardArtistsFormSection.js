import { jsx as _jsx } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { FmCommonRowManager } from '@/components/common/forms/FmCommonRowManager';
import { FmArtistSearchDropdown } from '@/components/common/search/FmArtistSearchDropdown';
/**
 * UndercardArtistsFormSection
 *
 * Shared form section for managing undercard artists.
 * Used by both FmCreateEventButton and FmEditEventButton.
 */
export function UndercardArtistsFormSection({ state, actions, }) {
    const { t } = useTranslation('common');
    const handleAdd = () => {
        actions.setUndercardArtists([...state.undercardArtists, { artistId: '' }]);
    };
    const handleRemove = (index) => {
        actions.setUndercardArtists(state.undercardArtists.filter((_, i) => i !== index));
    };
    const handleUpdate = (index, artistId) => {
        const updated = [...state.undercardArtists];
        updated[index].artistId = artistId;
        actions.setUndercardArtists(updated);
    };
    return (_jsx(FmCommonRowManager, { items: state.undercardArtists, onAdd: handleAdd, onRemove: handleRemove, addLabel: t('formActions.addUndercardArtist'), minItems: 0, maxItems: 5, renderRow: (item, index) => (_jsx(FmArtistSearchDropdown, { value: item.artistId, onChange: artistId => handleUpdate(index, artistId), placeholder: t('forms.events.searchUndercard') })) }));
}

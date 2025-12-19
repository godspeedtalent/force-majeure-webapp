import { jsx as _jsx } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { FmCommonRowManager } from '@/components/common/forms/FmCommonRowManager';
import { FmArtistSearchDropdown } from '@/components/common/search/FmArtistSearchDropdown';
export const UndercardSection = ({ formState, setFormState, }) => {
    const { t } = useTranslation('common');
    const handleAdd = () => {
        setFormState(prev => ({
            ...prev,
            undercardArtists: [...prev.undercardArtists, { artistId: '' }],
        }));
    };
    const handleRemove = (index) => {
        setFormState(prev => ({
            ...prev,
            undercardArtists: prev.undercardArtists.filter((_, i) => i !== index),
        }));
    };
    const handleArtistChange = (index, artistId) => {
        setFormState(prev => {
            const updated = [...prev.undercardArtists];
            updated[index].artistId = artistId;
            return { ...prev, undercardArtists: updated };
        });
    };
    return (_jsx(FmCommonRowManager, { items: formState.undercardArtists, onAdd: handleAdd, onRemove: handleRemove, addLabel: t('undercardSection.addUndercardArtist'), minItems: 0, maxItems: 5, renderRow: (item, index) => (_jsx(FmArtistSearchDropdown, { value: item.artistId, onChange: id => handleArtistChange(index, id), placeholder: t('undercardSection.searchPlaceholder') })) }));
};

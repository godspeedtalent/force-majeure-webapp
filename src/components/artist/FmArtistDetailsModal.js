import { jsx as _jsx } from "react/jsx-runtime";
import { useMemo } from 'react';
import { FmResourceDetailsModal } from '@/components/common/modals/FmResourceDetailsModal';
const DEFAULT_DESCRIPTION = 'More information about this artist will be available soon. Check back closer to the event for set times, featured tracks, and exclusive interviews.';
export const FmArtistDetailsModal = ({ artist, open, onOpenChange, canManage = false, onManage, }) => {
    const badges = useMemo(() => {
        if (!artist?.genre)
            return [];
        return artist.genre
            .split(/[,/|]/)
            .map(genre => genre.trim())
            .filter(Boolean)
            .map(label => ({
            label,
            className: 'border-fm-gold/60 bg-fm-gold/10 text-fm-gold',
        }));
    }, [artist?.genre]);
    const handleManage = () => {
        if (artist?.id && onManage) {
            onManage(artist.id);
        }
    };
    return (_jsx(FmResourceDetailsModal, { open: open, onOpenChange: onOpenChange, title: artist?.name ?? 'Artist', eyebrow: 'Artist Spotlight', imageUrl: artist?.image, layout: 'side-by-side', badges: badges, canManage: canManage && !!artist?.id, onManage: handleManage, children: artist?.description ?? DEFAULT_DESCRIPTION }));
};

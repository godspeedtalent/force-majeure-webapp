import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { MapPin, ExternalLink } from 'lucide-react';
import { FmResourceDetailsModal } from '@/components/common/modals/FmResourceDetailsModal';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
const DEFAULT_DESCRIPTION = 'More information about this venue will be available soon. Check back closer to the event for directions, parking details, and venue guidelines.';
export const FmVenueDetailsModal = ({ venue, open, onOpenChange, canManage = false, onManage, }) => {
    const handleManage = () => {
        if (venue?.id && onManage) {
            onManage(venue.id);
        }
    };
    const fullAddress = useMemo(() => {
        return [venue?.address, venue?.city, venue?.state, venue?.zipCode]
            .filter(Boolean)
            .join(', ');
    }, [venue?.address, venue?.city, venue?.state, venue?.zipCode]);
    const metadata = useMemo(() => {
        if (!fullAddress)
            return [];
        return [
            {
                label: 'Address',
                value: fullAddress,
                icon: _jsx(MapPin, { className: 'w-4 h-4' }),
            },
        ];
    }, [fullAddress]);
    const actions = (_jsxs(_Fragment, { children: [venue?.googleMapsUrl && (_jsx(FmCommonButton, { size: 'sm', variant: 'secondary', icon: MapPin, onClick: () => window.open(venue.googleMapsUrl, '_blank'), className: 'bg-white/10 text-white hover:bg-white/20 px-4', children: "View on Maps" })), venue?.website && (_jsx(FmCommonButton, { size: 'sm', variant: 'secondary', icon: ExternalLink, onClick: () => window.open(venue.website, '_blank'), className: 'bg-white/10 text-white hover:bg-white/20 px-4', children: "Visit Website" }))] }));
    return (_jsx(FmResourceDetailsModal, { open: open, onOpenChange: onOpenChange, title: venue?.name ?? 'Venue', eyebrow: 'Venue Details', imageUrl: venue?.image, layout: 'hero', metadata: metadata, canManage: canManage && !!venue?.id, onManage: handleManage, actions: actions, children: venue?.description ?? DEFAULT_DESCRIPTION }));
};

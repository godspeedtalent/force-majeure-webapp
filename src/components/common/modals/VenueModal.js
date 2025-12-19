import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { logger } from '@/shared';
import { MapPin, Users } from 'lucide-react';
import { FmCommonModal } from '@/components/common/modals/FmCommonModal';
import { FmInfoChip } from '@/components/common/data/FmInfoChip';
import { venueService } from '@/features/venues/services/venueService';
/**
 * VenueModal - Displays venue information in a modal
 *
 * Features:
 * - Hero image (if available)
 * - Venue name and details
 * - Address, capacity, website info
 * - Consistent styling with Force Majeure design system
 */
export const VenueModal = ({ venueId, open, onOpenChange, }) => {
    const [venue, setVenue] = useState(null);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        if (venueId && open) {
            fetchVenue();
        }
    }, [venueId, open]);
    const fetchVenue = async () => {
        if (!venueId)
            return;
        setLoading(true);
        try {
            const data = await venueService.getVenueById(venueId);
            setVenue(data);
        }
        catch (error) {
            logger.error('Error fetching venue:', { error: error instanceof Error ? error.message : 'Unknown' });
        }
        finally {
            setLoading(false);
        }
    };
    if (loading) {
        return (_jsx(FmCommonModal, { open: open, onOpenChange: onOpenChange, title: 'Loading...', children: _jsx("div", { className: 'flex items-center justify-center py-8', children: _jsx("div", { className: 'animate-spin rounded-full h-8 w-8 border-b-2 border-fm-gold' }) }) }));
    }
    if (!venue) {
        return null;
    }
    return (_jsx(FmCommonModal, { open: open, onOpenChange: onOpenChange, title: venue.name, className: 'max-w-3xl', children: _jsxs("div", { className: 'space-y-6', children: [_jsxs("div", { className: 'space-y-4', children: [venue.address_line_1 && (_jsx(FmInfoChip, { icon: MapPin, label: `${venue.address_line_1}${venue.city ? `, ${venue.city}` : ''}` })), venue.capacity && (_jsx(FmInfoChip, { icon: Users, label: `Capacity: ${venue.capacity.toLocaleString()}` }))] }), _jsx("div", { className: 'pt-4 border-t border-white/10', children: _jsx("p", { className: 'text-sm text-white/70', children: venue.city ? `Located in ${venue.city}` : 'Venue information' }) })] }) }));
};

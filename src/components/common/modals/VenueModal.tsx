import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '@/shared';
import { MapPin, Users } from 'lucide-react';
import { FmCommonModal } from '@/components/common/modals/FmCommonModal';
import { FmInfoChip } from '@/components/common/data/FmInfoChip';
import { FmGoldenGridLoader } from '@/components/common/feedback/FmGoldenGridLoader';
import { venueService } from '@/features/venues/services/venueService';
import type { Venue } from '@/features/events/types';

interface VenueModalProps {
  venueId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * VenueModal - Displays venue information in a modal
 *
 * Features:
 * - Hero image (if available)
 * - Venue name and details
 * - Address, capacity, website info
 * - Consistent styling with Force Majeure design system
 */
export const VenueModal = ({
  venueId,
  open,
  onOpenChange,
}: VenueModalProps) => {
  const { t } = useTranslation('common');
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (venueId && open) {
      fetchVenue();
    }
  }, [venueId, open]);

  const fetchVenue = async () => {
    if (!venueId) return;

    setLoading(true);
    try {
      const data = await venueService.getVenueById(venueId);
      setVenue(data);
    } catch (error) {
      logger.error('Error fetching venue:', { error: error instanceof Error ? error.message : 'Unknown' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <FmCommonModal open={open} onOpenChange={onOpenChange} title={t('status.loading')}>
        <div className='flex items-center justify-center py-8'>
          <FmGoldenGridLoader size="md" />
        </div>
      </FmCommonModal>
    );
  }

  if (!venue) {
    return null;
  }

  return (
    <FmCommonModal
      open={open}
      onOpenChange={onOpenChange}
      title={venue.name}
      className='max-w-3xl'
    >
      <div className='space-y-6'>
        {/* Hero Image Placeholder - Can be enhanced later if venues get hero images */}
        {/* For now, we'll show venue info without a hero image */}

        {/* Venue Details */}
        <div className='space-y-4'>
          {venue.address_line_1 && (
            <FmInfoChip
              icon={MapPin}
              label={`${venue.address_line_1}${venue.city ? `, ${venue.city}` : ''}`}
            />
          )}

          {venue.capacity && (
            <FmInfoChip
              icon={Users}
              label={t('venueModal.capacity', { value: venue.capacity.toLocaleString() })}
            />
          )}
        </div>

        {/* Additional Info Section */}
        <div className='pt-4 border-t border-white/10'>
          <p className='text-sm text-white/70'>
            {venue.city ? t('venueModal.locatedIn', { city: venue.city }) : t('venueModal.venueInformation')}
          </p>
        </div>
      </div>
    </FmCommonModal>
  );
};

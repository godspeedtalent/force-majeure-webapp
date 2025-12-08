import { type ReactNode, useMemo } from 'react';
import { MapPin, ExternalLink } from 'lucide-react';

import { FmResourceDetailsModal } from '@/components/common/modals/FmResourceDetailsModal';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';

export interface FmVenueDetailsModalProps {
  venue: {
    id?: string;
    name: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    description?: ReactNode;
    image?: string | null;
    website?: string | null;
    googleMapsUrl?: string | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage?: boolean;
  onManage?: (venueId: string) => void;
}

const DEFAULT_DESCRIPTION =
  'More information about this venue will be available soon. Check back closer to the event for directions, parking details, and venue guidelines.';

export const FmVenueDetailsModal = ({
  venue,
  open,
  onOpenChange,
  canManage = false,
  onManage,
}: FmVenueDetailsModalProps) => {
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
    if (!fullAddress) return [];
    return [
      {
        label: 'Address',
        value: fullAddress,
        icon: <MapPin className='w-4 h-4' />,
      },
    ];
  }, [fullAddress]);

  const actions = (
    <>
      {venue?.googleMapsUrl && (
        <FmCommonButton
          size='sm'
          variant='secondary'
          icon={MapPin}
          onClick={() => window.open(venue.googleMapsUrl!, '_blank')}
          className='bg-white/10 text-white hover:bg-white/20 px-4'
        >
          View on Maps
        </FmCommonButton>
      )}
      {venue?.website && (
        <FmCommonButton
          size='sm'
          variant='secondary'
          icon={ExternalLink}
          onClick={() => window.open(venue.website!, '_blank')}
          className='bg-white/10 text-white hover:bg-white/20 px-4'
        >
          Visit Website
        </FmCommonButton>
      )}
    </>
  );

  return (
    <FmResourceDetailsModal
      open={open}
      onOpenChange={onOpenChange}
      title={venue?.name ?? 'Venue'}
      eyebrow='Venue Details'
      imageUrl={venue?.image}
      layout='hero'
      metadata={metadata}
      canManage={canManage && !!venue?.id}
      onManage={handleManage}
      actions={actions}
    >
      {venue?.description ?? DEFAULT_DESCRIPTION}
    </FmResourceDetailsModal>
  );
};

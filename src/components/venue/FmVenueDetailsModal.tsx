import { type ReactNode, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, ExternalLink, ArrowRight } from 'lucide-react';

import { FmResourceDetailsModal } from '@/components/common/modals/FmResourceDetailsModal';
import { FmCommonIconButton } from '@/components/common/buttons/FmCommonIconButton';
import { FmPortalTooltip } from '@/components/common/feedback/FmPortalTooltip';
import { FmVenueMap } from '@/components/common/display/FmVenueMap';

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
    logo?: string | null;
    website?: string | null;
    googleMapsUrl?: string | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage?: boolean;
  onManage?: (venueId: string) => void;
  /** Whether to show the venue map (default: true) */
  showMap?: boolean;
}

const DEFAULT_DESCRIPTION =
  'More information about this venue will be available soon. Check back closer to the event for directions, parking details, and venue guidelines.';

export const FmVenueDetailsModal = ({
  venue,
  open,
  onOpenChange,
  canManage = false,
  onManage,
  showMap = true,
}: FmVenueDetailsModalProps) => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  const handleManage = () => {
    if (venue?.id && onManage) {
      onManage(venue.id);
    }
  };

  const handleViewDetails = () => {
    if (venue?.id) {
      onOpenChange(false);
      navigate(`/venues/${venue.id}`);
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

  // Check if we have address data for the map
  const hasAddressData = venue?.address || venue?.city || venue?.state || venue?.zipCode;

  // Floating map for desktop - positioned in footer area, map-only (no address/buttons)
  const mapFooter = showMap && hasAddressData ? (
    <div className='relative'>
      {/* Mobile: Regular inline map */}
      <div className='lg:hidden'>
        <FmVenueMap
          addressLine1={venue?.address}
          city={venue?.city}
          state={venue?.state}
          zipCode={venue?.zipCode}
          size='md'
          showExternalLink={true}
          showFooter={true}
        />
      </div>
      {/* Desktop: Floating square map box */}
      <div className='hidden lg:block'>
        <div className='w-48 bg-black/80 backdrop-blur-lg border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.5)]'>
          <FmVenueMap
            addressLine1={venue?.address}
            city={venue?.city}
            state={venue?.state}
            zipCode={venue?.zipCode}
            size='sm'
            showExternalLink={false}
            showFooter={false}
          />
        </div>
      </div>
    </div>
  ) : null;

  const actions = (
    <>
      {venue?.id && (
        <FmPortalTooltip content={t('venueDetails.viewDetails')} side='top'>
          <FmCommonIconButton
            icon={ArrowRight}
            onClick={handleViewDetails}
            variant='default'
            size='sm'
            aria-label={t('venueDetails.viewDetails')}
          />
        </FmPortalTooltip>
      )}
      {venue?.website && (
        <FmPortalTooltip content={t('venueDetails.visitWebsite')} side='top'>
          <FmCommonIconButton
            icon={ExternalLink}
            onClick={() => window.open(venue.website!, '_blank')}
            variant='default'
            size='sm'
            aria-label={t('venueDetails.visitWebsite')}
          />
        </FmPortalTooltip>
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
      logoUrl={venue?.logo}
      layout='hero'
      metadata={metadata}
      canManage={canManage && !!venue?.id}
      onManage={handleManage}
      actions={actions}
      footer={mapFooter}
    >
      {venue?.description ?? DEFAULT_DESCRIPTION}
    </FmResourceDetailsModal>
  );
};

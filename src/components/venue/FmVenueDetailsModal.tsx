import { type ReactNode } from 'react';
import { MapPin, ExternalLink } from 'lucide-react';

import { FmCommonModal } from '@/components/common/modals/FmCommonModal';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { DialogTitle } from '@/components/common/shadcn/dialog';
import { cn } from '@/shared/utils/utils';

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
  const showManage = canManage && !!venue?.id && onManage;

  const handleManage = () => {
    if (venue?.id && onManage) {
      onManage(venue.id);
    }
  };

  const fullAddress = [
    venue?.address,
    venue?.city,
    venue?.state,
    venue?.zipCode,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <FmCommonModal
      open={open}
      onOpenChange={onOpenChange}
      title={venue?.name ?? 'Venue'}
      headerContent={
        <div className='flex justify-end pr-12'>
          <DialogTitle className='sr-only'>{venue?.name ?? 'Venue'}</DialogTitle>
          {showManage && (
            <FmCommonButton
              size='sm'
              variant='secondary'
              onClick={handleManage}
              className='bg-white/10 text-white hover:bg-white/20'
            >
              Manage
            </FmCommonButton>
          )}
        </div>
      }
      className='max-w-3xl'
    >
      <div className='flex flex-col gap-8 sm:flex-row sm:items-stretch'>
        <div className='sm:w-60 flex-shrink-0'>
          <div className='space-y-3'>
            <p className='text-[10px] uppercase tracking-[0.35em] text-white/50'>
              Venue Details
            </p>
            <h2 className='text-3xl font-canela font-semibold text-white leading-tight'>
              {venue?.name ?? 'Venue'}
            </h2>
          </div>
          <div className='mt-4 overflow-hidden rounded-xl border border-white/15 bg-white/5 shadow-inner'>
            {venue?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={venue.image}
                alt={venue.name}
                className='aspect-[4/3] w-full object-cover'
              />
            ) : (
              <div className='aspect-[4/3] w-full bg-gradient-to-br from-fm-gold/15 via-fm-gold/5 to-transparent flex items-center justify-center'>
                <MapPin className='w-16 h-16 text-fm-gold/30' />
              </div>
            )}
          </div>
        </div>

        <div className='flex-1 flex flex-col justify-center gap-6 sm:min-h-[320px]'>
          {fullAddress && (
            <div className='flex items-start gap-3 text-sm text-white/70'>
              <MapPin className='w-4 h-4 text-fm-gold flex-shrink-0 mt-0.5' />
              <span>{fullAddress}</span>
            </div>
          )}

          <div
            className={cn(
              'prose prose-invert max-w-none text-sm text-white/80 leading-relaxed',
              !venue?.description && 'italic text-white/60'
            )}
          >
            {venue?.description ?? DEFAULT_DESCRIPTION}
          </div>

          <div className='flex flex-wrap gap-3 mt-auto'>
            {venue?.googleMapsUrl && (
              <FmCommonButton
                size='sm'
                variant='secondary'
                onClick={() => window.open(venue.googleMapsUrl!, '_blank')}
                className='bg-white/10 text-white hover:bg-white/20'
              >
                <MapPin className='w-4 h-4 mr-2' />
                View on Maps
              </FmCommonButton>
            )}
            {venue?.website && (
              <FmCommonButton
                size='sm'
                variant='secondary'
                onClick={() => window.open(venue.website!, '_blank')}
                className='bg-white/10 text-white hover:bg-white/20'
              >
                <ExternalLink className='w-4 h-4 mr-2' />
                Visit Website
              </FmCommonButton>
            )}
          </div>
        </div>
      </div>
    </FmCommonModal>
  );
};

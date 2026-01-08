import { type ReactNode, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Settings, ChevronDown, X } from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

import { FmCommonIconButton } from '@/components/common/buttons/FmCommonIconButton';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonSlidingIconButton } from '@/components/common/buttons/FmCommonSlidingIconButton';
import { FmVenueMap } from '@/components/common/display/FmVenueMap';
import { FmSocialLinks } from '@/components/common/display/FmSocialLinks';
import { FmCommonExpandableText } from '@/components/common/display/FmCommonExpandableText';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/shared';

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
    instagram?: string | null;
    twitter?: string | null;
    facebook?: string | null;
    youtube?: string | null;
    tiktok?: string | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage?: boolean;
  onManage?: (venueId: string) => void;
  /** Whether to show the venue map (default: true) */
  showMap?: boolean;
}

interface VenueEvent {
  id: string;
  title: string | null;
  start_time: string;
  hero_image?: string | null;
  headliner?: { name: string } | null;
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
  const [showPastEvents, setShowPastEvents] = useState(false);

  // Fetch upcoming events for this venue
  const { data: upcomingEvents = [] } = useQuery({
    queryKey: ['venue-upcoming-events', venue?.id],
    queryFn: async (): Promise<VenueEvent[]> => {
      if (!venue?.id) return [];

      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          start_time,
          hero_image,
          headliner:artists!events_headliner_id_fkey(name)
        `)
        .eq('venue_id', venue.id)
        .eq('status', 'published')
        .gte('start_time', now)
        .order('start_time', { ascending: true })
        .limit(6);

      if (error) return [];
      return (data || []) as VenueEvent[];
    },
    enabled: open && !!venue?.id,
  });

  // Fetch past events for this venue (only when requested)
  const { data: pastEvents = [] } = useQuery({
    queryKey: ['venue-past-events', venue?.id],
    queryFn: async (): Promise<VenueEvent[]> => {
      if (!venue?.id) return [];

      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          start_time,
          hero_image,
          headliner:artists!events_headliner_id_fkey(name)
        `)
        .eq('venue_id', venue.id)
        .eq('status', 'published')
        .lt('start_time', now)
        .order('start_time', { ascending: false })
        .limit(12);

      if (error) return [];
      return (data || []) as VenueEvent[];
    },
    enabled: open && !!venue?.id && showPastEvents,
  });

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

  const hasAddressData = venue?.address || venue?.city || venue?.state || venue?.zipCode;

  const hasSocialLinks =
    venue?.website ||
    venue?.instagram ||
    venue?.twitter ||
    venue?.facebook ||
    venue?.youtube ||
    venue?.tiktok;

  const formatEventDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Combine upcoming events with past events when showing past
  const hasEvents = upcomingEvents.length > 0 || pastEvents.length > 0;

  // Event card renderer
  const renderEventCard = (event: VenueEvent, isPast: boolean = false) => (
    <button
      key={event.id}
      type='button'
      onClick={() => {
        onOpenChange(false);
        navigate(`/event/${event.id}`);
      }}
      className={cn(
        'group relative aspect-[4/3] overflow-hidden border border-white/10',
        'bg-black/40 transition-all duration-300',
        'hover:border-fm-gold/50 hover:shadow-[0_0_20px_rgba(223,186,125,0.2)]',
        isPast && 'opacity-70'
      )}
    >
      {event.hero_image ? (
        <img
          src={event.hero_image}
          alt={event.title || 'Event'}
          className='w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity'
        />
      ) : (
        <div className='w-full h-full bg-gradient-to-br from-fm-gold/10 to-transparent' />
      )}
      <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent' />
      <div className='absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm border-t border-white/10 px-3 py-2'>
        <p className='text-[10px] text-fm-gold mb-0.5'>
          {formatEventDate(event.start_time)}
        </p>
        <p className='text-xs text-white font-medium truncate'>
          {event.headliner?.name || event.title || 'Event'}
        </p>
      </div>
    </button>
  );

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className='fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0' />
        <DialogPrimitive.Content className='fixed left-[50%] top-[50%] z-[9999] w-[calc(100%-2rem)] sm:w-full max-w-3xl max-h-[90vh] translate-x-[-50%] translate-y-[-50%] p-0 gap-0 border-x-2 border-y-4 border-fm-gold/30 border-t-fm-gold border-b-fm-gold bg-gradient-to-br from-black/95 to-neutral-900/95 backdrop-blur-xl overflow-hidden flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.5)] duration-200 pointer-events-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95'>
          <DialogPrimitive.Title className='sr-only'>
            {venue?.name ?? t('venueDetails.defaultTitle')}
          </DialogPrimitive.Title>

          {/* Hero Image */}
          <div className='relative w-full h-64 flex-shrink-0 overflow-visible'>
            {/* Header bar with frosted glass background */}
            <div className='absolute top-4 left-4 right-4 flex items-center justify-between z-20 bg-black/50 backdrop-blur-md px-4 py-2 border border-white/10'>
              <p className='text-[10px] uppercase tracking-[0.35em] text-white/70'>
                {t('venueDetails.eyebrow', 'Venue Details')}
              </p>
              <div className='flex items-center gap-2'>
                {canManage && venue?.id && (
                  <FmCommonSlidingIconButton
                    icon={Settings}
                    label={t('venueDetails.manage', 'Manage')}
                    onClick={handleManage}
                    variant='secondary'
                    size='sm'
                    className='bg-white/10 text-white hover:bg-white/20 hover:text-fm-gold hover:shadow-[0_0_12px_rgba(207,173,118,0.3)]'
                  />
                )}
                <FmCommonIconButton
                  icon={X}
                  onClick={() => onOpenChange(false)}
                  variant='secondary'
                  size='sm'
                  aria-label={t('common.close')}
                  className='bg-white/10 text-white hover:bg-white/20 hover:text-fm-gold hover:shadow-[0_0_12px_rgba(207,173,118,0.3)]'
                />
              </div>
            </div>

            {/* Hero image */}
            <div className='w-full h-full overflow-hidden border-b-2 border-fm-gold'>
              {venue?.image ? (
                <img
                  src={venue.image}
                  alt={venue.name}
                  className='w-full h-full object-cover'
                />
              ) : (
                <div className='w-full h-full bg-gradient-to-br from-fm-gold/20 via-fm-gold/5 to-transparent' />
              )}
            </div>

            {/* Floating map - straddling hero and content */}
            {showMap && hasAddressData && (
              <div className='absolute -bottom-16 right-6 z-30 hidden lg:block'>
                <div className='w-44 bg-black/90 backdrop-blur-lg border-2 border-fm-gold shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_20px_rgba(223,186,125,0.15)]'>
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
            )}
          </div>

          {/* Scrollable content area */}
          <div className='flex-1 overflow-y-auto min-h-0'>
            {/* Title row with frosted glass - full width */}
            <div className='bg-black/60 backdrop-blur-md border-b border-white/10'>
              <div className='px-8 py-4 flex items-center gap-4 lg:pr-52'>
                {venue?.logo && (
                  <div className='flex-shrink-0 w-[50px] h-[50px] border-2 border-fm-gold overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(223,186,125,0.4)]'>
                    <img
                      src={venue.logo}
                      alt={`${venue.name} logo`}
                      className='w-full h-full object-cover'
                    />
                  </div>
                )}
                <h2 className='text-3xl font-canela font-semibold text-white leading-tight'>
                  {venue?.name ?? 'Venue'}
                </h2>
              </div>
            </div>

            <div className='p-8 flex flex-col gap-6'>

              {/* Address */}
              {fullAddress && (
                <div className='flex items-start gap-3 text-sm text-white/70'>
                  <MapPin className='flex-shrink-0 mt-0.5 text-fm-gold w-4 h-4' />
                  <span>{fullAddress}</span>
                </div>
              )}

              {/* Description */}
              <FmCommonExpandableText
                text={typeof venue?.description === 'string' ? venue.description : DEFAULT_DESCRIPTION}
                lineClamp={4}
                className='text-sm text-white/80'
                showMoreLabel={t('common.showMore', 'Show more')}
                showLessLabel={t('common.showLess', 'Show less')}
              />

              {/* Social Links */}
              {hasSocialLinks && (
                <div className='pt-2'>
                  <FmSocialLinks
                    website={venue?.website}
                    instagram={venue?.instagram}
                    twitter={venue?.twitter}
                    facebook={venue?.facebook}
                    youtube={venue?.youtube}
                    tiktok={venue?.tiktok}
                    size='sm'
                    gap='md'
                  />
                </div>
              )}

              {/* Mobile map */}
              {showMap && hasAddressData && (
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
              )}

              {/* Events Section */}
              {(hasEvents || !showPastEvents) && (
                <div className='pt-4 border-t border-white/10'>
                  <h3 className='text-sm uppercase tracking-[0.2em] text-white/50 mb-4'>
                    {t('venueDetails.events', 'Events')}
                  </h3>

                  {/* Upcoming events */}
                  {upcomingEvents.length > 0 && (
                    <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
                      {upcomingEvents.map(event => renderEventCard(event, false))}
                    </div>
                  )}

                  {/* No upcoming events message */}
                  {upcomingEvents.length === 0 && !showPastEvents && (
                    <p className='text-sm text-white/50 mb-4'>
                      {t('venueDetails.noUpcomingEvents', 'No upcoming events at this venue.')}
                    </p>
                  )}

                  {/* Past events */}
                  {showPastEvents && pastEvents.length > 0 && (
                    <div className={cn('grid grid-cols-2 sm:grid-cols-3 gap-3', upcomingEvents.length > 0 && 'mt-4')}>
                      {pastEvents.map(event => renderEventCard(event, true))}
                    </div>
                  )}

                  {/* Show past events button */}
                  {!showPastEvents && (
                    <FmCommonButton
                      variant='secondary'
                      size='sm'
                      icon={ChevronDown}
                      onClick={() => setShowPastEvents(true)}
                      className='mt-4'
                    >
                      {t('venueDetails.showPastEvents', 'Show past events')}
                    </FmCommonButton>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};

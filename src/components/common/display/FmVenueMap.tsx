import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, ExternalLink } from 'lucide-react';
import { cn } from '@/shared/utils/utils';
import {
  formatFullAddress,
  getGoogleMapsEmbedUrl,
  getGoogleMapsSearchUrl,
} from '@/shared/utils/addressUtils';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';

export interface FmVenueMapProps {
  /** Primary street address */
  addressLine1?: string | null;
  /** Secondary address (apt, suite, etc.) */
  addressLine2?: string | null;
  /** City name */
  city?: string | null;
  /** State code */
  state?: string | null;
  /** ZIP/postal code */
  zipCode?: string | null;
  /** Size variant for the map */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
  /** Whether to show the "View on Google Maps" button */
  showExternalLink?: boolean;
  /** Whether to show the footer with address and links (default: true) */
  showFooter?: boolean;
}

const SIZE_CONFIG = {
  sm: { height: 150, containerClass: 'p-2' },
  md: { height: 200, containerClass: 'p-3' },
  lg: { height: 300, containerClass: 'p-4' },
} as const;

export const FmVenueMap = ({
  addressLine1,
  addressLine2,
  city,
  state,
  zipCode,
  size = 'md',
  className,
  showExternalLink = true,
  showFooter = true,
}: FmVenueMapProps) => {
  const { t } = useTranslation('common');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const fullAddress = useMemo(
    () => formatFullAddress(addressLine1, addressLine2, city, state, zipCode),
    [addressLine1, addressLine2, city, state, zipCode]
  );

  const embedUrl = useMemo(() => getGoogleMapsEmbedUrl(fullAddress), [fullAddress]);
  const searchUrl = useMemo(() => getGoogleMapsSearchUrl(fullAddress), [fullAddress]);

  const { height, containerClass } = SIZE_CONFIG[size];

  // No address available
  if (!fullAddress) {
    return (
      <div
        className={cn(
          'bg-black/60 backdrop-blur-sm border border-white/20 rounded-none',
          containerClass,
          className
        )}
        style={{ height }}
      >
        <div className='flex flex-col items-center justify-center h-full text-muted-foreground gap-2'>
          <MapPin className='h-8 w-8 opacity-50' />
          <span className='text-sm'>{t('venue.noLocationAvailable')}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'bg-black/60 backdrop-blur-sm border border-white/20 rounded-none overflow-hidden',
        className
      )}
    >
      {/* Map Container */}
      <div className='relative' style={{ height }}>
        {/* Loading Skeleton */}
        {isLoading && !hasError && (
          <div className='absolute inset-0 bg-black/40 animate-pulse flex items-center justify-center'>
            <MapPin className='h-8 w-8 text-muted-foreground opacity-50 animate-bounce' />
          </div>
        )}

        {/* Error State */}
        {hasError && (
          <div className='absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-muted-foreground gap-2'>
            <MapPin className='h-8 w-8 opacity-50' />
            <span className='text-sm'>{t('venue.mapLoadError')}</span>
          </div>
        )}

        {/* Map iframe with dark mode styling - scroll wheel zoom enabled */}
        {embedUrl && (
          <iframe
            src={embedUrl}
            width='100%'
            height='100%'
            style={{
              border: 0,
              // Dark mode filter: invert colors, adjust hue toward gold/warm, reduce brightness
              filter: 'invert(90%) hue-rotate(180deg) brightness(0.95) contrast(0.9) sepia(10%)',
            }}
            allowFullScreen
            loading='lazy'
            referrerPolicy='no-referrer-when-downgrade'
            title={t('venue.mapTitle', { address: fullAddress })}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
            className={cn(
              'transition-opacity duration-300',
              isLoading ? 'opacity-0' : 'opacity-100'
            )}
          />
        )}

        {/* Subtle gold accent border glow overlay */}
        <div
          className='absolute inset-0 pointer-events-none'
          style={{
            boxShadow: 'inset 0 0 20px rgba(223, 186, 125, 0.15)',
          }}
        />
      </div>

      {/* Footer with address and external link */}
      {showFooter && (
        <div
          className={cn(
            'flex items-center justify-between gap-4 border-t border-white/10',
            containerClass
          )}
        >
          <div className='flex items-center gap-2 text-sm text-muted-foreground min-w-0'>
            <MapPin className='h-4 w-4 flex-shrink-0 text-fm-gold' />
            <span className='truncate'>{fullAddress}</span>
          </div>

          {showExternalLink && searchUrl && (
            <FmCommonButton
              size='sm'
              variant='secondary'
              icon={ExternalLink}
              onClick={() => window.open(searchUrl, '_blank')}
              className='flex-shrink-0 bg-white/10 hover:bg-white/20 text-white text-xs px-3'
            >
              {t('venue.viewOnGoogleMaps')}
            </FmCommonButton>
          )}
        </div>
      )}
    </div>
  );
};

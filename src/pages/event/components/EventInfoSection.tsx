import { useTranslation } from 'react-i18next';
import { Calendar, Clock, MapPin } from 'lucide-react';

import { FmCommonCollapsibleSection } from '@/components/common/data/FmCommonCollapsibleSection';
import { FmCommonInfoCard } from '@/components/common/display/FmCommonInfoCard';
import { FmTextLink } from '@/components/common/display/FmTextLink';
import { Badge } from '@/components/common/shadcn/badge';

interface EventInfoSectionProps {
  longDateLabel: string;
  /** Full time range display (e.g., "9pm - 2am PST") */
  formattedDateTime: string;
  isAfterHours: boolean;
  venue: string;
  /** Venue logo URL */
  venueLogo?: string | null;
  onVenueSelect: () => void;
  className?: string;
}

/**
 * EventInfoSection - Displays date/time and venue information
 *
 * Extracted from EventDetailsContent.tsx for better component organization.
 */
export const EventInfoSection = ({
  longDateLabel,
  formattedDateTime,
  isAfterHours,
  venue,
  venueLogo,
  onVenueSelect,
  className = '',
}: EventInfoSectionProps) => {
  const { t } = useTranslation('common');

  return (
    <FmCommonCollapsibleSection
      title={t('eventInfo.title')}
      defaultExpanded={true}
      className={className}
    >
      <div className='grid grid-cols-1 gap-4 min-w-0 overflow-hidden'>
        <FmCommonInfoCard
          icon={Calendar}
          label={t('eventInfo.dateTime')}
          size='sm'
          value={
            <div className='flex flex-col gap-1.5'>
              <div>{longDateLabel}</div>
              <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                <Clock className='w-3 h-3' />
                <span>{formattedDateTime}</span>
                {isAfterHours && (
                  <Badge className='bg-fm-gold/20 text-fm-gold border-fm-gold/40 text-[10px] px-1.5 py-0'>
                    {t('eventInfo.afterHours')}
                  </Badge>
                )}
              </div>
            </div>
          }
        />

        <FmCommonInfoCard
          icon={venueLogo ? undefined : MapPin}
          customIcon={
            venueLogo ? (
              <img
                src={venueLogo}
                alt=''
                className='w-5 h-5 object-contain'
              />
            ) : undefined
          }
          label={t('eventInfo.venue')}
          size='sm'
          value={
            <FmTextLink onClick={onVenueSelect} className='text-white'>
              {venue || t('eventInfo.venueTBA')}
            </FmTextLink>
          }
        />
      </div>
    </FmCommonCollapsibleSection>
  );
};

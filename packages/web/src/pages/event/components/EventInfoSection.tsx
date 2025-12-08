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
  onVenueSelect,
  className = '',
}: EventInfoSectionProps) => {
  return (
    <FmCommonCollapsibleSection
      title='Event Information'
      defaultExpanded={true}
      className={className}
    >
      <div className='grid gap-4'>
        <FmCommonInfoCard
          icon={Calendar}
          label='Date & Time'
          size='sm'
          value={
            <div className='flex flex-col gap-1.5'>
              <div>{longDateLabel}</div>
              <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                <Clock className='w-3 h-3' />
                <span>{formattedDateTime}</span>
                {isAfterHours && (
                  <Badge className='bg-fm-gold/20 text-fm-gold border-fm-gold/40 text-[10px] px-1.5 py-0'>
                    After Hours
                  </Badge>
                )}
              </div>
            </div>
          }
        />

        <FmCommonInfoCard
          icon={MapPin}
          label='Venue'
          size='sm'
          value={
            <FmTextLink onClick={onVenueSelect}>
              {venue || 'Venue TBA'}
            </FmTextLink>
          }
        />
      </div>
    </FmCommonCollapsibleSection>
  );
};

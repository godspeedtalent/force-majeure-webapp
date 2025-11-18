import { Calendar, Clock, MapPin } from 'lucide-react';
import { FmCommonCollapsibleSection } from '@/components/common/data/FmCommonCollapsibleSection';
import { FmCommonInfoCard } from '@/components/common/display/FmCommonInfoCard';
import { FmTextLink } from '@/components/common/display/FmTextLink';
import { Badge } from '@/components/common/shadcn/badge';

interface EventInformationSectionProps {
  longDateLabel: string;
  formattedTime: string;
  isAfterHours: boolean;
  venue: string;
  onVenueClick: () => void;
}

export function EventInformationSection({
  longDateLabel,
  formattedTime,
  isAfterHours,
  venue,
  onVenueClick,
}: EventInformationSectionProps) {
  return (
    <FmCommonCollapsibleSection
      title='Event Information'
      defaultExpanded={true}
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
                <span>{formattedTime}</span>
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
            <FmTextLink onClick={onVenueClick}>
              {venue || 'Venue TBA'}
            </FmTextLink>
          }
        />
      </div>
    </FmCommonCollapsibleSection>
  );
}

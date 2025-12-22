import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('common');

  return (
    <FmCommonCollapsibleSection
      title={t('eventInfo.title')}
      defaultExpanded={true}
    >
      <div className='grid gap-4'>
        <FmCommonInfoCard
          icon={Calendar}
          label={t('eventInfo.dateTime')}
          size='sm'
          value={
            <div className='flex flex-col gap-1.5'>
              <div>{longDateLabel}</div>
              <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                <Clock className='w-3 h-3' />
                <span>{formattedTime}</span>
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
          icon={MapPin}
          label={t('eventInfo.venue')}
          size='sm'
          value={
            <FmTextLink onClick={onVenueClick}>
              {venue || t('eventInfo.venueTBA')}
            </FmTextLink>
          }
        />
      </div>
    </FmCommonCollapsibleSection>
  );
}

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/common/shadcn/dialog';
import { FmCommonCollapsibleSection } from '@/components/common/data/FmCommonCollapsibleSection';
import { ATTENDEE_PLACEHOLDERS } from './constants';

interface AttendeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attendeeList: Array<{ name: string; avatar: string }>;
}

export function AttendeeModal({
  open,
  onOpenChange,
  attendeeList,
}: AttendeeModalProps) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md bg-background/95 backdrop-blur border border-border/60 max-h-[85vh] flex flex-col p-0 overflow-hidden'>
        <DialogHeader className='flex-shrink-0 px-6 pt-6 pb-4'>
          <DialogTitle className='font-canela text-lg'>
            {t('guestList.guestListTitle')}
          </DialogTitle>
        </DialogHeader>

        <div className='flex-1 overflow-y-auto px-6 pb-6'>
          {/* Have Tickets Section */}
          <FmCommonCollapsibleSection
            title={t('guestList.haveTickets')}
            defaultExpanded={true}
            className='mb-4'
          >
            <div className='grid grid-cols-4 gap-3'>
              {attendeeList
                .slice(0, ATTENDEE_PLACEHOLDERS.length)
                .map((attendee, index) => (
                  <div
                    key={`${attendee.avatar}-${index}`}
                    className='flex flex-col items-center gap-2 text-center group cursor-pointer'
                    onClick={() =>
                      navigate(`/profile/${attendee.avatar.toLowerCase()}`)
                    }
                  >
                    <div className='flex h-12 w-12 items-center justify-center rounded-full border-2 border-border bg-gradient-to-br from-fm-gold/15 to-fm-gold/35 text-xs font-semibold uppercase text-fm-gold transition-all duration-200 group-hover:scale-110 group-hover:border-fm-gold'>
                      {attendee.avatar}
                    </div>
                    <span className='w-full truncate text-[11px] leading-tight text-muted-foreground'>
                      {attendee.name}
                    </span>
                  </div>
                ))}
            </div>
          </FmCommonCollapsibleSection>

          {/* Private Users Section */}
          {attendeeList.length > ATTENDEE_PLACEHOLDERS.length && (
            <FmCommonCollapsibleSection
              title={t('guestList.privateGuests')}
              defaultExpanded={false}
              className='mb-4'
            >
              <div className='mb-3 flex items-center justify-end'>
                <span className='text-[10px] font-light text-muted-foreground/70'>
                  +
                  {(
                    attendeeList.length -
                    ATTENDEE_PLACEHOLDERS.length -
                    4
                  ).toLocaleString()}{' '}
                  {t('guestList.more')}
                </span>
              </div>
              <div className='grid grid-cols-4 gap-3'>
                {attendeeList
                  .slice(
                    ATTENDEE_PLACEHOLDERS.length,
                    ATTENDEE_PLACEHOLDERS.length + 4
                  )
                  .map((attendee, index) => (
                    <div
                      key={`private-${attendee.avatar}-${index}`}
                      className='flex flex-col items-center gap-2 text-center'
                    >
                      <div className='flex h-12 w-12 items-center justify-center rounded-full border border-border bg-gradient-to-br from-fm-gold/15 to-fm-gold/35 text-xs font-semibold uppercase text-fm-gold blur-sm'>
                        {attendee.avatar}
                      </div>
                      <span className='w-full truncate text-[11px] leading-tight text-muted-foreground blur-sm'>
                        {attendee.name}
                      </span>
                    </div>
                  ))}
              </div>
            </FmCommonCollapsibleSection>
          )}

          {/* Interested Section */}
          <FmCommonCollapsibleSection
            title={t('guestList.interested')}
            defaultExpanded={true}
            className='mb-4'
          >
            <div className='mb-3 flex items-center justify-end'>
              {attendeeList.length > 8 && (
                <span className='text-[10px] font-light text-muted-foreground/70'>
                  +{Math.max(0, attendeeList.length - 8).toLocaleString()}{' '}
                  {t('guestList.more')}
                </span>
              )}
            </div>
            <div className='grid grid-cols-4 gap-3'>
              {attendeeList.slice(0, 8).map((attendee, index) => (
                <div
                  key={`interested-${attendee.avatar}-${index}`}
                  className='flex flex-col items-center gap-2 text-center group cursor-pointer'
                  onClick={() =>
                    navigate(`/profile/${attendee.avatar.toLowerCase()}`)
                  }
                >
                  <div className='flex h-12 w-12 items-center justify-center rounded-full border border-border bg-gradient-to-br from-muted-foreground/15 to-muted-foreground/35 text-xs font-semibold uppercase text-muted-foreground transition-all duration-200 group-hover:scale-110 group-hover:border-fm-gold group-hover:from-fm-gold/15 group-hover:to-fm-gold/35 group-hover:text-fm-gold'>
                    {attendee.avatar}
                  </div>
                  <span className='w-full truncate text-[11px] leading-tight text-muted-foreground'>
                    {attendee.name}
                  </span>
                </div>
              ))}
            </div>
          </FmCommonCollapsibleSection>
        </div>
      </DialogContent>
    </Dialog>
  );
}

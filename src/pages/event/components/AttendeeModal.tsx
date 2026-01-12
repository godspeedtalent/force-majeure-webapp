import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, Heart } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/common/shadcn/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/common/shadcn/tabs';
import { FmCommonCollapsibleSection } from '@/components/common/data/FmCommonCollapsibleSection';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { useAttendeeList, Attendee } from '../hooks/useAttendeeList';
import { cn } from '@/shared';

interface AttendeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
}

interface AttendeeAvatarProps {
  attendee: Attendee;
  onClick: () => void;
  variant?: 'default' | 'interested' | 'friend';
}

function AttendeeAvatar({ attendee, onClick, variant = 'default' }: AttendeeAvatarProps) {
  const isFriend = variant === 'friend' || attendee.isFriend;
  const isInterested = variant === 'interested';

  return (
    <div
      className='flex flex-col items-center gap-2 text-center group cursor-pointer'
      onClick={onClick}
    >
      <div
        className={cn(
          'relative flex h-12 w-12 items-center justify-center rounded-full border-2 text-xs font-semibold uppercase transition-all duration-200 group-hover:scale-110',
          isInterested
            ? 'border-border bg-gradient-to-br from-muted-foreground/15 to-muted-foreground/35 text-muted-foreground group-hover:border-fm-gold group-hover:from-fm-gold/15 group-hover:to-fm-gold/35 group-hover:text-fm-gold'
            : 'border-border bg-gradient-to-br from-fm-gold/15 to-fm-gold/35 text-fm-gold group-hover:border-fm-gold'
        )}
      >
        {attendee.avatarUrl ? (
          <img
            src={attendee.avatarUrl}
            alt={attendee.name}
            className='h-full w-full rounded-full object-cover'
          />
        ) : (
          attendee.avatar
        )}
        {isFriend && (
          <span className='absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-fm-gold text-[8px] text-black'>
            <Heart className='h-2.5 w-2.5 fill-current' />
          </span>
        )}
      </div>
      <span className='w-full truncate text-[11px] leading-tight text-muted-foreground'>
        {attendee.name}
      </span>
    </div>
  );
}

interface AttendeeGridProps {
  attendees: Attendee[];
  onAttendeeClick: (attendee: Attendee) => void;
  variant?: 'default' | 'interested';
  maxDisplay?: number;
  showMoreCount?: boolean;
}

function AttendeeGrid({
  attendees,
  onAttendeeClick,
  variant = 'default',
  maxDisplay = 12,
  showMoreCount = true,
}: AttendeeGridProps) {
  const { t } = useTranslation('common');
  const displayedAttendees = attendees.slice(0, maxDisplay);
  const remainingCount = Math.max(0, attendees.length - maxDisplay);

  if (attendees.length === 0) {
    return (
      <div className='py-4 text-center text-sm text-muted-foreground'>
        {variant === 'interested'
          ? t('guestList.noInterestedYet')
          : t('guestList.noAttendeesYet')}
      </div>
    );
  }

  return (
    <>
      {showMoreCount && remainingCount > 0 && (
        <div className='mb-3 flex items-center justify-end'>
          <span className='text-[10px] font-light text-muted-foreground/70'>
            +{remainingCount.toLocaleString()} {t('guestList.more')}
          </span>
        </div>
      )}
      <div className='grid grid-cols-4 gap-3'>
        {displayedAttendees.map((attendee) => (
          <AttendeeAvatar
            key={attendee.id}
            attendee={attendee}
            onClick={() => onAttendeeClick(attendee)}
            variant={variant}
          />
        ))}
      </div>
    </>
  );
}

export function AttendeeModal({
  open,
  onOpenChange,
  eventId,
}: AttendeeModalProps) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'friends' | 'all'>('friends');

  const {
    friendsGoing,
    allGoing,
    interestedUsers,
    friendsGoingCount,
    totalGoingCount,
    interestedCount,
    isLoading,
  } = useAttendeeList(eventId);

  const handleAttendeeClick = (attendee: Attendee) => {
    // Navigate to user's profile using their actual user ID
    navigate(`/profile/${attendee.userId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md bg-background/95 backdrop-blur border border-border/60 max-h-[85vh] flex flex-col p-0 overflow-hidden'>
        <DialogHeader className='flex-shrink-0 px-6 pt-6 pb-4'>
          <DialogTitle className='font-canela text-lg'>
            {t('guestList.guestListTitle')}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className='flex items-center justify-center py-12'>
            <FmCommonLoadingSpinner size='lg' />
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'friends' | 'all')}
            className='flex-1 flex flex-col overflow-hidden'
          >
            <TabsList className='mx-6 mb-4 grid grid-cols-2'>
              <TabsTrigger value='friends' className='flex items-center gap-2'>
                <Heart className='h-3.5 w-3.5' />
                <span>{t('guestList.friendsGoing')}</span>
                <span className='ml-1 text-xs text-muted-foreground'>
                  ({friendsGoingCount})
                </span>
              </TabsTrigger>
              <TabsTrigger value='all' className='flex items-center gap-2'>
                <Users className='h-3.5 w-3.5' />
                <span>{t('guestList.allAttendees')}</span>
                <span className='ml-1 text-xs text-muted-foreground'>
                  ({totalGoingCount})
                </span>
              </TabsTrigger>
            </TabsList>

            <div className='flex-1 overflow-y-auto px-6 pb-6'>
              <TabsContent value='friends' className='mt-0'>
                {friendsGoingCount === 0 ? (
                  <div className='py-8 text-center'>
                    <Heart className='mx-auto h-8 w-8 text-muted-foreground/50 mb-3' />
                    <p className='text-sm text-muted-foreground'>
                      {t('guestList.noFriendsGoing')}
                    </p>
                    <p className='mt-1 text-xs text-muted-foreground/70'>
                      {t('guestList.connectWithRaveFamily')}
                    </p>
                  </div>
                ) : (
                  <AttendeeGrid
                    attendees={friendsGoing}
                    onAttendeeClick={handleAttendeeClick}
                    variant='default'
                  />
                )}
              </TabsContent>

              <TabsContent value='all' className='mt-0 space-y-4'>
                {/* Going Section */}
                <FmCommonCollapsibleSection
                  title={t('guestList.haveTickets')}
                  defaultExpanded={true}
                >
                  <AttendeeGrid
                    attendees={allGoing}
                    onAttendeeClick={handleAttendeeClick}
                    variant='default'
                  />
                </FmCommonCollapsibleSection>

                {/* Interested Section */}
                <FmCommonCollapsibleSection
                  title={`${t('guestList.interested')} (${interestedCount})`}
                  defaultExpanded={interestedCount > 0 && totalGoingCount < 5}
                >
                  <AttendeeGrid
                    attendees={interestedUsers}
                    onAttendeeClick={handleAttendeeClick}
                    variant='interested'
                    maxDisplay={8}
                  />
                </FmCommonCollapsibleSection>
              </TabsContent>
            </div>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

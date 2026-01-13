import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, Heart, Sparkles, UserPlus } from 'lucide-react';
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
      className='flex flex-col items-center gap-[5px] text-center group cursor-pointer'
      onClick={onClick}
    >
      <div
        className={cn(
          'relative flex h-12 w-12 items-center justify-center border-2 text-xs font-semibold uppercase transition-all duration-300',
          isInterested
            ? 'border-white/10 bg-gradient-to-br from-white/5 to-white/10 text-muted-foreground group-hover:border-fm-gold/50 group-hover:from-fm-gold/10 group-hover:to-fm-gold/20 group-hover:text-fm-gold'
            : 'border-fm-gold/30 bg-gradient-to-br from-fm-gold/10 to-fm-gold/25 text-fm-gold group-hover:border-fm-gold/60 group-hover:scale-105',
          'group-hover:shadow-[0_0_16px_rgba(223,186,125,0.15)]'
        )}
      >
        {attendee.avatarUrl ? (
          <img
            src={attendee.avatarUrl}
            alt={attendee.name}
            className='h-full w-full object-cover'
          />
        ) : (
          attendee.avatar
        )}
        {isFriend && (
          <span className='absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center bg-fm-gold text-[8px] text-black shadow-md'>
            <Heart className='h-2.5 w-2.5 fill-current' />
          </span>
        )}
      </div>
      <span className='w-full truncate text-[10px] leading-tight text-muted-foreground/80 group-hover:text-white/70 transition-colors'>
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
      <div className='py-[20px] text-center'>
        <Sparkles className='mx-auto h-6 w-6 text-muted-foreground/30 mb-[10px]' />
        <p className='text-sm text-muted-foreground/60'>
          {variant === 'interested'
            ? t('guestList.noInterestedYet')
            : t('guestList.noAttendeesYet')}
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-[10px]'>
      {showMoreCount && remainingCount > 0 && (
        <div className='flex items-center justify-end'>
          <span className='text-[10px] font-light text-muted-foreground/50'>
            +{remainingCount.toLocaleString()} {t('guestList.more')}
          </span>
        </div>
      )}
      <div className='grid grid-cols-4 gap-[10px]'>
        {displayedAttendees.map((attendee) => (
          <AttendeeAvatar
            key={attendee.id}
            attendee={attendee}
            onClick={() => onAttendeeClick(attendee)}
            variant={variant}
          />
        ))}
      </div>
    </div>
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
    navigate(`/profile/${attendee.userId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md bg-black/90 backdrop-blur-xl border border-white/10 max-h-[85vh] flex flex-col p-0 overflow-hidden'>
        {/* Header with accent */}
        <DialogHeader className='flex-shrink-0 px-[20px] pt-[20px] pb-[10px] relative'>
          <div className='absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-fm-gold/30 to-transparent' />
          <div className='flex items-center gap-[10px]'>
            <div className='p-2 bg-fm-gold/10 border border-fm-gold/20'>
              <Users className='w-4 h-4 text-fm-gold' />
            </div>
            <DialogTitle className='font-canela text-lg uppercase tracking-wider'>
              {t('guestList.modalTitle')}
            </DialogTitle>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className='flex items-center justify-center py-[60px]'>
            <FmCommonLoadingSpinner size='lg' />
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'friends' | 'all')}
            className='flex-1 flex flex-col overflow-hidden'
          >
            {/* Custom styled tabs */}
            <div className='mx-[20px] mb-[20px]'>
              <TabsList className='grid grid-cols-2 bg-black/40 border border-white/10 p-1'>
                <TabsTrigger
                  value='friends'
                  className={cn(
                    'flex items-center justify-center gap-2 py-2 transition-all duration-300',
                    'data-[state=active]:bg-fm-gold/15 data-[state=active]:text-fm-gold data-[state=active]:border-fm-gold/30',
                    'data-[state=inactive]:text-muted-foreground/60 data-[state=inactive]:hover:text-white/70'
                  )}
                >
                  <Heart className='h-3.5 w-3.5' />
                  <span className='text-xs uppercase tracking-wider'>{t('guestList.friendsTab')}</span>
                  <span className='ml-1 text-[10px] opacity-60'>
                    ({friendsGoingCount})
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value='all'
                  className={cn(
                    'flex items-center justify-center gap-2 py-2 transition-all duration-300',
                    'data-[state=active]:bg-fm-gold/15 data-[state=active]:text-fm-gold data-[state=active]:border-fm-gold/30',
                    'data-[state=inactive]:text-muted-foreground/60 data-[state=inactive]:hover:text-white/70'
                  )}
                >
                  <Users className='h-3.5 w-3.5' />
                  <span className='text-xs uppercase tracking-wider'>{t('guestList.allTab')}</span>
                  <span className='ml-1 text-[10px] opacity-60'>
                    ({totalGoingCount})
                  </span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className='flex-1 overflow-y-auto px-[20px] pb-[20px]'>
              <TabsContent value='friends' className='mt-0'>
                {friendsGoingCount === 0 ? (
                  <div className='py-[40px] text-center'>
                    <div className='mx-auto w-16 h-16 flex items-center justify-center bg-white/5 border border-white/10 mb-[20px]'>
                      <UserPlus className='h-8 w-8 text-muted-foreground/40' />
                    </div>
                    <p className='text-sm text-muted-foreground/80'>
                      {t('guestList.noFriendsGoing')}
                    </p>
                    <p className='mt-[5px] text-xs text-muted-foreground/50'>
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

              <TabsContent value='all' className='mt-0 space-y-[20px]'>
                {/* Going Section */}
                <FmCommonCollapsibleSection
                  title={t('guestList.ticketHoldersTitle')}
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
                  title={`${t('guestList.interestedTitle')} (${interestedCount})`}
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

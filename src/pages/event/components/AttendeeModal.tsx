import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, Heart, Sparkles, ChevronDown, UserX, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/common/shadcn/dialog';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { useAttendeeList, Attendee } from '../hooks/useAttendeeList';
import { cn } from '@/shared';

interface AttendeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventStatus?: string;
}

interface AttendeeAvatarProps {
  attendee: Attendee;
  onClick: () => void;
  variant?: 'default' | 'interested' | 'friend' | 'private';
}

function AttendeeAvatar({ attendee, onClick, variant = 'default' }: AttendeeAvatarProps) {
  const isFriend = variant === 'friend' || attendee.isFriend;
  const isInterested = variant === 'interested';
  const isPrivate = variant === 'private';

  return (
    <div
      className='flex flex-col items-center gap-[5px] text-center group cursor-pointer'
      onClick={onClick}
    >
      <div
        className={cn(
          'relative flex h-12 w-12 items-center justify-center border-2 text-xs font-semibold uppercase transition-all duration-300',
          isPrivate
            ? 'border-white/5 bg-gradient-to-br from-white/5 to-white/10 text-muted-foreground/50'
            : isInterested
              ? 'border-white/10 bg-gradient-to-br from-white/5 to-white/10 text-muted-foreground group-hover:border-fm-gold/50 group-hover:from-fm-gold/10 group-hover:to-fm-gold/20 group-hover:text-fm-gold'
              : 'border-fm-gold/30 bg-gradient-to-br from-fm-gold/10 to-fm-gold/25 text-fm-gold group-hover:border-fm-gold/60 group-hover:scale-105',
          !isPrivate && 'group-hover:shadow-[0_0_16px_rgba(223,186,125,0.15)]'
        )}
      >
        {isPrivate ? (
          <UserX className='h-4 w-4' />
        ) : attendee.avatarUrl ? (
          <img
            src={attendee.avatarUrl}
            alt={attendee.name}
            className='h-full w-full object-cover'
          />
        ) : (
          attendee.avatar
        )}
        {isFriend && !isPrivate && (
          <span className='absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center bg-fm-gold text-[8px] text-black shadow-md'>
            <Heart className='h-2.5 w-2.5 fill-current' />
          </span>
        )}
      </div>
      <span className='w-full truncate text-[10px] leading-tight text-muted-foreground/80 group-hover:text-white/70 transition-colors'>
        {isPrivate ? 'Private' : attendee.name}
      </span>
    </div>
  );
}

interface AttendeeListProps {
  attendees: Attendee[];
  onAttendeeClick: (attendee: Attendee) => void;
  variant?: 'default' | 'interested' | 'private';
}

function AttendeeList({
  attendees,
  onAttendeeClick,
  variant = 'default',
}: AttendeeListProps) {
  const { t } = useTranslation('common');

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
    <div className='grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-[10px]'>
      {attendees.map((attendee) => (
        <AttendeeAvatar
          key={attendee.id}
          attendee={attendee}
          onClick={() => onAttendeeClick(attendee)}
          variant={variant}
        />
      ))}
    </div>
  );
}

interface CollapsibleSectionProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

function CollapsibleSection({
  title,
  count,
  icon,
  children,
  defaultExpanded = true,
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (count === 0) return null;

  return (
    <div className='border-b border-white/5 last:border-b-0'>
      <button
        type='button'
        onClick={() => setIsExpanded(!isExpanded)}
        className='w-full flex items-center justify-between py-[15px] group cursor-pointer'
      >
        <div className='flex items-center gap-[10px]'>
          <span className='text-fm-gold/70 group-hover:text-fm-gold transition-colors'>
            {icon}
          </span>
          <span className='font-canela text-base text-white/90 group-hover:text-white transition-colors'>
            {title}
          </span>
          <span className='text-xs text-muted-foreground/60 bg-white/5 px-2 py-0.5'>
            {count}
          </span>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground group-hover:text-fm-gold transition-all duration-300',
            isExpanded ? 'rotate-180' : 'rotate-0'
          )}
        />
      </button>

      <div
        className={cn(
          'grid transition-all duration-300 ease-in-out',
          isExpanded
            ? 'grid-rows-[1fr] opacity-100 pb-[20px]'
            : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className='overflow-hidden'>{children}</div>
      </div>
    </div>
  );
}

export function AttendeeModal({
  open,
  onOpenChange,
  eventId,
  eventStatus,
}: AttendeeModalProps) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  const {
    friendsGoing,
    otherUsers,
    guestsAndPrivate,
    interestedUsers,
    friendsGoingCount,
    otherUsersCount,
    guestsAndPrivateCount,
    interestedCount,
    totalGoingCount,
    isLoading,
  } = useAttendeeList(eventId, eventStatus);

  const handleAttendeeClick = (attendee: Attendee) => {
    // Don't navigate for guests/private users
    if (attendee.type === 'guest' || attendee.userId.startsWith('guest-')) {
      return;
    }
    navigate(`/profile/${attendee.userId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'bg-black/95 backdrop-blur-xl border border-white/10',
          'p-0 overflow-hidden',
          'w-full max-w-none lg:max-w-[65%]',
          'h-[85vh] max-h-[85vh]',
          'flex flex-col'
        )}
      >
        {/* Fixed Header */}
        <DialogHeader className='flex-shrink-0 px-[20px] lg:px-[40px] pt-[20px] lg:pt-[40px] pb-[15px] relative border-b border-white/5'>
          <div className='absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-fm-gold/30 to-transparent' />
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-[10px]'>
              <div className='p-2 bg-fm-gold/10 border border-fm-gold/20'>
                <Users className='w-5 h-5 text-fm-gold' />
              </div>
              <div>
                <DialogTitle className='font-canela text-xl uppercase tracking-wider'>
                  {t('guestList.modalTitle')}
                </DialogTitle>
                <p className='text-xs text-muted-foreground mt-1'>
                  {t('guestList.goingCount', { count: totalGoingCount })}
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Content */}
        {isLoading ? (
          <div className='flex-1 flex items-center justify-center'>
            <FmCommonLoadingSpinner size='lg' />
          </div>
        ) : (
          <div className='flex-1 overflow-y-auto px-[20px] lg:px-[40px] py-[10px]'>
            {/* Section 1: Friends */}
            <CollapsibleSection
              title={t('guestList.friendsSection')}
              count={friendsGoingCount}
              icon={<Heart className='h-4 w-4' />}
              defaultExpanded={friendsGoingCount > 0}
            >
              <AttendeeList
                attendees={friendsGoing}
                onAttendeeClick={handleAttendeeClick}
                variant='default'
              />
            </CollapsibleSection>

            {/* Section 2: Other Users */}
            <CollapsibleSection
              title={t('guestList.otherUsersSection')}
              count={otherUsersCount}
              icon={<Users className='h-4 w-4' />}
              defaultExpanded={friendsGoingCount === 0}
            >
              <AttendeeList
                attendees={otherUsers}
                onAttendeeClick={handleAttendeeClick}
                variant='default'
              />
            </CollapsibleSection>

            {/* Section 3: Guests and Private Users */}
            <CollapsibleSection
              title={t('guestList.guestsPrivateSection')}
              count={guestsAndPrivateCount}
              icon={<UserX className='h-4 w-4' />}
              defaultExpanded={false}
            >
              <AttendeeList
                attendees={guestsAndPrivate}
                onAttendeeClick={handleAttendeeClick}
                variant='private'
              />
            </CollapsibleSection>

            {/* Section 4: Interested */}
            <CollapsibleSection
              title={t('guestList.interestedSection')}
              count={interestedCount}
              icon={<Eye className='h-4 w-4' />}
              defaultExpanded={totalGoingCount < 5}
            >
              <AttendeeList
                attendees={interestedUsers}
                onAttendeeClick={handleAttendeeClick}
                variant='interested'
              />
            </CollapsibleSection>

            {/* Empty state if no one at all */}
            {totalGoingCount === 0 && interestedCount === 0 && (
              <div className='py-[60px] text-center'>
                <Sparkles className='mx-auto h-10 w-10 text-muted-foreground/20 mb-[20px]' />
                <p className='text-muted-foreground/70'>
                  {t('guestList.noAttendeesYet')}
                </p>
                <p className='mt-[5px] text-xs text-muted-foreground/50'>
                  {t('guestList.beFirstToRsvp')}
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

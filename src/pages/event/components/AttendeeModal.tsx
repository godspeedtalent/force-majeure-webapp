import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Heart, Sparkles, UserX, Eye, Search, X } from 'lucide-react';
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
}

function AttendeeAvatar({ attendee }: AttendeeAvatarProps) {
  const { t } = useTranslation('common');
  const isFriend = attendee.isFriend;
  const isPrivate = attendee.isPrivate;
  const isInterested = attendee.type === 'interested';
  const isGuest = attendee.type === 'guest';

  return (
    <div className='flex flex-col items-center gap-[5px] text-center group'>
      <div
        className={cn(
          'relative flex h-12 w-12 items-center justify-center border-2 text-xs font-semibold uppercase transition-all duration-300 overflow-hidden',
          isPrivate || isGuest
            ? 'border-white/5 bg-gradient-to-br from-white/5 to-white/10 text-muted-foreground/50'
            : isInterested
              ? 'border-white/10 bg-gradient-to-br from-white/5 to-white/10 text-muted-foreground'
              : 'border-fm-gold/30 bg-gradient-to-br from-fm-gold/10 to-fm-gold/25 text-fm-gold'
        )}
      >
        {isPrivate || isGuest ? (
          // Private/guest users: show blurred avatar if available, otherwise UserX icon
          attendee.avatarUrl ? (
            <img
              src={attendee.avatarUrl}
              alt={t('guestList.privateUser')}
              className='h-full w-full object-cover blur-md opacity-50'
            />
          ) : (
            <UserX className='h-4 w-4' />
          )
        ) : attendee.avatarUrl ? (
          <img
            src={attendee.avatarUrl}
            alt={attendee.name}
            className='h-full w-full object-cover'
          />
        ) : (
          attendee.avatar
        )}
        {isFriend && !isPrivate && !isGuest && (
          <span className='absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center bg-fm-gold text-[8px] text-black shadow-md'>
            <Heart className='h-2.5 w-2.5 fill-current' />
          </span>
        )}
      </div>
      <span className='w-full truncate text-[10px] leading-tight text-muted-foreground/80'>
        {isPrivate || isGuest ? t('guestList.privateUser') : attendee.name}
      </span>
    </div>
  );
}

/**
 * GuestCountIndicator - Shows grouped guest count instead of individual avatars
 */
interface GuestCountIndicatorProps {
  count: number;
}

function GuestCountIndicator({ count }: GuestCountIndicatorProps) {
  const { t } = useTranslation('common');

  if (count === 0) return null;

  return (
    <div className='flex items-center gap-[10px] py-[10px] px-[15px] bg-white/5 border border-white/10'>
      <div className='flex h-10 w-10 items-center justify-center border border-white/10 bg-gradient-to-br from-white/5 to-white/10'>
        <Users className='h-4 w-4 text-muted-foreground/50' />
      </div>
      <span className='text-sm text-muted-foreground/70'>
        {t('guestList.guestCountLabel', { count })}
      </span>
    </div>
  );
}

/**
 * UnifiedAttendeeList - Displays attendees in order with appropriate styling
 * Order: public tickets -> public RSVPs -> private tickets -> private RSVPs -> guests (grouped) -> interested
 */
interface UnifiedAttendeeListProps {
  attendees: Attendee[];
  guestCount: number;
  showGuestIndicator?: boolean;
}

function UnifiedAttendeeList({ attendees, guestCount, showGuestIndicator = true }: UnifiedAttendeeListProps) {
  const { t } = useTranslation('common');

  // Filter out guests (they'll be shown as a count indicator)
  const displayAttendees = attendees.filter(a => a.type !== 'guest');

  if (displayAttendees.length === 0 && guestCount === 0) {
    return (
      <div className='py-[20px] text-center'>
        <Sparkles className='mx-auto h-6 w-6 text-muted-foreground/30 mb-[10px]' />
        <p className='text-sm text-muted-foreground/60'>
          {t('guestList.noAttendeesYet')}
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-[15px]'>
      {displayAttendees.length > 0 && (
        <div className='grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-[10px]'>
          {displayAttendees.map((attendee) => (
            <AttendeeAvatar key={attendee.id} attendee={attendee} />
          ))}
        </div>
      )}
      {showGuestIndicator && <GuestCountIndicator count={guestCount} />}
    </div>
  );
}

/**
 * SectionHeader - Simple section divider with icon, title, and count
 */
interface SectionHeaderProps {
  title: string;
  count: number;
  icon: React.ReactNode;
}

function SectionHeader({ title, count, icon }: SectionHeaderProps) {
  if (count === 0) return null;

  return (
    <div className='flex items-center gap-[10px] py-[15px] border-b border-white/5'>
      <span className='text-fm-gold/70'>{icon}</span>
      <span className='font-canela text-base text-white/90'>{title}</span>
      <span className='text-xs text-muted-foreground/60 bg-white/5 px-2 py-0.5'>
        {count}
      </span>
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
  const [searchQuery, setSearchQuery] = useState('');

  const {
    goingAttendees,
    interestedAttendees,
    guestCount,
    totalGoingCount,
    interestedCount,
    isLoading,
  } = useAttendeeList(eventId, eventStatus);

  // Filter attendees by name - private users and guests are always shown
  const filterAttendees = useMemo(() => {
    return (attendees: Attendee[]) => {
      if (!searchQuery.trim()) return attendees;

      const query = searchQuery.toLowerCase().trim();
      return attendees.filter((attendee) => {
        // Private users and guests are always shown regardless of filter
        if (attendee.isPrivate || attendee.type === 'guest') return true;
        // Filter public attendees by name
        return attendee.name.toLowerCase().includes(query);
      });
    };
  }, [searchQuery]);

  const filteredGoingAttendees = useMemo(
    () => filterAttendees(goingAttendees),
    [filterAttendees, goingAttendees]
  );

  const filteredInterestedAttendees = useMemo(
    () => filterAttendees(interestedAttendees),
    [filterAttendees, interestedAttendees]
  );

  // Calculate filtered counts (excluding guests which are shown separately)
  const filteredGoingCount = filteredGoingAttendees.filter(a => a.type !== 'guest').length + guestCount;
  const filteredInterestedCount = filteredInterestedAttendees.filter(a => a.type !== 'guest').length;

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

          {/* Search Input */}
          <div className='mt-[15px] relative'>
            <Search className='absolute left-[10px] top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50' />
            <input
              type='text'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('guestList.searchPlaceholder')}
              className={cn(
                'w-full h-10 pl-[36px] pr-[36px]',
                'bg-white/5 border border-white/10',
                'text-sm text-white placeholder:text-muted-foreground/50',
                'focus:outline-none focus:border-fm-gold/50 focus:bg-white/10',
                'transition-all duration-200'
              )}
            />
            {searchQuery && (
              <button
                type='button'
                onClick={() => setSearchQuery('')}
                className='absolute right-[10px] top-1/2 -translate-y-1/2 p-1 text-muted-foreground/50 hover:text-white transition-colors'
                aria-label={t('guestList.clearSearch')}
              >
                <X className='h-4 w-4' />
              </button>
            )}
          </div>
        </DialogHeader>

        {/* Scrollable Content */}
        {isLoading ? (
          <div className='flex-1 flex items-center justify-center'>
            <FmCommonLoadingSpinner size='lg' />
          </div>
        ) : (
          <div className='flex-1 overflow-y-auto px-[20px] lg:px-[40px] py-[10px]'>
            {/* Going Section */}
            {filteredGoingCount > 0 && (
              <div className='mb-[20px]'>
                <SectionHeader
                  title={t('guestList.goingSection')}
                  count={filteredGoingCount}
                  icon={<Users className='h-4 w-4' />}
                />
                <div className='pt-[15px]'>
                  <UnifiedAttendeeList
                    attendees={filteredGoingAttendees}
                    guestCount={guestCount}
                  />
                </div>
              </div>
            )}

            {/* Interested Section */}
            {filteredInterestedCount > 0 && (
              <div className='mb-[20px]'>
                <SectionHeader
                  title={t('guestList.interestedSection')}
                  count={filteredInterestedCount}
                  icon={<Eye className='h-4 w-4' />}
                />
                <div className='pt-[15px]'>
                  <UnifiedAttendeeList
                    attendees={filteredInterestedAttendees}
                    guestCount={0}
                    showGuestIndicator={false}
                  />
                </div>
              </div>
            )}

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

            {/* No results from search */}
            {searchQuery && filteredGoingCount === 0 && filteredInterestedCount === 0 && (totalGoingCount > 0 || interestedCount > 0) && (
              <div className='py-[40px] text-center'>
                <Search className='mx-auto h-8 w-8 text-muted-foreground/20 mb-[15px]' />
                <p className='text-muted-foreground/70'>
                  {t('guestList.noSearchResults')}
                </p>
                <p className='mt-[5px] text-xs text-muted-foreground/50'>
                  {t('guestList.tryDifferentSearch')}
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

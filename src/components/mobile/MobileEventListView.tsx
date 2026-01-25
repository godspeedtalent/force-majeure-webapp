import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarX, Search, X, ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';
import { cn } from '@/shared';
import { FmCommonEmptyState } from '@/components/common/display/FmCommonEmptyState';
import { Input } from '@/components/common/shadcn/input';
import { MobileEventRowCard } from './MobileEventRowCard';
import { ForceMajeureLogo } from '@/components/navigation/ForceMajeureLogo';

type SortField = 'date' | 'name';
type SortDirection = 'asc' | 'desc';
type DateRange = 'all' | 'week' | 'month' | 'year';

interface Artist {
  name: string;
  genre: string;
  image?: string | null;
}

interface EventData {
  id: string;
  title: string;
  headliner: Artist;
  undercard: Artist[];
  date: string;
  time: string;
  venue: string;
  heroImage: string;
  description: string | null;
  ticketUrl?: string | null;
  is_tba?: boolean;
  display_subtitle?: boolean;
  is_after_hours?: boolean;
}

export interface MobileEventListViewProps {
  /** Upcoming events */
  upcomingEvents: EventData[];
  /** Past events */
  pastEvents: EventData[];
  /** Additional className */
  className?: string;
}

/**
 * Mobile list view for events with search, sort, and date filtering
 * Provides a scrollable, filterable list alternative to the carousel view
 */
export function MobileEventListView({
  upcomingEvents,
  pastEvents,
  className,
}: MobileEventListViewProps) {
  const { t } = useTranslation('pages');
  const { t: tCommon } = useTranslation('common');
  const [searchText, setSearchText] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [dateRange, setDateRange] = useState<DateRange>('all');

  // Auto-show past events when no upcoming events
  const hasNoUpcoming = upcomingEvents.length === 0;
  const [showPastEvents, setShowPastEvents] = useState(hasNoUpcoming);

  // Date range filter helper
  const isWithinDateRange = (dateString: string, range: DateRange): boolean => {
    if (range === 'all') return true;
    const eventDate = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));
    switch (range) {
      case 'week': return diffDays <= 7;
      case 'month': return diffDays <= 30;
      case 'year': return diffDays <= 365;
      default: return true;
    }
  };

  // Filter and sort events
  const processEvents = (events: EventData[], isPast: boolean) => {
    let result = [...events];

    // Search filter
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      result = result.filter(event => {
        const title = (event.title || event.headliner.name).toLowerCase();
        const venue = event.venue.toLowerCase();
        const headliner = event.headliner.name.toLowerCase();
        const undercard = event.undercard.map(a => a.name.toLowerCase()).join(' ');
        return (
          title.includes(search) ||
          venue.includes(search) ||
          headliner.includes(search) ||
          undercard.includes(search)
        );
      });
    }

    // Date range filter (only for past events)
    if (isPast && dateRange !== 'all') {
      result = result.filter(event => isWithinDateRange(event.date, dateRange));
    }

    // Sort
    // For past events sorted by date, invert direction so "asc" shows most recent first
    // (This is the expected behavior - users want to see recent past events first)
    const effectiveDirection = isPast && sortField === 'date'
      ? (sortDirection === 'asc' ? 'desc' : 'asc')
      : sortDirection;

    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else {
        const aName = a.title || a.headliner.name;
        const bName = b.title || b.headliner.name;
        comparison = aName.localeCompare(bName);
      }
      return effectiveDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  };

  const filteredUpcoming = useMemo(
    () => processEvents(upcomingEvents, false),
    [upcomingEvents, searchText, sortField, sortDirection]
  );

  const filteredPast = useMemo(
    () => processEvents(pastEvents, true),
    [pastEvents, searchText, sortField, sortDirection, dateRange]
  );

  const handleClearSearch = () => {
    setSearchText('');
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div
      className={cn(
        'min-h-screen w-full',
        'pt-[80px] pb-[100px]',
        'overflow-y-auto',
        className
      )}
    >
      {/* Header with Logo */}
      <div className='px-[20px] pt-[20px] pb-[10px]'>
        <div className='flex items-center justify-center mb-[20px]'>
          <ForceMajeureLogo size='sm' className='h-12 w-12' />
        </div>
      </div>

      {/* Search Bar */}
      <div className='px-[20px] pb-[10px] sticky top-[80px] z-30 bg-gradient-to-b from-black via-black/95 to-transparent'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fm-gold' />
          <Input
            type='text'
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder={t('home.searchEvents') || 'Search events...'}
            className={cn(
              'pl-10 pr-10 h-[44px] text-sm',
              'bg-black/60 backdrop-blur-sm',
              'border border-white/20',
              'focus:border-fm-gold/50 focus:ring-0',
              'placeholder:text-muted-foreground/60',
              'rounded-none'
            )}
          />
          {searchText && (
            <button
              type='button'
              onClick={handleClearSearch}
              className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
            >
              <X className='h-4 w-4' />
            </button>
          )}
        </div>

        {/* Sort & Filter Controls */}
        <div className='flex items-center gap-[10px] mt-[10px]'>
          {/* Sort Field */}
          <select
            value={sortField}
            onChange={e => setSortField(e.target.value as SortField)}
            className={cn(
              'flex-1 h-[36px] px-[10px] text-xs',
              'bg-black/60 backdrop-blur-sm',
              'border border-white/20',
              'text-foreground',
              'focus:border-fm-gold/50 focus:outline-none',
              'rounded-none appearance-none',
              'cursor-pointer'
            )}
          >
            <option value='date'>{tCommon('filters.sortByDate')}</option>
            <option value='name'>{tCommon('filters.sortByName')}</option>
          </select>

          {/* Sort Direction Toggle */}
          <button
            type='button'
            onClick={toggleSortDirection}
            className={cn(
              'h-[36px] w-[36px] flex items-center justify-center',
              'bg-black/60 backdrop-blur-sm',
              'border border-white/20',
              'hover:bg-white/10 hover:border-fm-gold/30',
              'transition-all duration-200'
            )}
            title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
          >
            <ArrowUpDown
              className={cn(
                'h-4 w-4 text-muted-foreground',
                sortDirection === 'asc' && 'rotate-180'
              )}
            />
          </button>

          {/* Date Range Filter (only shown when past events visible) */}
          {(showPastEvents || hasNoUpcoming) && pastEvents.length > 0 && (
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value as DateRange)}
              className={cn(
                'flex-1 h-[36px] px-[10px] text-xs',
                'bg-black/60 backdrop-blur-sm',
                'border border-white/20',
                'text-foreground',
                'focus:border-fm-gold/50 focus:outline-none',
                'rounded-none appearance-none',
                'cursor-pointer'
              )}
            >
              <option value='all'>{tCommon('filters.dateRange.allTime')}</option>
              <option value='week'>{tCommon('filters.dateRange.pastWeek')}</option>
              <option value='month'>{tCommon('filters.dateRange.pastMonth')}</option>
              <option value='year'>{tCommon('filters.dateRange.pastYear')}</option>
            </select>
          )}
        </div>
      </div>

      {/* Upcoming Events Section */}
      <div className='px-[20px]'>
        {filteredUpcoming.length > 0 && (
          <>
            <h2 className='text-xs uppercase tracking-wider text-muted-foreground mb-[10px]'>
              {t('home.upcomingEvents') || 'Upcoming'}
            </h2>
            <div className='space-y-[10px]'>
              {filteredUpcoming.map(event => (
                <MobileEventRowCard
                  key={event.id}
                  event={event}
                  isPastEvent={false}
                />
              ))}
            </div>
          </>
        )}

        {/* Past Events Section */}
        {pastEvents.length > 0 && (
          <div className={cn(filteredUpcoming.length > 0 ? 'mt-[20px]' : 'mt-0')}>
            {/* Show toggle button only when there are upcoming events */}
            {!hasNoUpcoming && (
              <button
                onClick={() => setShowPastEvents(!showPastEvents)}
                className={cn(
                  'w-full flex items-center justify-between',
                  'py-[10px] px-[10px]',
                  'bg-white/5 border border-white/10',
                  'hover:bg-white/10 hover:border-white/20',
                  'transition-all duration-200'
                )}
              >
                <span className='text-xs uppercase tracking-wider text-muted-foreground'>
                  {t('home.pastEventsTitle') || 'Past Events'} ({filteredPast.length})
                </span>
                {showPastEvents ? (
                  <ChevronUp className='h-4 w-4 text-muted-foreground' />
                ) : (
                  <ChevronDown className='h-4 w-4 text-muted-foreground' />
                )}
              </button>
            )}

            {/* Show header when auto-displaying (no upcoming events) */}
            {hasNoUpcoming && (
              <h2 className='text-xs uppercase tracking-wider text-muted-foreground mb-[10px]'>
                {t('home.pastEventsTitle') || 'Past Events'}
              </h2>
            )}

            {/* Past Events List - always visible when hasNoUpcoming, otherwise toggle */}
            {(hasNoUpcoming || showPastEvents) && filteredPast.length > 0 && (
              <div className={cn('space-y-[10px]', !hasNoUpcoming && 'mt-[10px]')}>
                {filteredPast.map(event => (
                  <MobileEventRowCard
                    key={event.id}
                    event={event}
                    isPastEvent={true}
                  />
                ))}
              </div>
            )}

            {/* Empty state for past events when filtered */}
            {(hasNoUpcoming || showPastEvents) && filteredPast.length === 0 && searchText && (
              <div className='py-[20px]'>
                <FmCommonEmptyState
                  icon={CalendarX}
                  title={t('events.noMatchingEvents') || 'No matching events'}
                  size='sm'
                  iconClassName='text-fm-gold'
                />
              </div>
            )}
          </div>
        )}

        {/* Empty State - no events at all */}
        {upcomingEvents.length === 0 && pastEvents.length === 0 && (
          <div className='py-[40px]'>
            <FmCommonEmptyState
              icon={CalendarX}
              title={t('home.noUpcomingEvents') || 'No events'}
              size='sm'
              iconClassName='text-fm-gold'
            />
          </div>
        )}
      </div>
    </div>
  );
}

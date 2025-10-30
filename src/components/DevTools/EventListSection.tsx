import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Search } from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';

import { FmCommonList, FmCommonListColumn } from '@/components/ui/data/FmCommonList';
import { Input } from '@/components/ui/shadcn/input';
import { Label } from '@/components/ui/shadcn/label';
import { Switch } from '@/components/ui/shadcn/switch';
import { useEvents } from '@/features/events/hooks/useEvents';

interface EventListItem {
  id: string;
  title: string;
  date: string;
  time: string;
  venue?: { name: string };
  headliner?: { name: string };
}

export const EventListSection = () => {
  const { data: events, isLoading } = useEvents();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [includePastEvents, setIncludePastEvents] = useState(false);

  // Filter and search events
  const filteredEvents = useMemo(() => {
    if (!events) return [];

    let filtered = [...events];

    // Filter out past events if toggle is off
    if (!includePastEvents) {
      filtered = filtered.filter(event => {
        if (!event.date) return true;
        return !isPast(parseISO(event.date));
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => {
        const title = event.title?.toLowerCase() || '';
        const venueName = (event as any).venue?.name?.toLowerCase() || '';
        const headlinerName = (event as any).headliner?.name?.toLowerCase() || '';

        return (
          title.includes(query) ||
          venueName.includes(query) ||
          headlinerName.includes(query)
        );
      });
    }

    return filtered;
  }, [events, searchQuery, includePastEvents]);

  const columns: FmCommonListColumn<EventListItem>[] = [
    {
      key: 'headliner',
      label: 'Headliner',
      render: (_, item) => (
        <div className="font-medium text-white">
          {(item as any).headliner?.name || item.title || '-'}
        </div>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      render: (value) => {
        if (!value) return <span className="text-muted-foreground">-</span>;
        try {
          const date = parseISO(value);
          const isEventPast = isPast(date);
          return (
            <div className="flex items-center gap-2">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className={isEventPast ? 'text-muted-foreground' : 'text-white'}>
                {format(date, 'MMM dd, yyyy')}
              </span>
            </div>
          );
        } catch {
          return <span className="text-muted-foreground">-</span>;
        }
      },
    },
    {
      key: 'venue',
      label: 'Venue',
      render: (_, item) => (
        <span className="text-muted-foreground text-xs">
          {(item as any).venue?.name || '-'}
        </span>
      ),
    },
  ];

  const handleRowClick = (item: EventListItem) => {
    // Navigate directly to event management page
    navigate(`/event/${item.id}/manage`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8 text-muted-foreground">
          Loading events...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="space-y-2">
        <Label htmlFor="event-search" className="text-white/70 text-xs">
          Search Events
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="event-search"
            type="text"
            placeholder="Search by title, venue, or artist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </div>
      </div>

      {/* Include Past Events Toggle */}
      <div className="flex items-center justify-between py-2">
        <Label htmlFor="include-past" className="text-white/70 text-sm cursor-pointer">
          Include past events
        </Label>
        <Switch
          id="include-past"
          checked={includePastEvents}
          onCheckedChange={setIncludePastEvents}
        />
      </div>

      {/* Event List */}
      <div className="space-y-2">
        <div className="text-white/50 text-xs mb-2">
          {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
        </div>
        <FmCommonList
          items={filteredEvents}
          columns={columns}
          striped
          dense
          emptyMessage={searchQuery ? "No events match your search" : includePastEvents ? "No events found" : "No upcoming events"}
          rowClassName="hover:bg-fm-gold/10 transition-colors border-b border-white/5"
          className="max-h-[500px] overflow-y-auto"
          onRowClick={handleRowClick}
        />
      </div>
    </div>
  );
};

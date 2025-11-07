import * as React from 'react';
import { Calendar } from 'lucide-react';
import {
  FmCommonSearchDropdown,
  SearchDropdownOption,
} from './FmCommonSearchDropdown';
import { supabase } from '@/shared/api/supabase/client';

interface FmEventSearchDropdownProps {
  value?: string;
  onChange: (value: string) => void;
  onCreateNew?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export function FmEventSearchDropdown({
  value,
  onChange,
  onCreateNew,
  placeholder = 'Search for an event...',
  disabled = false,
}: FmEventSearchDropdownProps) {
  const [selectedEvent, setSelectedEvent] = React.useState<{
    title: string;
  } | null>(null);

  React.useEffect(() => {
    if (value) {
      supabase
        .from('events')
        .select('title')
        .eq('id', value)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setSelectedEvent({ title: data.title });
          }
        });
    } else {
      setSelectedEvent(null);
    }
  }, [value]);

  const handleSearch = async (
    query: string
  ): Promise<SearchDropdownOption[]> => {
    const { data, error } = await supabase
      .from('events')
      .select(
        `
        id,
        title,
        date,
        headliner:headliner_id (
          id,
          name,
          image_url
        ),
        venue:venue_id (
          id,
          name
        ),
        undercard_ids
      `
      )
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })
      .limit(50);

    if (error || !data) return [];

    // Collect all unique undercard IDs across all events
    const allUndercardIds = new Set<string>();
    data.forEach((event: any) => {
      if (event.undercard_ids && event.undercard_ids.length > 0) {
        event.undercard_ids.forEach((id: string) => allUndercardIds.add(id));
      }
    });

    // Fetch all undercard artists in a single query
    let undercardMap = new Map<string, string>();
    if (allUndercardIds.size > 0) {
      const { data: undercards } = await supabase
        .from('artists')
        .select('id, name')
        .in('id', Array.from(allUndercardIds));

      if (undercards) {
        undercards.forEach((artist: any) => {
          undercardMap.set(artist.id, artist.name);
        });
      }
    }

    // Map undercard IDs to names for each event
    const eventsWithUndercards = data.map((event: any) => ({
      ...event,
      undercards: event.undercard_ids
        ? event.undercard_ids
            .map((id: string) => ({ name: undercardMap.get(id) }))
            .filter((uc: any) => uc.name)
        : [],
    }));

    // Filter results to match search query against multiple fields
    const filtered = eventsWithUndercards.filter((event: any) => {
      const searchLower = query.toLowerCase();
      const titleMatch = event.title?.toLowerCase().includes(searchLower);
      const headlinerMatch = event.headliner?.name
        ?.toLowerCase()
        .includes(searchLower);
      const venueMatch = event.venue?.name?.toLowerCase().includes(searchLower);
      const undercardMatch = event.undercards?.some((uc: any) =>
        uc.name?.toLowerCase().includes(searchLower)
      );

      return titleMatch || headlinerMatch || venueMatch || undercardMatch;
    });

    return filtered.slice(0, 10).map((event: any) => {
      const headlinerImage = event.headliner?.image_url;

      return {
        id: event.id,
        label: `${event.title} - ${new Date(event.date).toLocaleDateString()}`,
        icon: headlinerImage ? (
          <img
            src={headlinerImage}
            alt={event.title}
            className='h-8 w-8 rounded-full object-cover'
          />
        ) : (
          <div className='h-8 w-8 rounded-full bg-white/10 flex items-center justify-center'>
            <Calendar className='h-4 w-4 text-white/50' />
          </div>
        ),
      };
    });
  };

  return (
    <FmCommonSearchDropdown
      onChange={onChange}
      onSearch={handleSearch}
      onCreateNew={onCreateNew}
      placeholder={placeholder}
      createNewLabel='+ Create New Event'
      selectedLabel={selectedEvent?.title}
      disabled={disabled}
    />
  );
}

import * as React from 'react';
import { Calendar } from 'lucide-react';
import { FmCommonSearchDropdown, SearchDropdownOption } from './FmCommonSearchDropdown';
import { supabase } from '@/integrations/supabase/client';

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
  const [selectedEvent, setSelectedEvent] = React.useState<{ title: string } | null>(null);

  React.useEffect(() => {
    if (value) {
      supabase
        .from('events' as any)
        .select('title')
        .eq('id', value)
        .maybeSingle()
        .then(({ data }: any) => {
          if (data) {
            setSelectedEvent({ title: data.title });
          }
        });
    } else {
      setSelectedEvent(null);
    }
  }, [value]);

  const handleSearch = async (query: string): Promise<SearchDropdownOption[]> => {
    const { data, error } = await supabase
      .from('events' as any)
      .select(`
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
      `)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })
      .limit(50);

    if (error || !data) return [];

    // Get undercard artist names for events with undercard_ids
    const eventsWithUndercards = await Promise.all(
      (data as any[]).map(async (event: any) => {
        if (event.undercard_ids && event.undercard_ids.length > 0) {
          const { data: undercards } = await supabase
            .from('artists' as any)
            .select('name')
            .in('id', event.undercard_ids);
          
          return {
            ...event,
            undercards: undercards || [],
          };
        }
        return { ...event, undercards: [] };
      })
    );

    // Filter results to match search query against multiple fields
    const filtered = eventsWithUndercards.filter((event: any) => {
      const searchLower = query.toLowerCase();
      const titleMatch = event.title?.toLowerCase().includes(searchLower);
      const headlinerMatch = event.headliner?.name?.toLowerCase().includes(searchLower);
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
          <img src={headlinerImage} alt={event.title} className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
            <Calendar className="h-4 w-4 text-white/50" />
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
      createNewLabel="+ Create New Event"
      selectedLabel={selectedEvent?.title}
      disabled={disabled}
    />
  );
}

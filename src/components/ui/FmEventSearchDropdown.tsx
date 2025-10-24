import * as React from 'react';
import { Calendar } from 'lucide-react';
import { FmCommonSearchDropdown, SearchDropdownOption } from './FmCommonSearchDropdown';
import { supabase } from '@/integrations/supabase/client';

interface FmEventSearchDropdownProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function FmEventSearchDropdown({
  value,
  onChange,
  placeholder = 'Search for an event...',
  disabled = false,
}: FmEventSearchDropdownProps) {
  const [selectedEvent, setSelectedEvent] = React.useState<{ title: string } | null>(null);

  React.useEffect(() => {
    if (value) {
      supabase
        .from('events')
        .select('title')
        .eq('id', value)
        .single()
        .then(({ data }) => {
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
      .from('events')
      .select(`
        id,
        title,
        date,
        artists:headliner_id (
          image_url
        )
      `)
      .ilike('title', `%${query}%`)
      .limit(10);

    if (error || !data) return [];

    return data.map((event) => {
      const headlinerImage = event.artists && typeof event.artists === 'object' && 'image_url' in event.artists
        ? event.artists.image_url
        : null;

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
      placeholder={placeholder}
      selectedLabel={selectedEvent?.title}
      disabled={disabled}
    />
  );
}

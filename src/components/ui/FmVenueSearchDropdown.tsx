import * as React from 'react';
import { MapPin } from 'lucide-react';
import { FmCommonSearchDropdown, SearchDropdownOption } from './FmCommonSearchDropdown';
import { supabase } from '@/integrations/supabase/client';

interface FmVenueSearchDropdownProps {
  value?: string;
  onChange: (value: string) => void;
  onCreateNew?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export function FmVenueSearchDropdown({
  value,
  onChange,
  onCreateNew,
  placeholder = 'Search for a venue...',
  disabled = false,
}: FmVenueSearchDropdownProps) {
  const [selectedVenue, setSelectedVenue] = React.useState<{ name: string } | null>(null);

  React.useEffect(() => {
    if (value) {
      supabase
        .from('venues')
        .select('name')
        .eq('id', value)
        .single()
        .then(({ data }) => {
          if (data) {
            setSelectedVenue({ name: data.name });
          }
        });
    } else {
      setSelectedVenue(null);
    }
  }, [value]);

  const handleSearch = async (query: string): Promise<SearchDropdownOption[]> => {
    const { data, error } = await supabase
      .from('venues')
      .select('id, name, city')
      .ilike('name', `%${query}%`)
      .limit(10);

    if (error || !data) return [];

    return data.map((venue) => ({
      id: venue.id,
      label: `${venue.name}${venue.city ? ` - ${venue.city}` : ''}`,
      icon: (
        <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
          <MapPin className="h-4 w-4 text-white/50" />
        </div>
      ),
    }));
  };

  return (
    <FmCommonSearchDropdown
      onChange={onChange}
      onSearch={handleSearch}
      onCreateNew={onCreateNew}
      placeholder={placeholder}
      createNewLabel="+ Create New Venue"
      selectedLabel={selectedVenue?.name}
      disabled={disabled}
    />
  );
}

import * as React from 'react';
import { MapPin } from 'lucide-react';
import { FmCommonSearchDropdown, SearchDropdownOption } from './FmCommonSearchDropdown';
import { supabase } from '@/integrations/supabase/client';

interface FmCitySearchDropdownProps {
  value?: string;
  onChange: (value: string) => void;
  onCreateNew?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export function FmCitySearchDropdown({
  value,
  onChange,
  onCreateNew,
  placeholder = 'Search for a city...',
  disabled = false,
}: FmCitySearchDropdownProps) {
  const [selectedCity, setSelectedCity] = React.useState<{ name: string; state: string } | null>(null);

  React.useEffect(() => {
    if (value) {
      supabase
        .from('cities')
        .select('name, state')
        .eq('id', value)
        .single()
        .then(({ data }) => {
          if (data) {
            setSelectedCity({ name: data.name, state: data.state });
          }
        });
    } else {
      setSelectedCity(null);
    }
  }, [value]);

  const handleSearch = async (query: string): Promise<SearchDropdownOption[]> => {
    const { data, error } = await supabase
      .from('cities')
      .select('id, name, state')
      .or(`name.ilike.%${query}%,state.ilike.%${query}%`)
      .limit(10);

    if (error || !data) return [];

    return data.map((city) => ({
      id: city.id,
      label: `${city.name}, ${city.state}`,
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
      createNewLabel="+ Create New City"
      selectedLabel={selectedCity ? `${selectedCity.name}, ${selectedCity.state}` : undefined}
      disabled={disabled}
    />
  );
}

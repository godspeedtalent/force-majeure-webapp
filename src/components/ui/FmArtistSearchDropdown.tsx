import * as React from 'react';
import { User } from 'lucide-react';
import { FmCommonSearchDropdown, SearchDropdownOption } from './FmCommonSearchDropdown';
import { supabase } from '@/integrations/supabase/client';

interface FmArtistSearchDropdownProps {
  value?: string;
  onChange: (value: string) => void;
  onCreateNew?: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export function FmArtistSearchDropdown({
  value,
  onChange,
  onCreateNew,
  placeholder = 'Search for an artist...',
  disabled = false,
}: FmArtistSearchDropdownProps) {
  const [selectedArtist, setSelectedArtist] = React.useState<{ name: string; imageUrl?: string } | null>(null);

  React.useEffect(() => {
    if (value) {
      supabase
        .from('artists')
        .select('name, image_url')
        .eq('id', value)
        .single()
        .then(({ data }) => {
          if (data) {
            setSelectedArtist({ name: data.name, imageUrl: data.image_url || undefined });
          }
        });
    } else {
      setSelectedArtist(null);
    }
  }, [value]);

  const handleSearch = async (query: string): Promise<SearchDropdownOption[]> => {
    const { data, error } = await supabase
      .from('artists')
      .select('id, name, image_url')
      .ilike('name', `%${query}%`)
      .limit(10);

    if (error || !data) return [];

    return data.map((artist) => ({
      id: artist.id,
      label: artist.name,
      icon: artist.image_url ? (
        <img src={artist.image_url} alt={artist.name} className="h-8 w-8 rounded-full object-cover" />
      ) : (
        <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
          <User className="h-4 w-4 text-white/50" />
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
      createNewLabel="+ Create New Artist"
      selectedLabel={selectedArtist?.name}
      disabled={disabled}
    />
  );
}

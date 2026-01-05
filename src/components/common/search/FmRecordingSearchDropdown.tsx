import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Music, Disc } from 'lucide-react';
import {
  FmCommonSearchDropdown,
  SearchDropdownOption,
} from './FmCommonSearchDropdown';
import { supabase, logger } from '@/shared';

interface Recording {
  id: string;
  name: string;
  cover_art: string | null;
  platform: string;
  is_primary_dj_set: boolean;
}

interface FmRecordingSearchDropdownProps {
  /** Artist ID to filter recordings for */
  artistId: string;
  /** Current selected value */
  value?: string | null;
  /** Called when value changes */
  onChange: (value: string, recording?: Recording) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the dropdown is disabled */
  disabled?: boolean;
  /** Filter to only show DJ sets */
  djSetsOnly?: boolean;
}

/**
 * FmRecordingSearchDropdown
 *
 * A search dropdown for selecting artist recordings (DJ sets).
 * Filters by artist ID and optionally by recording type.
 * Autopopulates with top DJ sets sorted by is_primary_dj_set.
 */
export const FmRecordingSearchDropdown = ({
  artistId,
  value,
  onChange,
  placeholder = 'Search for a recording...',
  disabled = false,
  djSetsOnly = true,
}: FmRecordingSearchDropdownProps) => {
  const [selectedItem, setSelectedItem] = React.useState<{
    label: string;
    data?: Recording;
  } | null>(null);

  // Load selected item when value changes
  React.useEffect(() => {
    if (value) {
      supabase
        .from('artist_recordings')
        .select('id, name, cover_art, platform, is_primary_dj_set')
        .eq('id', value)
        .single()
        .then(({ data }) => {
          if (data) {
            setSelectedItem({ label: data.name, data: data as Recording });
          }
        });
    } else {
      setSelectedItem(null);
    }
  }, [value]);

  // Fetch top DJ sets for initial/default options
  const { data: topRecordings = [] } = useQuery({
    queryKey: ['artist-top-recordings', artistId, djSetsOnly],
    queryFn: async () => {
      let query = supabase
        .from('artist_recordings')
        .select('id, name, cover_art, platform, is_primary_dj_set')
        .eq('artist_id', artistId)
        .order('is_primary_dj_set', { ascending: false })
        .limit(5);

      // For now, we don't have recording_type in the current schema
      // but we can use is_primary_dj_set as a proxy for DJ sets

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to fetch top recordings', {
          source: 'FmRecordingSearchDropdown',
          error: error.message,
          artistId,
        });
        return [];
      }

      return (data || []) as Recording[];
    },
    enabled: !!artistId,
  });

  // Search handler
  const handleSearch = async (query: string): Promise<SearchDropdownOption[]> => {
    let queryBuilder = supabase
      .from('artist_recordings')
      .select('id, name, cover_art, platform, is_primary_dj_set')
      .eq('artist_id', artistId)
      .ilike('name', `%${query}%`)
      .order('is_primary_dj_set', { ascending: false })
      .limit(10);

    const { data, error } = await queryBuilder;

    if (error) {
      logger.error('Recording search failed', {
        source: 'FmRecordingSearchDropdown',
        error: error.message,
        artistId,
        query,
      });
      return [];
    }

    return (data || []).map((recording: Recording) => ({
      id: recording.id,
      label: recording.name,
      icon: renderRecordingIcon(recording),
      data: recording,
    }));
  };

  // Get default/recent options (top DJ sets)
  const handleGetRecentOptions = async (): Promise<SearchDropdownOption[]> => {
    return topRecordings.map(recording => ({
      id: recording.id,
      label: recording.name,
      icon: renderRecordingIcon(recording),
      data: recording,
    }));
  };

  // Render icon for recording
  const renderRecordingIcon = (recording: Recording) => {
    if (recording.cover_art) {
      return (
        <img
          src={recording.cover_art}
          alt={recording.name}
          className='h-8 w-8 object-cover'
        />
      );
    }

    return (
      <div className='h-8 w-8 bg-white/10 flex items-center justify-center'>
        {recording.is_primary_dj_set ? (
          <Disc className='h-4 w-4 text-fm-gold' />
        ) : (
          <Music className='h-4 w-4 text-white/50' />
        )}
      </div>
    );
  };

  // Change handler
  const handleChange = (newValue: string, _label?: string, data?: any) => {
    onChange(newValue, data as Recording);
  };

  return (
    <FmCommonSearchDropdown
      onChange={handleChange}
      onSearch={handleSearch}
      onGetRecentOptions={handleGetRecentOptions}
      placeholder={placeholder}
      selectedLabel={selectedItem?.label}
      disabled={disabled || !artistId}
      typeIcon={<Disc className='h-3 w-3 text-fm-gold' />}
      typeTooltip='DJ Set'
      selectedValue={value || undefined}
    />
  );
};

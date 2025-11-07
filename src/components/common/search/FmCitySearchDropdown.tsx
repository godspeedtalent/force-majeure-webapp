import { MapPin } from 'lucide-react';
import { createSearchDropdown } from './createSearchDropdown';

interface City {
  id: string;
  name: string;
  state: string;
}

export const FmCitySearchDropdown = createSearchDropdown<City>({
  tableName: 'cities',
  searchField: query => `name.ilike.%${query}%,state.ilike.%${query}%`,
  selectFields: 'id, name, state',
  formatLabel: city => `${city.name}, ${city.state}`,
  renderIcon: () => (
    <div className='h-8 w-8 rounded-full bg-white/10 flex items-center justify-center'>
      <MapPin className='h-4 w-4 text-white/50' />
    </div>
  ),
  defaultPlaceholder: 'Search for a city...',
  createNewLabel: '+ Create New City',
  useRecents: false,
});

import { MapPin } from 'lucide-react';
import { createSearchDropdown } from './createSearchDropdown';

interface Venue {
  id: string;
  name: string;
  city: string | null;
}

export const FmVenueSearchDropdown = createSearchDropdown<Venue>({
  tableName: 'venues',
  searchField: 'name',
  selectFields: 'id, name, city',
  formatLabel: (venue) => `${venue.name}${venue.city ? ` - ${venue.city}` : ''}`,
  renderIcon: () => (
    <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
      <MapPin className="h-4 w-4 text-white/50" />
    </div>
  ),
  defaultPlaceholder: 'Search for a venue...',
  createNewLabel: '+ Create New Venue',
  useRecents: false,
});

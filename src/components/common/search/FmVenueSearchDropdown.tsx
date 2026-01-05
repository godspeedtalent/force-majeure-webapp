import { MapPin } from 'lucide-react';
import { createSearchDropdown } from './createSearchDropdown';

interface Venue {
  id: string;
  name: string;
  city: string | null;
  logo_url?: string | null;
}

export const FmVenueSearchDropdown = createSearchDropdown<Venue>({
  tableName: 'venues',
  searchField: 'name',
  selectFields: 'id, name, city, logo_url',
  formatLabel: venue => `${venue.name}${venue.city ? ` - ${venue.city}` : ''}`,
  renderIcon: venue =>
    venue.logo_url ? (
      <img
        src={venue.logo_url}
        alt={venue.name}
        className='h-8 w-8 rounded-full object-cover'
      />
    ) : (
      <div className='h-8 w-8 rounded-full bg-white/10 flex items-center justify-center'>
        <MapPin className='h-4 w-4 text-white/50' />
      </div>
    ),
  defaultPlaceholder: 'Search for a venue...',
  createNewLabel: '+ Create New Venue',
  createRoute: '/venues/create',
  useRecents: false,
  typeIcon: <MapPin className='h-3 w-3 text-white/70' />,
  typeTooltip: 'Venue',
  editRoute: '/developer/database',
  entityTypeName: 'Venue',
});

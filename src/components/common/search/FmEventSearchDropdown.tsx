import { Calendar } from 'lucide-react';
import { createSearchDropdown } from './createSearchDropdown';

interface Event {
  id: string;
  title: string;
  start_time: string;
  headliner: { id: string; name: string; image_url: string | null } | null;
  venue: { id: string; name: string } | null;
}

export const FmEventSearchDropdown = createSearchDropdown<Event>({
  tableName: 'events',
  // Only search on title - nested table fields don't work with PostgREST's or() filter
  searchField: 'title',
  selectFields: 'id, title, start_time, headliner:headliner_id(id, name, image_url), venue:venue_id(id, name)',
  formatLabel: event => {
    const title = event.title || 'Untitled Event';
    const date = new Date(event.start_time).toLocaleDateString();
    return `${title} - ${date}`;
  },
  renderIcon: event =>
    event.headliner?.image_url ? (
      <img
        src={event.headliner.image_url}
        alt={event.title || 'Event'}
        className='h-8 w-8 rounded-full object-cover'
      />
    ) : (
      <div className='h-8 w-8 rounded-full bg-white/10 flex items-center justify-center'>
        <Calendar className='h-4 w-4 text-white/50' />
      </div>
    ),
  defaultPlaceholder: 'Search for an event...',
  createNewLabel: '+ Create New Event',
  createRoute: '/events/create',
  useRecents: true,
  recentsKey: 'events',
  typeIcon: <Calendar className='h-3 w-3 text-white/70' />,
  typeTooltip: 'Event',
  editRoute: '/developer/database',
  entityTypeName: 'Event',
});

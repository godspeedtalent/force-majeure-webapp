import { User } from 'lucide-react';
import { createSearchDropdown } from './createSearchDropdown';

interface Artist {
  id: string;
  name: string;
  image_url: string | null;
}

export const FmArtistSearchDropdown = createSearchDropdown<Artist>({
  tableName: 'artists',
  searchField: 'name',
  selectFields: 'id, name, image_url',
  formatLabel: (artist) => artist.name,
  renderIcon: (artist) =>
    artist.image_url ? (
      <img
        src={artist.image_url}
        alt={artist.name}
        className="h-8 w-8 rounded-full object-cover"
      />
    ) : (
      <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
        <User className="h-4 w-4 text-white/50" />
      </div>
    ),
  defaultPlaceholder: 'Search for an artist...',
  createNewLabel: '+ Create New Artist',
  useRecents: true,
  recentsKey: 'artists',
});

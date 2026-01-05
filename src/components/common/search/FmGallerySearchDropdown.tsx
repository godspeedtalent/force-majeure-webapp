/**
 * FmGallerySearchDropdown
 *
 * Search dropdown for selecting media galleries.
 * Uses the createSearchDropdown factory for consistent behavior.
 */

import { FolderOpen } from 'lucide-react';
import { createSearchDropdown } from './createSearchDropdown';
import type { MediaGallery } from '@/features/media/types';

export const FmGallerySearchDropdown = createSearchDropdown<MediaGallery>({
  tableName: 'media_galleries',
  searchField: (query: string) =>
    `name.ilike.%${query}%,slug.ilike.%${query}%`,
  selectFields: 'id, slug, name, description, allowed_types, is_active',
  formatLabel: gallery => gallery.name,
  renderIcon: _gallery => (
    <div className='h-8 w-8 bg-white/10 flex items-center justify-center'>
      <FolderOpen className='h-4 w-4 text-white/50' />
    </div>
  ),
  defaultPlaceholder: 'Search galleries...',
  createNewLabel: '+ Create New Gallery',
  useRecents: true,
  recentsKey: 'galleries',
  typeIcon: <FolderOpen className='h-3 w-3 text-white/70' />,
  typeTooltip: 'Gallery',
});

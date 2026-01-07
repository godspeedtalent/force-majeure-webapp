/**
 * VenueMediaItemCard
 *
 * Individual media item card for venue gallery grid.
 * Shows thumbnail, cover badge, and action buttons on hover.
 */

import { useTranslation } from 'react-i18next';
import { Star, Edit, Trash2, Image as ImageIcon, Video, Music } from 'lucide-react';
import { ImageWithSkeleton } from '@/components/primitives/ImageWithSkeleton';
import { FmCommonIconButton } from '@/components/common/buttons/FmCommonIconButton';
import type { ResolvedMediaItem, MediaType } from '@/features/media/types';
import { cn } from '@/shared';

const MEDIA_TYPE_ICONS: Record<MediaType, typeof ImageIcon> = {
  image: ImageIcon,
  video: Video,
  audio: Music,
};

interface VenueMediaItemCardProps {
  item: ResolvedMediaItem;
  onSetCover: (itemId: string) => void;
  onEdit: (item: ResolvedMediaItem) => void;
  onDelete: (item: ResolvedMediaItem) => void;
}

export const VenueMediaItemCard = ({
  item,
  onSetCover,
  onEdit,
  onDelete,
}: VenueMediaItemCardProps) => {
  const { t } = useTranslation('common');
  const TypeIcon = MEDIA_TYPE_ICONS[item.media_type];
  const isCover = item.is_cover;

  return (
    <div
      className={cn(
        'group relative aspect-square bg-black/40 border overflow-hidden',
        isCover ? 'border-fm-gold border-2' : 'border-white/10'
      )}
    >
      {/* Thumbnail */}
      {item.media_type === 'image' ? (
        <ImageWithSkeleton
          src={item.url}
          alt={item.alt_text || ''}
          className='w-full h-full object-cover'
          skeletonClassName='bg-black/60'
        />
      ) : (
        <div className='w-full h-full flex items-center justify-center bg-black/60'>
          <TypeIcon className='w-8 h-8 text-muted-foreground' />
        </div>
      )}

      {/* Overlay on hover */}
      <div className='absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1'>
        <FmCommonIconButton
          icon={Star}
          size='sm'
          variant={isCover ? 'gold' : 'default'}
          tooltip={isCover ? t('venueGallery.coverImage', 'Cover image') : t('venueGallery.setAsCover', 'Set as cover')}
          onClick={() => onSetCover(item.id)}
        />
        <FmCommonIconButton
          icon={Edit}
          size='sm'
          variant='default'
          tooltip={t('buttons.edit', 'Edit')}
          onClick={() => onEdit(item)}
        />
        <FmCommonIconButton
          icon={Trash2}
          size='sm'
          variant='destructive'
          tooltip={t('buttons.delete', 'Delete')}
          onClick={() => onDelete(item)}
        />
      </div>

      {/* Order indicator */}
      <div className='absolute top-1 left-1 bg-black/70 px-1.5 py-0.5 text-xs'>
        {item.display_order + 1}
      </div>

      {/* Cover badge */}
      {isCover && (
        <div className='absolute top-1 right-1 bg-fm-gold text-black px-1.5 py-0.5 flex items-center gap-1'>
          <Star className='w-3 h-3 fill-current' />
          <span className='text-[10px] font-medium'>
            {t('venueGallery.cover', 'Cover')}
          </span>
        </div>
      )}

      {/* Type badge */}
      {item.media_type !== 'image' && !isCover && (
        <div className='absolute top-1 right-1 bg-black/70 px-1.5 py-0.5'>
          <TypeIcon className='w-3 h-3' />
        </div>
      )}
    </div>
  );
};

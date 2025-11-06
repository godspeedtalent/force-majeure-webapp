import { type ReactNode, useMemo } from 'react';

import { FmCommonModal } from '@/components/common/modals/FmCommonModal';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonBadgeGroup } from '@/components/common/display/FmCommonBadgeGroup';
import { DialogTitle } from '@/components/common/shadcn/dialog';
import { cn } from '@/shared/utils/utils';

export interface FmArtistDetailsModalProps {
  artist: {
    id?: string;
    name: string;
    genre?: string;
    image?: string | null;
    description?: ReactNode;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage?: boolean;
  onManage?: (artistId: string) => void;
}

const DEFAULT_DESCRIPTION =
  'More information about this artist will be available soon. Check back closer to the event for set times, featured tracks, and exclusive interviews.';

export const FmArtistDetailsModal = ({
  artist,
  open,
  onOpenChange,
  canManage = false,
  onManage,
}: FmArtistDetailsModalProps) => {
  const genreBadges = useMemo(() => {
    if (!artist?.genre) {
      return [];
    }
    return artist.genre
      .split(/[,/|]/)
      .map(genre => genre.trim())
      .filter(Boolean);
  }, [artist?.genre]);

  const showManage = canManage && !!artist?.id && onManage;

  const handleManage = () => {
    if (artist?.id && onManage) {
      onManage(artist.id);
    }
  };

  const badgeItems = useMemo(
    () =>
      genreBadges.map(label => ({
        label,
        className: 'border-fm-gold/60 bg-fm-gold/10 text-fm-gold',
      })),
    [genreBadges]
  );

  return (
    <FmCommonModal
      open={open}
      onOpenChange={onOpenChange}
      title={artist?.name ?? 'Artist'}
      headerContent={
        <div className='flex justify-end pr-12'>
          <DialogTitle className='sr-only'>{artist?.name ?? 'Artist'}</DialogTitle>
          {showManage && (
            <FmCommonButton
              size='sm'
              variant='secondary'
              onClick={handleManage}
              className='bg-white/10 text-white hover:bg-white/20'
            >
              Manage
            </FmCommonButton>
          )}
        </div>
      }
      className='max-w-3xl'
    >
      <div className='flex flex-col gap-8 sm:flex-row sm:items-stretch'>
        <div className='sm:w-60 flex-shrink-0'>
          <div className='space-y-3'>
            <p className='text-[10px] uppercase tracking-[0.35em] text-white/50'>
              Artist Spotlight
            </p>
            <h2 className='text-3xl font-canela font-semibold text-white leading-tight'>
              {artist?.name ?? 'Artist'}
            </h2>
          </div>
          <div className='mt-4 overflow-hidden rounded-xl border border-white/15 bg-white/5 shadow-inner'>
            {artist?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={artist.image}
                alt={artist.name}
                className='aspect-[3/4] w-full object-cover'
              />
            ) : (
              <div className='aspect-[3/4] w-full bg-gradient-to-br from-fm-gold/15 via-fm-gold/5 to-transparent' />
            )}
          </div>
        </div>

        <div className='flex-1 flex flex-col justify-center gap-6 sm:min-h-[320px]'>
          <div
            className={cn(
              'prose prose-invert max-w-none text-sm text-white/80 leading-relaxed',
              !artist?.description && 'italic text-white/60'
            )}
          >
            {artist?.description ?? DEFAULT_DESCRIPTION}
          </div>

          {badgeItems.length > 0 && (
            <FmCommonBadgeGroup
              badges={badgeItems}
              className='mt-auto'
              badgeClassName='border-fm-gold/60 bg-fm-gold/10 text-fm-gold'
              gap='lg'
            />
          )}
        </div>
      </div>
    </FmCommonModal>
  );
};

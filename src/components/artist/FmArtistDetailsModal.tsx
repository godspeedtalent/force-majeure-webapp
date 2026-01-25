import { type ReactNode, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Settings } from 'lucide-react';

import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { FmCommonIconButton } from '@/components/common/buttons/FmCommonIconButton';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmPortalTooltip } from '@/components/common/feedback/FmPortalTooltip';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/common/shadcn/dialog';
import { FmArtistSpotlight } from '@/components/artist/FmArtistSpotlight';
import { useArtistById } from '@/shared/api/queries/artistQueries';

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

export const FmArtistDetailsModal = ({
  artist,
  open,
  onOpenChange,
  canManage = false,
  onManage,
}: FmArtistDetailsModalProps) => {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  // Delay tooltip enabling to prevent it from showing immediately on modal open
  const [tooltipEnabled, setTooltipEnabled] = useState(false);

  useEffect(() => {
    if (!open) {
      setTooltipEnabled(false);
      return;
    }
    // Wait for modal animation to complete before enabling tooltip
    const timer = setTimeout(() => setTooltipEnabled(true), 400);
    return () => clearTimeout(timer);
  }, [open]);

  // Fetch full artist data when modal is open and we have an ID
  const { data: fullArtist, isLoading } = useArtistById(
    open && artist?.id ? artist.id : undefined
  );

  const handleViewDetails = () => {
    if (artist?.id) {
      onOpenChange(false);
      navigate(`/artists/${artist.id}`);
    }
  };

  const handleManage = () => {
    if (artist?.id && onManage) {
      onManage(artist.id);
    }
  };

  // "Artist Profile" button to show next to social links
  const profileButton = artist?.id ? (
    <FmCommonButton
      variant='secondary'
      size='sm'
      icon={ArrowRight}
      iconPosition='right'
      onClick={handleViewDetails}
      className='bg-white/10 text-white hover:bg-white/20 hover:text-fm-gold hover:shadow-[0_0_12px_rgba(207,173,118,0.3)]'
    >
      {t('artistDetails.artistProfile')}
    </FmCommonButton>
  ) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='w-[calc(100%-2rem)] sm:w-full max-w-3xl max-h-[90vh] p-0 gap-0 border-x-2 border-y-4 border-fm-gold/30 border-t-fm-gold border-b-fm-gold bg-gradient-to-br from-black/95 to-neutral-900/95 backdrop-blur-xl overflow-hidden flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.5)]'>
        <DialogTitle className='sr-only'>
          {artist?.name ?? t('artistDetails.defaultTitle')}
        </DialogTitle>

        {/* Sticky header bar */}
        <div className='sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-background/95 backdrop-blur-sm'>
          <p className='text-[10px] uppercase tracking-[0.35em] text-white/50 font-canela'>
            {t('artistPreview.spotlight')}
          </p>
          <div className='flex items-center gap-2'>
            {canManage && artist?.id && (
              tooltipEnabled ? (
                <FmPortalTooltip content={t('artistDetails.manage')} side='bottom'>
                  <FmCommonIconButton
                    icon={Settings}
                    onClick={handleManage}
                    variant='secondary'
                    size='sm'
                    aria-label={t('artistDetails.manage')}
                    className='bg-white/10 text-white hover:bg-white/20 hover:text-fm-gold hover:shadow-[0_0_12px_rgba(207,173,118,0.3)]'
                  />
                </FmPortalTooltip>
              ) : (
                <FmCommonIconButton
                  icon={Settings}
                  onClick={handleManage}
                  variant='secondary'
                  size='sm'
                  aria-label={t('artistDetails.manage')}
                  className='bg-white/10 text-white hover:bg-white/20 hover:text-fm-gold hover:shadow-[0_0_12px_rgba(207,173,118,0.3)]'
                />
              )
            )}
          </div>
        </div>

        {/* Scrollable content */}
        <div className='flex-1 overflow-y-auto'>
          {isLoading && artist?.id ? (
            <div className='flex items-center justify-center py-20'>
              <FmCommonLoadingSpinner size='lg' />
            </div>
          ) : fullArtist ? (
            <FmArtistSpotlight
              artist={fullArtist}
              showRecordings
              hideSpotlightHeader
              footerAction={profileButton}
            />
          ) : (
            <div className='flex items-center justify-center py-20 text-muted-foreground'>
              {t('artistDetails.defaultDescription')}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

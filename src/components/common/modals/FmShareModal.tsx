import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Copy, Check, Share2, Eye, MapPin, Calendar, Music } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/common/shadcn/dialog';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { cn } from '@/shared';
import { FmI18nCommon } from '@/components/common/i18n';

interface FmShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  url?: string;
  onShare?: () => void;
  shareCount?: number;
  viewCount?: number;
  eventImage?: string | null;
  venueName?: string;
  dateTime?: string;
  undercardArtists?: string[];
}

export const FmShareModal = ({
  open,
  onOpenChange,
  title,
  url = window.location.href,
  onShare,
  shareCount = 0,
  viewCount = 0,
  eventImage,
  venueName,
  dateTime,
  undercardArtists = [],
}: FmShareModalProps) => {
  // Keep t() for toast messages and interpolated values
  const { t } = useTranslation('common');
  const { t: tToast } = useTranslation('toasts');
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(tToast('success.copied'));

      // Call onShare callback to track the share
      if (onShare) {
        onShare();
      }

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      toast.error(tToast('share.copyFailed'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl bg-background/37 backdrop-blur-xl overflow-hidden'>
        <DialogHeader>
          <DialogTitle className='font-canela text-xl md:text-2xl flex items-center gap-3'>
            <Share2 className='h-5 w-5 text-fm-gold flex-shrink-0' />
            <FmI18nCommon i18nKey='share.shareEvent' />
          </DialogTitle>
        </DialogHeader>

        {/* Mobile: vertical stack, Desktop: horizontal */}
        <div className='flex flex-col md:flex-row gap-4 md:gap-6 mt-4 overflow-hidden'>
          {/* Event Image - compact on mobile */}
          {eventImage && (
            <div className='flex-shrink-0 md:w-48 lg:w-64 overflow-hidden'>
              <img
                src={eventImage}
                alt={title}
                className='w-full h-36 md:h-auto object-cover object-top rounded-none'
              />
            </div>
          )}

          {/* Content */}
          <div className='flex-1 space-y-4 md:space-y-6 min-w-0 overflow-hidden'>
            {/* Event Info Card */}
            <div className='p-3 md:p-4 border border-white/10 bg-white/5'>
              <p className='text-xs uppercase tracking-wider text-muted-foreground mb-1'>
                <FmI18nCommon i18nKey='share.sharing' />
              </p>
              <p className='font-canela text-lg md:text-xl text-foreground mb-2'>{title}</p>

              {/* Event Details - stacked on mobile */}
              <div className='space-y-1.5 text-sm'>
                {venueName && (
                  <div className='flex items-center gap-2 text-muted-foreground'>
                    <MapPin className='h-3.5 w-3.5 flex-shrink-0 text-fm-gold' />
                    <span className='truncate'>{venueName}</span>
                  </div>
                )}
                {dateTime && (
                  <div className='flex items-center gap-2 text-muted-foreground'>
                    <Calendar className='h-3.5 w-3.5 flex-shrink-0 text-fm-gold' />
                    <span className='truncate'>{dateTime}</span>
                  </div>
                )}
              </div>

              {/* Artists - separate line if present */}
              {undercardArtists.length > 0 && (
                <div className='flex items-start gap-2 text-sm text-muted-foreground mt-2 pt-2 border-t border-white/10'>
                  <Music className='h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-fm-gold' />
                  <span className='line-clamp-2'>{undercardArtists.join(' • ')}</span>
                </div>
              )}

              {/* Stats row */}
              {(shareCount > 0 || viewCount > 0) && (
                <div className='flex flex-wrap gap-x-4 gap-y-1 mt-2 pt-2 border-t border-white/10 text-xs text-muted-foreground'>
                  {shareCount > 0 && (
                    <div className='flex items-center gap-1.5'>
                      <Share2 className='h-3.5 w-3.5 flex-shrink-0' />
                      <span>{t('share.shareCount', { count: shareCount })}</span>
                    </div>
                  )}
                  {viewCount > 0 && (
                    <div className='flex items-center gap-1.5'>
                      <Eye className='h-3.5 w-3.5 flex-shrink-0' />
                      <span>{t('share.viewCount', { count: viewCount })}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* URL Display and Copy */}
            <div className='overflow-hidden'>
              <FmI18nCommon
                i18nKey='share.eventUrl'
                as='label'
                className='text-xs uppercase tracking-wider text-muted-foreground mb-2 block'
              />
              <div
                className={cn(
                  'relative flex items-center gap-2 p-3 border-2 border-b-[3px] rounded-none transition-all duration-300 cursor-pointer group',
                  'bg-background/40 hover:bg-white/5',
                  'border-white/20 hover:border-fm-gold border-b-fm-gold',
                  'hover:shadow-[0_4px_16px_rgba(223,186,125,0.2)]',
                  'active:shadow-[0_0_30px_rgba(223,186,125,0.4)] active:bg-fm-gold/10'
                )}
                onClick={handleCopyUrl}
              >
                <div className='flex-1 min-w-0'>
                  <p className='text-xs text-foreground group-hover:text-fm-gold truncate font-mono transition-colors duration-200'>
                    {url}
                  </p>
                </div>
                <div className='flex-shrink-0'>
                  {copied ? (
                    <Check className='h-4 w-4 text-green-500' />
                  ) : (
                    <Copy className='h-4 w-4 text-muted-foreground group-hover:text-fm-gold transition-colors' />
                  )}
                </div>
              </div>
              <FmI18nCommon
                i18nKey='share.clickToCopy'
                as='p'
                className='text-xs text-muted-foreground mt-2'
              />
            </div>

            {/* Action Buttons */}
            <div className='flex justify-end gap-3 pt-2'>
              <FmCommonButton
                variant='secondary'
                onClick={() => onOpenChange(false)}
              >
                <FmI18nCommon i18nKey='buttons.close' />
              </FmCommonButton>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

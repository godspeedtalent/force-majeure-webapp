import { useState } from 'react';
import { Copy, Check, Share2, Eye, MapPin, Calendar, Music } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/common/shadcn/dialog';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { cn } from '@/shared/utils/utils';

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
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard!');

      // Call onShare callback to track the share
      if (onShare) {
        onShare();
      }

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl bg-background/37 backdrop-blur-xl'>
        <DialogHeader>
          <DialogTitle className='font-canela text-2xl flex items-center gap-3'>
            <Share2 className='h-5 w-5 text-fm-gold' />
            Share event
          </DialogTitle>
        </DialogHeader>

        <div className='flex gap-6 mt-4'>
          {/* Left Column: Event Image */}
          {eventImage && (
            <div className='flex-shrink-0 w-64'>
              <img
                src={eventImage}
                alt={title}
                className='w-full h-full object-cover rounded-none'
              />
            </div>
          )}

          {/* Right Column: Content */}
          <div className='flex-1 space-y-6'>
            {/* Event Title with Stats */}
            <div>
              <p className='text-sm text-muted-foreground mb-2'>Sharing:</p>
              <div className='flex items-start justify-between gap-4'>
                <div className='flex-1'>
                  <p className='font-canela text-lg text-foreground mb-3'>{title}</p>
                  
                  {/* Event Details */}
                  <div className='space-y-2 text-sm'>
                    {venueName && (
                      <div className='flex items-center gap-2 text-muted-foreground'>
                        <MapPin className='h-3.5 w-3.5 flex-shrink-0 text-fm-gold' />
                        <span>{venueName}</span>
                      </div>
                    )}
                    {dateTime && (
                      <div className='flex items-center gap-2 text-muted-foreground'>
                        <Calendar className='h-3.5 w-3.5 flex-shrink-0 text-fm-gold' />
                        <span>{dateTime}</span>
                      </div>
                    )}
                    {undercardArtists.length > 0 && (
                      <div className='flex items-start gap-2 text-muted-foreground'>
                        <Music className='h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-fm-gold' />
                        <span>{undercardArtists.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className='flex flex-col gap-2 text-sm text-muted-foreground'>
                  {shareCount > 0 && (
                    <div className='flex items-center gap-2'>
                      <Share2 className='h-4 w-4' />
                      <span>{shareCount.toLocaleString()} share{shareCount === 1 ? '' : 's'}</span>
                    </div>
                  )}
                  {viewCount > 0 && (
                    <div className='flex items-center gap-2'>
                      <Eye className='h-4 w-4' />
                      <span>{viewCount.toLocaleString()} view{viewCount === 1 ? '' : 's'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* URL Display and Copy */}
            <div>
              <label className='text-xs uppercase text-muted-foreground mb-2 block'>
                Event URL
              </label>
              <div
                className={cn(
                  'relative flex items-center gap-3 p-4 border-2 border-t-2 border-l-2 border-r-2 border-b-[3px] rounded-none transition-all duration-300 cursor-pointer group overflow-hidden',
                  'bg-background/40 hover:bg-white/5',
                  'border-white/20 hover:border-fm-gold border-b-fm-gold',
                  'hover:shadow-[0_4px_16px_rgba(223,186,125,0.2)]',
                  'active:shadow-[0_0_30px_rgba(223,186,125,0.4)] active:bg-fm-gold/10'
                )}
                onClick={handleCopyUrl}
              >
                <div className='flex-1 min-w-0 overflow-hidden'>
                  <p className='text-sm text-foreground group-hover:text-fm-gold truncate font-mono transition-colors duration-200'>
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
              <p className='text-xs text-muted-foreground mt-2'>
                Click to copy link to clipboard
              </p>
            </div>

            {/* Action Buttons */}
            <div className='flex justify-end gap-3 pt-4'>
              <FmCommonButton
                variant='secondary'
                onClick={() => onOpenChange(false)}
              >
                Close
              </FmCommonButton>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

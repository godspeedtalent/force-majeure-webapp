import { useState } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';
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
}

export const FmShareModal = ({
  open,
  onOpenChange,
  title,
  url = window.location.href,
  onShare,
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
      <DialogContent className='max-w-md bg-background/95 backdrop-blur border-2 border-white/20'>
        <DialogHeader>
          <DialogTitle className='font-canela text-2xl flex items-center gap-3'>
            <Share2 className='h-5 w-5 text-fm-gold' />
            Share event
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-6 mt-4'>
          {/* Event Title */}
          <div>
            <p className='text-sm text-muted-foreground mb-2'>Sharing:</p>
            <p className='font-canela text-lg text-foreground'>{title}</p>
          </div>

          {/* URL Display and Copy */}
          <div>
            <label className='text-xs uppercase text-muted-foreground mb-2 block'>
              Event URL
            </label>
            <div
              className={cn(
                'relative flex items-center gap-3 p-4 border-2 rounded-none transition-all duration-200 cursor-pointer group',
                'bg-background/40 hover:bg-white/5',
                'border-white/20 hover:border-fm-gold',
                'hover:shadow-[0_4px_16px_rgba(223,186,125,0.2)]'
              )}
              onClick={handleCopyUrl}
            >
              <div className='flex-1 min-w-0'>
                <p className='text-sm text-foreground truncate font-mono'>
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
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              Close
            </FmCommonButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

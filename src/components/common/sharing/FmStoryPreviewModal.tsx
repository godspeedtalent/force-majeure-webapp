import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SiInstagram } from 'react-icons/si';
import { RefreshCw, Download, X } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/common/shadcn/dialog';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { cn } from '@/shared';
import {
  shareToInstagramStory,
  generateStoryPreview,
} from '@/shared/services/instagramStoryService';
import { StoryData } from './templates/BaseStoryTemplate';

/**
 * Props for FmStoryPreviewModal
 */
export interface FmStoryPreviewModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Story data for generation/sharing */
  storyData: StoryData;
  /** Pre-generated preview URL */
  previewUrl: string | null;
  /** Whether the preview is currently being generated */
  isGenerating: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
}

/**
 * FmStoryPreviewModal
 *
 * Modal that shows a preview of the Instagram Story before sharing.
 *
 * Features:
 * - Shows generated story preview (scaled down)
 * - "Share to Instagram" button
 * - Retry option if generation fails
 * - Loading state during generation
 */
export function FmStoryPreviewModal({
  open,
  onOpenChange,
  storyData,
  previewUrl,
  isGenerating,
  onClose,
}: FmStoryPreviewModalProps) {
  const { t } = useTranslation('common');
  const [isSharing, setIsSharing] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  // Use local preview if we retried, otherwise use the prop
  const displayPreviewUrl = localPreviewUrl || previewUrl;

  // Handle retry
  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    setHasError(false);

    try {
      const result = await generateStoryPreview(storyData);
      setLocalPreviewUrl(result.dataUrl);
    } catch {
      setHasError(true);
      toast.error(t('instagramStory.generationFailed'));
    } finally {
      setIsRetrying(false);
    }
  }, [storyData, t]);

  // Handle share to Instagram
  const handleShare = useCallback(async () => {
    setIsSharing(true);

    try {
      const success = await shareToInstagramStory(storyData);

      if (success) {
        toast.success(t('instagramStory.shareInitiated'));
        onClose();
      } else {
        toast.error(t('instagramStory.shareFailed'));
      }
    } catch {
      toast.error(t('instagramStory.shareFailed'));
    } finally {
      setIsSharing(false);
    }
  }, [storyData, t, onClose]);

  // Handle download (fallback)
  const handleDownload = useCallback(() => {
    if (!displayPreviewUrl) return;

    const link = document.createElement('a');
    link.href = displayPreviewUrl;
    link.download = `${storyData.title.replace(/[^a-z0-9]/gi, '_')}_story.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(t('instagramStory.downloaded'));
  }, [displayPreviewUrl, storyData.title, t]);

  // Determine what to show in the preview area
  const showLoading = isGenerating || isRetrying;
  const showError = hasError || (!showLoading && !displayPreviewUrl);
  const showPreview = !showLoading && !showError && displayPreviewUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-sm bg-background/95 backdrop-blur-xl p-0 overflow-hidden'>
        <DialogHeader className='p-4 pb-0'>
          <DialogTitle className='font-canela text-lg flex items-center gap-2'>
            <SiInstagram className='h-5 w-5 text-fm-gold' />
            {t('instagramStory.previewTitle')}
          </DialogTitle>
        </DialogHeader>

        {/* Preview Container */}
        <div className='px-4 py-2'>
          <div
            className={cn(
              'relative w-full aspect-[9/16] bg-black/50 border border-white/20',
              'overflow-hidden'
            )}
          >
            {/* Loading State */}
            {showLoading && (
              <div className='absolute inset-0 flex flex-col items-center justify-center gap-4'>
                <FmCommonLoadingSpinner size='lg' />
                <p className='text-sm text-muted-foreground'>
                  {t('instagramStory.generating')}
                </p>
              </div>
            )}

            {/* Error State */}
            {showError && (
              <div className='absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center'>
                <div className='p-4 rounded-full bg-destructive/10'>
                  <X className='h-8 w-8 text-destructive' />
                </div>
                <p className='text-sm text-muted-foreground'>
                  {t('instagramStory.generationFailed')}
                </p>
                <FmCommonButton
                  variant='secondary'
                  size='sm'
                  onClick={handleRetry}
                  icon={RefreshCw}
                >
                  {t('buttons.retry')}
                </FmCommonButton>
              </div>
            )}

            {/* Preview Image */}
            {showPreview && (
              <img
                src={displayPreviewUrl}
                alt={t('instagramStory.previewAlt')}
                className='w-full h-full object-contain'
              />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className='p-4 pt-2 space-y-3'>
          {/* Share Button */}
          <FmCommonButton
            variant='gold'
            className='w-full'
            onClick={handleShare}
            disabled={showLoading || showError || isSharing}
          >
            {isSharing ? (
              <>
                <FmCommonLoadingSpinner size='sm' className='mr-2' />
                {t('instagramStory.sharing')}
              </>
            ) : (
              <>
                <SiInstagram className='h-4 w-4 mr-2' />
                {t('instagramStory.shareToInstagram')}
              </>
            )}
          </FmCommonButton>

          {/* Secondary Actions */}
          <div className='flex gap-2'>
            <FmCommonButton
              variant='secondary'
              size='sm'
              className='flex-1'
              onClick={handleDownload}
              disabled={showLoading || showError}
              icon={Download}
            >
              {t('buttons.download')}
            </FmCommonButton>

            <FmCommonButton
              variant='secondary'
              size='sm'
              className='flex-1'
              onClick={onClose}
            >
              {t('buttons.cancel')}
            </FmCommonButton>
          </div>

          {/* Help Text */}
          <p className='text-xs text-muted-foreground text-center'>
            {t('instagramStory.helpText')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

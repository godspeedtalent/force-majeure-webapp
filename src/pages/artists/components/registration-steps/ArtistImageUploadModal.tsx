import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { FmFlexibleImageUpload } from '@/components/common/forms/FmFlexibleImageUpload';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/common/shadcn/dialog';

interface ArtistImageUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  value: string;
  onUpload: (url: string) => void;
  isPrimary?: boolean;
}

/**
 * Modal for uploading artist profile and press images
 * Uses FmFlexibleImageUpload with Supabase Storage integration
 */
export function ArtistImageUploadModal({
  open,
  onOpenChange,
  label,
  value,
  onUpload,
  isPrimary = false,
}: ArtistImageUploadModalProps) {
  const { t } = useTranslation('common');

  const handleImageChange = (url: string) => {
    onUpload(url);
    if (url) {
      // Close modal after successful upload
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[500px] bg-background/95 backdrop-blur-xl border-white/20'>
        <DialogHeader>
          <DialogTitle className='font-canela text-xl flex items-center justify-between'>
            {label}
            <button
              type='button'
              onClick={() => onOpenChange(false)}
              className='rounded-none p-1 hover:bg-white/10 transition-colors'
            >
              <X className='h-4 w-4' />
            </button>
          </DialogTitle>
        </DialogHeader>

        <div className='py-4'>
          <FmFlexibleImageUpload
            value={value}
            onChange={handleImageChange}
            label={label}
            bucket='artist-images'
            pathPrefix='registrations'
            isPrimary={isPrimary}
          />
        </div>

        <p className='text-xs text-muted-foreground font-canela'>
          {t('upload.supportedFormats')}
        </p>
      </DialogContent>
    </Dialog>
  );
}

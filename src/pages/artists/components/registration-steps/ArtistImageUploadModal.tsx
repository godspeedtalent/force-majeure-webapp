import { useTranslation } from 'react-i18next';
import { FmFlexibleImageUpload } from '@/components/common/forms/FmFlexibleImageUpload';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
          <DialogTitle className='font-canela text-xl'>
            {label}
          </DialogTitle>
          <DialogDescription className='text-muted-foreground'>
            {t('upload.supportedFormats')}
          </DialogDescription>
        </DialogHeader>

        <div className='py-4'>
          <FmFlexibleImageUpload
            value={value}
            onChange={handleImageChange}
            bucket='artist-images'
            pathPrefix='registrations'
            isPrimary={isPrimary}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
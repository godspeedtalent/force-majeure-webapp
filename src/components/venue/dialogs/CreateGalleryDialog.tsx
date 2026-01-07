/**
 * CreateGalleryDialog
 *
 * Dialog for creating a new gallery.
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FolderPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/common/shadcn/dialog';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';

interface CreateGalleryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string) => Promise<void>;
}

export const CreateGalleryDialog = ({
  open,
  onOpenChange,
  onCreate,
}: CreateGalleryDialogProps) => {
  const { t } = useTranslation('common');
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      await onCreate(name.trim());
      setName('');
      onOpenChange(false);
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setName('');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <FolderPlus className='w-5 h-5' />
            {t('venueGallery.createGallery', 'Create gallery')}
          </DialogTitle>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <FmCommonTextField
            label={t('venueGallery.galleryName', 'Name')}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={t('venueGallery.galleryNamePlaceholder', 'Event Photos')}
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter' && name.trim()) {
                handleCreate();
              }
            }}
          />
        </div>
        <DialogFooter>
          <FmCommonButton
            variant='secondary'
            onClick={() => handleOpenChange(false)}
            disabled={isCreating}
          >
            {t('buttons.cancel', 'Cancel')}
          </FmCommonButton>
          <FmCommonButton
            variant='gold'
            onClick={handleCreate}
            disabled={!name.trim() || isCreating}
          >
            {isCreating ? (
              <>
                <FmCommonLoadingSpinner size='sm' className='mr-2' />
                {t('venueGallery.creating', 'Creating...')}
              </>
            ) : (
              t('buttons.create', 'Create')
            )}
          </FmCommonButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

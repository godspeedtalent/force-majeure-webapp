/**
 * EditMediaDialog
 *
 * Dialog for editing media item metadata (title, alt text, creator, year, description).
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/common/shadcn/dialog';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import type { ResolvedMediaItem } from '@/features/media/types';

interface EditMediaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ResolvedMediaItem | null;
  onSave: (data: {
    alt_text: string | null;
    title: string | null;
    description: string | null;
    creator: string | null;
    year: number | null;
  }) => Promise<void>;
}

export const EditMediaDialog = ({
  open,
  onOpenChange,
  item,
  onSave,
}: EditMediaDialogProps) => {
  const { t } = useTranslation('common');
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    alt_text: '',
    title: '',
    description: '',
    creator: '',
    year: '',
  });

  // Reset form when item changes
  useEffect(() => {
    if (item) {
      setForm({
        alt_text: item.alt_text || '',
        title: item.title || '',
        description: item.description || '',
        creator: item.creator || '',
        year: item.year?.toString() || '',
      });
    }
  }, [item]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        alt_text: form.alt_text || null,
        title: form.title || null,
        description: form.description || null,
        creator: form.creator || null,
        year: form.year ? parseInt(form.year) : null,
      });
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] flex flex-col'>
        <DialogHeader>
          <DialogTitle>{t('venueGallery.editMedia', 'Edit media')}</DialogTitle>
        </DialogHeader>
        <div className='space-y-4 py-4 overflow-y-auto flex-1'>
          {/* Image preview */}
          {item && item.media_type === 'image' && (
            <div className='aspect-video bg-black/40 overflow-hidden mb-4'>
              <img
                src={item.url}
                alt={item.alt_text || ''}
                className='w-full h-full object-contain'
              />
            </div>
          )}

          <FmCommonTextField
            label={t('venueGallery.title', 'Title')}
            value={form.title}
            onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
            placeholder={t('venueGallery.titlePlaceholder', 'Photo title')}
          />
          <FmCommonTextField
            label={t('venueGallery.altText', 'Alt text')}
            value={form.alt_text}
            onChange={e => setForm(prev => ({ ...prev, alt_text: e.target.value }))}
            placeholder={t('venueGallery.altTextPlaceholder', 'Description for accessibility')}
          />
          <FmCommonTextField
            label={t('venueGallery.creator', 'Creator')}
            value={form.creator}
            onChange={e => setForm(prev => ({ ...prev, creator: e.target.value }))}
            placeholder={t('venueGallery.creatorPlaceholder', 'Photographer or creator name')}
          />
          <FmCommonTextField
            label={t('venueGallery.year', 'Year')}
            value={form.year}
            onChange={e => setForm(prev => ({ ...prev, year: e.target.value }))}
            placeholder='2024'
            type='number'
          />
          <FmCommonTextField
            label={t('venueGallery.description', 'Description')}
            value={form.description}
            onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder={t('venueGallery.descriptionPlaceholder', 'Additional details')}
          />
        </div>
        <DialogFooter>
          <FmCommonButton variant='secondary' onClick={() => onOpenChange(false)} disabled={isSaving}>
            {t('buttons.cancel', 'Cancel')}
          </FmCommonButton>
          <FmCommonButton variant='gold' onClick={handleSave} disabled={isSaving}>
            {t('buttons.save', 'Save')}
          </FmCommonButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/common/shadcn/dialog';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { cn, GLASS_STYLES } from '@/shared';

export interface AddressData {
  line1: string | null;
  line2: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country?: string | null;
}

interface FmAddressEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address: AddressData;
  onSave: (address: AddressData) => void;
  title?: string;
  description?: string;
  loading?: boolean;
}

/**
 * Modal for editing address fields in data grids.
 * Provides a form with all standard address fields.
 */
export function FmAddressEditModal({
  open,
  onOpenChange,
  address,
  onSave,
  title,
  description,
  loading = false,
}: FmAddressEditModalProps) {
  const { t } = useTranslation('common');
  const [formData, setFormData] = React.useState<AddressData>(address);

  // Reset form when modal opens with new address
  React.useEffect(() => {
    if (open) {
      setFormData(address);
    }
  }, [open, address]);

  const handleChange = (field: keyof AddressData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value || null,
    }));
  };

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          GLASS_STYLES.PANEL,
          'text-white max-w-md pointer-events-auto'
        )}
      >
        <DialogHeader>
          <DialogTitle className='font-canela text-2xl text-white'>
            {title || t('addressEdit.title')}
          </DialogTitle>
          {description && (
            <DialogDescription className='text-white/70'>
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className='mt-4 space-y-4 pointer-events-auto'>
          <FmCommonTextField
            label={t('addressEdit.addressLine1')}
            value={formData.line1 || ''}
            onChange={e => handleChange('line1', e.target.value)}
            placeholder={t('addressEdit.addressLine1Placeholder')}
          />

          <FmCommonTextField
            label={t('addressEdit.addressLine2')}
            value={formData.line2 || ''}
            onChange={e => handleChange('line2', e.target.value)}
            placeholder={t('addressEdit.addressLine2Placeholder')}
          />

          <div className='grid grid-cols-2 gap-4'>
            <FmCommonTextField
              label={t('addressEdit.city')}
              value={formData.city || ''}
              onChange={e => handleChange('city', e.target.value)}
              placeholder={t('addressEdit.cityPlaceholder')}
            />
            <FmCommonTextField
              label={t('addressEdit.state')}
              value={formData.state || ''}
              onChange={e => handleChange('state', e.target.value)}
              placeholder={t('addressEdit.statePlaceholder')}
              maxLength={2}
            />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <FmCommonTextField
              label={t('addressEdit.zipCode')}
              value={formData.zipCode || ''}
              onChange={e => handleChange('zipCode', e.target.value)}
              placeholder={t('addressEdit.zipCodePlaceholder')}
            />
            <FmCommonTextField
              label={t('addressEdit.country')}
              value={formData.country || 'US'}
              onChange={e => handleChange('country', e.target.value)}
              placeholder={t('addressEdit.countryPlaceholder')}
              maxLength={2}
            />
          </div>
        </div>

        <DialogFooter className='mt-6 flex gap-3'>
          <FmCommonButton
            variant='default'
            onClick={handleCancel}
            disabled={loading}
          >
            {t('buttons.cancel')}
          </FmCommonButton>
          <FmCommonButton
            variant='gold'
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? t('buttons.saving') : t('buttons.save')}
          </FmCommonButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

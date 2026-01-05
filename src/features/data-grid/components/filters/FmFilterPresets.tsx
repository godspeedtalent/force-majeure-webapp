import { useTranslation } from 'react-i18next';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonIconButton } from '@/components/common/buttons/FmCommonIconButton';
import { X } from 'lucide-react';
import { FilterPreset } from '../FmAdvancedFilterDialog';

export interface FmFilterPresetsProps {
  presets: FilterPreset[];
  onLoadPreset: (preset: FilterPreset) => void;
  onDeletePreset: (presetId: string) => void;
}

export function FmFilterPresets({
  presets,
  onLoadPreset,
  onDeletePreset,
}: FmFilterPresetsProps) {
  const { t } = useTranslation('common');

  if (presets.length === 0) {
    return null;
  }

  return (
    <div className='space-y-2 pt-4 border-t'>
      <div className='text-sm font-medium'>{t('dataGrid.savedFilters')}</div>
      <div className='flex flex-wrap gap-2'>
        {presets.map(preset => (
          <div
            key={preset.id}
            className='flex items-center gap-1 bg-muted/30 rounded-none'
          >
            <FmCommonButton
              variant='secondary'
              size='sm'
              onClick={() => onLoadPreset(preset)}
              className='h-8 rounded-r-none'
            >
              {preset.name}
            </FmCommonButton>
            <FmCommonIconButton
              icon={X}
              variant='destructive'
              size='sm'
              onClick={() => onDeletePreset(preset.id)}
              className='h-8 w-8 rounded-l-none'
              tooltip={t('buttons.delete')}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { Save } from 'lucide-react';

export interface FmFilterPresetSaveProps {
  onSave: (name: string) => void;
  disabled?: boolean;
}

export function FmFilterPresetSave({ onSave, disabled = false }: FmFilterPresetSaveProps) {
  const { t } = useTranslation('common');
  const [presetName, setPresetName] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleSave = () => {
    if (presetName.trim()) {
      onSave(presetName.trim());
      setPresetName('');
      setShowInput(false);
    }
  };

  if (showInput) {
    return (
      <div className='flex gap-2'>
        <FmCommonTextField
          placeholder={t('dataGrid.presetNamePlaceholder')}
          value={presetName}
          onChange={e => setPresetName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') setShowInput(false);
          }}
          autoFocus
          containerClassName='flex-1'
        />
        <FmCommonButton onClick={handleSave} size='sm' icon={Save}>
          {t('buttons.save')}
        </FmCommonButton>
        <FmCommonButton variant='secondary' onClick={() => setShowInput(false)} size='sm'>
          {t('buttons.cancel')}
        </FmCommonButton>
      </div>
    );
  }

  return (
    <FmCommonButton
      variant='default'
      size='sm'
      onClick={() => setShowInput(true)}
      className='w-full'
      disabled={disabled}
      icon={Save}
    >
      {t('dataGrid.saveAsPreset')}
    </FmCommonButton>
  );
}

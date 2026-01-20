/**
 * SpacingEditor Component
 *
 * Allows editing spacing values in template configurations.
 */

import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import type { TemplateSpacingConfig } from '../../types';

interface SpacingEditorProps {
  spacing: TemplateSpacingConfig;
  onChange: (spacing: Partial<TemplateSpacingConfig>) => void;
  unit?: 'px' | 'mm';
}

export const SpacingEditor = ({
  spacing,
  onChange,
  unit = 'px',
}: SpacingEditorProps) => {
  const fields: { key: keyof TemplateSpacingConfig; label: string }[] = [
    { key: 'margin', label: 'Margin' },
    { key: 'padding', label: 'Padding' },
    { key: 'sectionGap', label: 'Section Gap' },
  ];

  return (
    <div className='space-y-[10px]'>
      {fields.map(({ key, label }) => (
        <div key={key} className='flex items-center gap-[10px]'>
          <FmCommonTextField
            label={`${label} (${unit})`}
            type='number'
            value={spacing[key].toString()}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange({ [key]: parseInt(e.target.value, 10) || 0 })
            }
            min={0}
            max={100}
            className='flex-1'
          />
          <input
            type='range'
            min='0'
            max={unit === 'mm' ? '50' : '100'}
            value={spacing[key]}
            onChange={e =>
              onChange({ [key]: parseInt(e.target.value, 10) })
            }
            className='w-32 accent-fm-gold'
          />
        </div>
      ))}
    </div>
  );
};

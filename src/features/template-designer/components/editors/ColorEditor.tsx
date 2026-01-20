/**
 * ColorEditor Component
 *
 * Allows editing color values in template configurations.
 */

import { useCallback } from 'react';
import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import type { TemplateColorConfig } from '../../types';

interface ColorEditorProps {
  colors: TemplateColorConfig;
  onChange: (colors: Partial<TemplateColorConfig>) => void;
}

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const ColorField = ({ label, value, onChange }: ColorFieldProps) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  return (
    <div className='flex items-center gap-[10px]'>
      <input
        type='color'
        value={value}
        onChange={handleChange}
        className='h-8 w-8 cursor-pointer rounded-none border border-white/20 bg-transparent p-0'
      />
      <FmCommonTextField
        label={label}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        containerClassName='flex-1'
        className='font-mono text-xs'
      />
    </div>
  );
};

export const ColorEditor = ({ colors, onChange }: ColorEditorProps) => {
  const colorFields: { key: keyof TemplateColorConfig; label: string }[] = [
    { key: 'primary', label: 'Primary (Accent)' },
    { key: 'secondary', label: 'Secondary (Background)' },
    { key: 'text', label: 'Text' },
    { key: 'mutedText', label: 'Muted Text' },
    { key: 'border', label: 'Border' },
    { key: 'success', label: 'Success' },
  ];

  return (
    <div className='space-y-[10px]'>
      {colorFields.map(({ key, label }) => (
        <ColorField
          key={key}
          label={label}
          value={colors[key]}
          onChange={value => onChange({ [key]: value })}
        />
      ))}
    </div>
  );
};

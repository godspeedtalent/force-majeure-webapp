/**
 * TypographyEditor Component
 *
 * Allows editing typography (font sizes) in template configurations.
 */

import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import type { TemplateTypographyConfig } from '../../types';

interface TypographyEditorProps {
  typography: TemplateTypographyConfig;
  onChange: (typography: Partial<TemplateTypographyConfig>) => void;
  unit?: 'px' | 'pt';
}

export const TypographyEditor = ({
  typography,
  onChange,
  unit = 'px',
}: TypographyEditorProps) => {
  const fields: { key: keyof TemplateTypographyConfig; label: string }[] = [
    { key: 'headerSize', label: 'Header' },
    { key: 'titleSize', label: 'Title' },
    { key: 'bodySize', label: 'Body' },
    { key: 'labelSize', label: 'Label' },
    { key: 'footerSize', label: 'Footer' },
  ];

  return (
    <div className='space-y-[10px]'>
      {fields.map(({ key, label }) => (
        <div key={key} className='flex items-center gap-[10px]'>
          <FmCommonTextField
            label={`${label} (${unit})`}
            type='number'
            value={typography[key].toString()}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange({ [key]: parseInt(e.target.value, 10) || 0 })
            }
            min={1}
            max={100}
            className='flex-1'
          />
          <div className='flex items-center gap-[5px]'>
            <input
              type='range'
              min='6'
              max='48'
              value={typography[key]}
              onChange={e =>
                onChange({ [key]: parseInt(e.target.value, 10) })
              }
              className='w-24 accent-fm-gold'
            />
            <span
              className='w-12 text-right text-muted-foreground'
              style={{ fontSize: `${Math.min(typography[key], 24)}px` }}
            >
              Aa
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

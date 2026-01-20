/**
 * PDFSettingsEditor Component
 *
 * Allows editing PDF-specific settings like format, orientation, and QR size.
 */

import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import type { PDFTemplateConfig } from '../../types';

interface PDFSettingsEditorProps {
  config: PDFTemplateConfig;
  onChange: (updates: Partial<PDFTemplateConfig>) => void;
}

export const PDFSettingsEditor = ({
  config,
  onChange,
}: PDFSettingsEditorProps) => {
  return (
    <div className='space-y-[10px]'>
      {/* Format */}
      <div className='space-y-[5px]'>
        <label className='text-xs uppercase text-muted-foreground'>
          Page Format
        </label>
        <div className='flex gap-[10px]'>
          <button
            type='button'
            onClick={() => onChange({ format: 'Letter' })}
            className={`flex-1 rounded-none border p-[10px] text-sm transition-colors ${
              config.format === 'Letter'
                ? 'border-fm-gold bg-fm-gold/20 text-fm-gold'
                : 'border-white/20 hover:border-white/40'
            }`}
          >
            Letter (8.5 x 11)
          </button>
          <button
            type='button'
            onClick={() => onChange({ format: 'A4' })}
            className={`flex-1 rounded-none border p-[10px] text-sm transition-colors ${
              config.format === 'A4'
                ? 'border-fm-gold bg-fm-gold/20 text-fm-gold'
                : 'border-white/20 hover:border-white/40'
            }`}
          >
            A4 (210 x 297mm)
          </button>
        </div>
      </div>

      {/* Orientation */}
      <div className='space-y-[5px]'>
        <label className='text-xs uppercase text-muted-foreground'>
          Orientation
        </label>
        <div className='flex gap-[10px]'>
          <button
            type='button'
            onClick={() => onChange({ orientation: 'portrait' })}
            className={`flex-1 rounded-none border p-[10px] text-sm transition-colors ${
              config.orientation === 'portrait'
                ? 'border-fm-gold bg-fm-gold/20 text-fm-gold'
                : 'border-white/20 hover:border-white/40'
            }`}
          >
            Portrait
          </button>
          <button
            type='button'
            onClick={() => onChange({ orientation: 'landscape' })}
            className={`flex-1 rounded-none border p-[10px] text-sm transition-colors ${
              config.orientation === 'landscape'
                ? 'border-fm-gold bg-fm-gold/20 text-fm-gold'
                : 'border-white/20 hover:border-white/40'
            }`}
          >
            Landscape
          </button>
        </div>
      </div>

      {/* QR Code Size */}
      <div className='flex items-center gap-[10px]'>
        <FmCommonTextField
          label='QR Code Size (mm)'
          type='number'
          value={config.qrSize.toString()}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onChange({ qrSize: parseInt(e.target.value, 10) || 60 })
          }
          min={30}
          max={100}
          className='flex-1'
        />
        <input
          type='range'
          min='30'
          max='100'
          value={config.qrSize}
          onChange={e =>
            onChange({ qrSize: parseInt(e.target.value, 10) })
          }
          className='w-32 accent-fm-gold'
        />
      </div>
    </div>
  );
};

/**
 * ContentEditor Component
 *
 * Allows editing text content in template configurations.
 */

import { FmCommonTextField } from '@/components/common/forms/FmCommonTextField';
import type { EmailContentConfig, PDFContentConfig } from '../../types';

interface ContentEditorProps<T extends EmailContentConfig | PDFContentConfig> {
  content: T;
  onChange: (content: Partial<T>) => void;
  fields: { key: keyof T; label: string; multiline?: boolean }[];
}

export function ContentEditor<T extends EmailContentConfig | PDFContentConfig>({
  content,
  onChange,
  fields,
}: ContentEditorProps<T>) {
  return (
    <div className='space-y-[10px]'>
      {fields.map(({ key, label, multiline }) => (
        <div key={String(key)}>
          {multiline ? (
            <div className='space-y-[5px]'>
              <label className='text-xs uppercase text-muted-foreground'>
                {label}
              </label>
              <textarea
                value={String(content[key])}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  onChange({ [key]: e.target.value } as Partial<T>)
                }
                rows={3}
                className='w-full rounded-none border border-white/20 bg-transparent p-[10px] text-sm focus:border-fm-gold focus:outline-none'
              />
              <span className='text-xs text-muted-foreground'>
                {String(content[key]).length} characters
              </span>
            </div>
          ) : (
            <FmCommonTextField
              label={label}
              value={String(content[key])}
              onChange={e =>
                onChange({ [key]: e.target.value } as Partial<T>)
              }
            />
          )}
        </div>
      ))}
    </div>
  );
}

// Pre-configured for email content
export const EmailContentEditor = ({
  content,
  onChange,
}: {
  content: EmailContentConfig;
  onChange: (content: Partial<EmailContentConfig>) => void;
}) => {
  const fields: {
    key: keyof EmailContentConfig;
    label: string;
    multiline?: boolean;
  }[] = [
    { key: 'headerTitle', label: 'Header Title' },
    { key: 'headerSubtitle', label: 'Header Subtitle' },
    { key: 'successMessage', label: 'Success Message' },
    { key: 'successSubtext', label: 'Success Subtext', multiline: true },
    { key: 'ticketNotice', label: 'Ticket Notice', multiline: true },
    { key: 'ctaPrimaryText', label: 'Primary Button Text' },
    { key: 'ctaSecondaryText', label: 'Secondary Button Text' },
    { key: 'footerContact', label: 'Footer Contact' },
    { key: 'footerCopyright', label: 'Footer Copyright' },
  ];

  return (
    <ContentEditor content={content} onChange={onChange} fields={fields} />
  );
};

// Pre-configured for PDF content
export const PDFContentEditor = ({
  content,
  onChange,
}: {
  content: PDFContentConfig;
  onChange: (content: Partial<PDFContentConfig>) => void;
}) => {
  const fields: {
    key: keyof PDFContentConfig;
    label: string;
    multiline?: boolean;
  }[] = [
    { key: 'headerTitle', label: 'Header Title' },
    { key: 'headerSubtitle', label: 'Header Subtitle' },
    { key: 'qrInstruction', label: 'QR Code Instruction' },
    { key: 'footerDisclaimer', label: 'Footer Disclaimer', multiline: true },
    { key: 'footerTicketId', label: 'Ticket ID Label' },
  ];

  return (
    <ContentEditor content={content} onChange={onChange} fields={fields} />
  );
};

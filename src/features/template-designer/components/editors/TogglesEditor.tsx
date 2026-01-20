/**
 * TogglesEditor Component
 *
 * Allows toggling visibility of template sections.
 */

import { FmCommonCheckbox } from '@/components/common/forms/FmCommonCheckbox';
import type { EmailTogglesConfig, PDFTogglesConfig } from '../../types';

interface TogglesEditorProps<T extends EmailTogglesConfig | PDFTogglesConfig> {
  toggles: T;
  onChange: (toggles: Partial<T>) => void;
  fields: { key: keyof T; label: string }[];
}

export function TogglesEditor<T extends EmailTogglesConfig | PDFTogglesConfig>({
  toggles,
  onChange,
  fields,
}: TogglesEditorProps<T>) {
  return (
    <div className='space-y-[10px]'>
      {fields.map(({ key, label }) => (
        <label
          key={String(key)}
          className='flex cursor-pointer items-center gap-[10px]'
        >
          <FmCommonCheckbox
            checked={Boolean(toggles[key])}
            onCheckedChange={(checked: boolean) =>
              onChange({ [key]: checked } as unknown as Partial<T>)
            }
          />
          <span className='text-sm'>{label}</span>
        </label>
      ))}
    </div>
  );
}

// Pre-configured for email toggles
export const EmailTogglesEditor = ({
  toggles,
  onChange,
}: {
  toggles: EmailTogglesConfig;
  onChange: (toggles: Partial<EmailTogglesConfig>) => void;
}) => {
  const fields: { key: keyof EmailTogglesConfig; label: string }[] = [
    { key: 'showHeroImage', label: 'Show Hero Image' },
    { key: 'showSuccessIcon', label: 'Show Success Icon' },
    { key: 'showPurchaserInfo', label: 'Show Purchaser Info' },
    { key: 'showOrderBreakdown', label: 'Show Order Breakdown' },
    { key: 'showTicketProtection', label: 'Show Ticket Protection' },
    { key: 'showServiceFee', label: 'Show Service Fee' },
    { key: 'showProcessingFee', label: 'Show Processing Fee' },
    { key: 'showCtaButtons', label: 'Show CTA Buttons' },
    { key: 'showFooter', label: 'Show Footer' },
  ];

  return (
    <TogglesEditor toggles={toggles} onChange={onChange} fields={fields} />
  );
};

// Pre-configured for PDF toggles
export const PDFTogglesEditor = ({
  toggles,
  onChange,
}: {
  toggles: PDFTogglesConfig;
  onChange: (toggles: Partial<PDFTogglesConfig>) => void;
}) => {
  const fields: { key: keyof PDFTogglesConfig; label: string }[] = [
    { key: 'showSubtitle', label: 'Show Subtitle' },
    { key: 'showVenueAddress', label: 'Show Venue Address' },
    { key: 'showAttendeeName', label: 'Show Attendee Name' },
    { key: 'showPurchaserName', label: 'Show Purchaser Name' },
    { key: 'showFooterDisclaimer', label: 'Show Footer Disclaimer' },
  ];

  return (
    <TogglesEditor toggles={toggles} onChange={onChange} fields={fields} />
  );
};

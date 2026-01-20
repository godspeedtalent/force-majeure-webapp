/**
 * EmailPreview Component
 *
 * Renders a live preview of email templates with the current configuration.
 */

import { useMemo } from 'react';
import { generateOrderReceiptEmailHTML } from '@/services/email/templates/OrderReceiptEmail';
import type { OrderReceiptEmailData } from '@/types/email';
import type { EmailTemplateConfig } from '../../types';

interface EmailPreviewProps {
  config: EmailTemplateConfig;
}

// Mock data for preview
const MOCK_EMAIL_DATA: OrderReceiptEmailData = {
  orderId: 'ORD-2024-001234',
  orderDate: new Date().toISOString(),
  event: {
    title: 'Midnight Resonance: A Force Majeure Experience',
    date: '2024-03-15',
    time: '22:00',
    venue: {
      name: 'The Warehouse',
      address: '123 Industrial Ave',
      city: 'Los Angeles, CA 90012',
    },
    imageUrl:
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=300&fit=crop',
  },
  purchaser: {
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
  },
  orderSummary: {
    items: [
      {
        ticketTierName: 'General Admission',
        quantity: 2,
        unitPrice: 75.0,
        subtotal: 150.0,
      },
      {
        ticketTierName: 'VIP Experience',
        quantity: 1,
        unitPrice: 150.0,
        subtotal: 150.0,
      },
    ],
    subtotal: 300.0,
    serviceFee: 15.0,
    processingFee: 8.7,
    ticketProtection: 12.0,
    tax: 26.86,
    total: 362.56,
    currency: 'USD',
  },
  pdfTicketAttachment: 'attached',
};

export const EmailPreview = ({ config }: EmailPreviewProps) => {
  const previewHtml = useMemo(() => {
    // Generate the email HTML with the current config
    // Note: The template will need to be updated to accept config
    // For now, we generate with default values
    return generateOrderReceiptEmailHTML(MOCK_EMAIL_DATA, config);
  }, [config]);

  return (
    <div className='h-full overflow-auto rounded-none border border-white/20 bg-white'>
      <iframe
        srcDoc={previewHtml}
        title='Email Preview'
        className='h-full min-h-[600px] w-full border-none'
        sandbox='allow-same-origin'
      />
    </div>
  );
};

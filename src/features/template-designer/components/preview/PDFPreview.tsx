/**
 * PDFPreview Component
 *
 * Renders a live preview of PDF templates with the current configuration.
 */

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonLoadingSpinner } from '@/components/common/feedback/FmCommonLoadingSpinner';
import { TicketPDFGenerator } from '@/services/pdf/TicketPDFGenerator';
import type { TicketPDFData } from '@/services/pdf/TicketPDFGenerator';
import type { PDFTemplateConfig } from '../../types';

interface PDFPreviewProps {
  config: PDFTemplateConfig;
}

// Mock data for preview
const MOCK_TICKET_DATA: TicketPDFData = {
  ticketId: 'TKT-2024-001234',
  qrCodeData: 'FM:TKT-2024-001234:HMAC_SIGNATURE_HERE',
  eventName: 'Midnight Resonance: A Force Majeure Experience',
  eventDate: 'Friday, March 15, 2024',
  eventTime: '10:00 PM',
  venueName: 'The Warehouse',
  venueAddress: '123 Industrial Ave, Los Angeles, CA 90012',
  ticketTierName: 'VIP Experience',
  attendeeName: 'John Doe',
  attendeeEmail: 'john.doe@example.com',
  orderNumber: 'ORD-2024-001234',
  purchaserName: 'John Doe',
  // Sample event image from Unsplash (electronic music/concert)
  eventImageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80',
};

export const PDFPreview = ({ config }: PDFPreviewProps) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePreview = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Generate PDF with config
      const pdfBase64 = await TicketPDFGenerator.generateSingleTicket(
        MOCK_TICKET_DATA,
        {
          format: config.format,
          orientation: config.orientation,
        },
        config
      );

      // Create blob URL for display
      const pdfBlob = base64ToBlob(pdfBase64, 'application/pdf');
      const url = URL.createObjectURL(pdfBlob);

      // Clean up previous URL
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }

      setPdfUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  }, [config, pdfUrl]);

  // Generate preview on config change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      generatePreview();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [config]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clean up URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className='flex h-full flex-col'>
      <div className='flex items-center justify-between border-b border-white/20 p-[10px]'>
        <span className='text-sm text-muted-foreground'>
          {config.format} - {config.orientation}
        </span>
        <FmCommonButton
          variant='secondary'
          size='sm'
          onClick={generatePreview}
          disabled={isGenerating}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`}
          />
          Refresh
        </FmCommonButton>
      </div>

      <div className='flex-1 overflow-auto bg-neutral-800 p-[20px]'>
        {isGenerating && !pdfUrl ? (
          <div className='flex h-full items-center justify-center'>
            <FmCommonLoadingSpinner size='lg' />
          </div>
        ) : error ? (
          <div className='flex h-full flex-col items-center justify-center gap-[10px] text-center'>
            <p className='text-fm-danger'>{error}</p>
            <FmCommonButton variant='secondary' onClick={generatePreview}>
              Retry
            </FmCommonButton>
          </div>
        ) : pdfUrl ? (
          <iframe
            src={pdfUrl}
            title='PDF Preview'
            className='h-full min-h-[600px] w-full rounded-none border border-white/20 bg-white'
          />
        ) : (
          <div className='flex h-full items-center justify-center'>
            <p className='text-muted-foreground'>Generating preview...</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to convert base64 to Blob
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

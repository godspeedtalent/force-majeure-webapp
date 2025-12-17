import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/common/shadcn/card';
import { Button } from '@/components/common/shadcn/button';
import { Input } from '@/components/common/shadcn/input';
import { Label } from '@/components/common/shadcn/label';
import { Separator } from '@/components/common/shadcn/separator';
import { Mail, Copy, Send, Eye } from 'lucide-react';
import { OrderReceiptEmailData } from '@/types/email';
import { generateOrderReceiptEmailHTML } from '@/services/email/templates/OrderReceiptEmail';
import { useSendTestEmail } from '@/shared/hooks/useEmailReceipt';
import { toast } from 'sonner';
import { formatHeader } from '@force-majeure/shared';

/**
 * EmailPreview - Developer tool for previewing and testing email templates
 *
 * Features:
 * - Live preview of email template
 * - Copy HTML to clipboard
 * - Send test email to specified address
 * - Configurable test data
 */

export const EmailPreview = () => {
  const { t } = useTranslation('common');
  const { sendTestEmail, isSending } = useSendTestEmail();
  const [testEmail, setTestEmail] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Sample data for preview
  const sampleData: OrderReceiptEmailData = {
    orderId: 'ORD-' + Date.now(),
    orderDate: new Date().toISOString(),
    event: {
      title: 'Nina Kraviz - Warehouse Sessions',
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
      time: '22:00',
      venue: {
        name: 'The Warehouse',
        address: '1234 Industrial Blvd',
        city: 'Brooklyn, NY 11201',
      },
      imageUrl:
        'https://placehold.co/600x400/DAA520/000000/png?text=Nina+Kraviz',
    },
    purchaser: {
      fullName: 'Alex Johnson',
      email: testEmail || 'alex.johnson@example.com',
      phone: '+1 (555) 123-4567',
    },
    orderSummary: {
      items: [
        {
          ticketTierName: 'General Admission',
          quantity: 2,
          unitPrice: 65.0,
          subtotal: 130.0,
        },
        {
          ticketTierName: 'VIP Early Entry',
          quantity: 1,
          unitPrice: 125.0,
          subtotal: 125.0,
        },
      ],
      subtotal: 255.0,
      serviceFee: 15.3,
      processingFee: 8.5,
      ticketProtection: 12.0,
      tax: 25.62,
      total: 316.42,
      currency: 'USD',
    },
  };

  const handleCopyHTML = () => {
    const html = generateOrderReceiptEmailHTML(sampleData);
    navigator.clipboard.writeText(html);
    toast.success(t('emailPreview.htmlCopied'));
  };

  const handleSendTest = async () => {
    if (!testEmail) {
      toast.error(t('emailPreview.enterEmailAddress'));
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      toast.error(t('emailPreview.invalidEmail'));
      return;
    }

    await sendTestEmail(testEmail);
  };

  const htmlContent = generateOrderReceiptEmailHTML(sampleData);

  return (
    <div className='space-y-6'>
      {/* Controls */}
      <Card className='p-[20px]'>
        <div className='flex items-center gap-[10px] mb-[20px]'>
          <Mail className='h-5 w-5 text-fm-gold' />
          <h3 className='text-lg font-canela'>
            {formatHeader(t('emailPreview.title'))}
          </h3>
        </div>

        <div className='space-y-4'>
          <div>
            <Label htmlFor='test-email' className='text-xs uppercase'>
              {t('emailPreview.testEmailAddress')}
            </Label>
            <div className='flex gap-[10px] mt-2'>
              <Input
                id='test-email'
                type='email'
                placeholder={t('placeholders.email')}
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                className='flex-1'
              />
              <Button
                onClick={handleSendTest}
                disabled={isSending || !testEmail}
                className='bg-fm-gold hover:bg-fm-gold/90 text-black'
              >
                <Send className='h-4 w-4 mr-2' />
                {isSending ? t('emailPreview.sending') : t('emailPreview.sendTest')}
              </Button>
            </div>
            <p className='text-xs text-muted-foreground mt-2'>
              {t('emailPreview.sendTestHint')}
            </p>
          </div>

          <Separator />

          <div className='flex gap-[10px]'>
            <Button
              onClick={() => setShowPreview(!showPreview)}
              variant='outline'
              className='flex-1'
            >
              <Eye className='h-4 w-4 mr-2' />
              {showPreview ? t('emailPreview.hidePreview') : t('emailPreview.showPreview')}
            </Button>
            <Button
              onClick={handleCopyHTML}
              variant='outline'
              className='flex-1'
            >
              <Copy className='h-4 w-4 mr-2' />
              {t('emailPreview.copyHtml')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Preview */}
      {showPreview && (
        <Card className='p-[20px]'>
          <h4 className='text-md font-canela mb-[20px]'>
            {formatHeader(t('emailPreview.previewTitle'))}
          </h4>
          <div className='border border-border rounded-none overflow-hidden bg-white'>
            <iframe
              title={t('emailPreview.previewTitle')}
              srcDoc={htmlContent}
              style={{
                width: '100%',
                height: '800px',
                border: 'none',
              }}
            />
          </div>
          <p className='text-xs text-muted-foreground mt-4'>
            {t('emailPreview.previewNote')}
          </p>
        </Card>
      )}

      {/* Sample Data Display */}
      <Card className='p-[20px]'>
        <h4 className='text-md font-canela mb-[20px]'>
          {formatHeader(t('emailPreview.sampleData'))}
        </h4>
        <div className='bg-muted/50 rounded-none p-[20px] font-mono text-xs overflow-auto max-h-96'>
          <pre>{JSON.stringify(sampleData, null, 2)}</pre>
        </div>
        <p className='text-xs text-muted-foreground mt-4'>
          {t('emailPreview.sampleDataNote')}
        </p>
      </Card>

      {/* Implementation Notes */}
      <Card className='p-[20px] bg-muted/20 border-fm-gold/30'>
        <h4 className='text-md font-canela mb-[20px]'>
          {formatHeader(t('emailPreview.implementationNotes'))}
        </h4>
        <div className='space-y-2 text-sm'>
          <p>
            <strong>{t('emailPreview.emailServiceSetup')}</strong> {t('emailPreview.emailServiceSetupDescription')}
          </p>
          <ol className='list-decimal list-inside space-y-1 ml-4 text-muted-foreground'>
            <li>
              {t('emailPreview.step1EdgeFunction')}{' '}
              <code className='text-xs bg-muted px-1 py-0.5 rounded'>
                send-email
              </code>
            </li>
            <li>
              {t('emailPreview.step2Provider')}
            </li>
            <li>{t('emailPreview.step3Credentials')}</li>
            <li>{t('emailPreview.step4Deploy')}</li>
          </ol>

          <Separator className='my-4' />

          <p>
            <strong>{t('emailPreview.pdfTickets')}</strong> {t('emailPreview.pdfTicketsDescription')}
          </p>
          <ol className='list-decimal list-inside space-y-1 ml-4 text-muted-foreground'>
            <li>
              {t('emailPreview.pdfStep1')}
            </li>
            <li>
              {t('emailPreview.pdfStep2')}{' '}
              <code className='text-xs bg-muted px-1 py-0.5 rounded'>
                TicketPDFService
              </code>{' '}
              {t('emailPreview.pdfStep2Methods')}
            </li>
            <li>{t('emailPreview.pdfStep3')}</li>
            <li>{t('emailPreview.pdfStep4')}</li>
          </ol>
        </div>
      </Card>
    </div>
  );
};

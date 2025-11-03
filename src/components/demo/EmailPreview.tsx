import { useState } from 'react';
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
      imageUrl: 'https://placehold.co/600x400/DAA520/000000/png?text=Nina+Kraviz',
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
    toast.success('HTML copied to clipboard');
  };

  const handleSendTest = async () => {
    if (!testEmail) {
      toast.error('Please enter an email address');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(testEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    await sendTestEmail(testEmail);
  };

  const htmlContent = generateOrderReceiptEmailHTML(sampleData);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="h-5 w-5 text-fm-gold" />
          <h3 className="text-lg font-canela">Email Template Preview</h3>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="test-email">Test Email Address</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="test-email"
                type="email"
                placeholder="your.email@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleSendTest}
                disabled={isSending || !testEmail}
                className="bg-fm-gold hover:bg-fm-gold/90 text-black"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSending ? 'Sending...' : 'Send Test'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Send a test email to see how it looks in your inbox
            </p>
          </div>

          <Separator />

          <div className="flex gap-2">
            <Button onClick={() => setShowPreview(!showPreview)} variant="outline" className="flex-1">
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
            <Button onClick={handleCopyHTML} variant="outline" className="flex-1">
              <Copy className="h-4 w-4 mr-2" />
              Copy HTML
            </Button>
          </div>
        </div>
      </Card>

      {/* Preview */}
      {showPreview && (
        <Card className="p-6">
          <h4 className="text-md font-canela mb-4">Email Preview</h4>
          <div className="border border-border rounded-lg overflow-hidden bg-white">
            <iframe
              title="Email Preview"
              srcDoc={htmlContent}
              style={{
                width: '100%',
                height: '800px',
                border: 'none',
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Note: Preview may differ slightly from actual email clients. Always test in real email
            clients before sending to users.
          </p>
        </Card>
      )}

      {/* Sample Data Display */}
      <Card className="p-6">
        <h4 className="text-md font-canela mb-4">Sample Data</h4>
        <div className="bg-muted/50 rounded-lg p-4 font-mono text-xs overflow-auto max-h-96">
          <pre>{JSON.stringify(sampleData, null, 2)}</pre>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          This is the data structure used to generate the email. Modify it in the code to test
          different scenarios.
        </p>
      </Card>

      {/* Implementation Notes */}
      <Card className="p-6 bg-muted/20 border-fm-gold/30">
        <h4 className="text-md font-canela mb-4">Implementation Notes</h4>
        <div className="space-y-2 text-sm">
          <p>
            <strong>Email Service Setup:</strong> To send emails in production, you need to:
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-4 text-muted-foreground">
            <li>Create a Supabase Edge Function named <code className="text-xs bg-muted px-1 py-0.5 rounded">send-email</code></li>
            <li>Configure an email provider (SendGrid, Resend, AWS SES, etc.)</li>
            <li>Add provider credentials to Supabase secrets</li>
            <li>Deploy the edge function</li>
          </ol>

          <Separator className="my-4" />

          <p>
            <strong>PDF Tickets:</strong> PDF generation is currently stubbed. To implement:
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-4 text-muted-foreground">
            <li>Choose a PDF generation approach (client-side, server-side, or third-party)</li>
            <li>Implement the <code className="text-xs bg-muted px-1 py-0.5 rounded">TicketPDFService</code> methods</li>
            <li>Add QR code generation for ticket validation</li>
            <li>Design and implement the PDF ticket template</li>
          </ol>
        </div>
      </Card>
    </div>
  );
};

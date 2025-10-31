# Email Service Documentation

This directory contains the email service implementation for sending order receipts and ticket confirmations.

## Overview

The email system consists of:
- **Type Definitions** (`/src/types/email.ts`) - TypeScript interfaces for email data
- **Email Templates** (`templates/OrderReceiptEmail.tsx`) - HTML email templates
- **Email Service** (`EmailService.ts`) - Service for sending emails via Supabase
- **PDF Service** (`TicketPDFService.ts`) - Stubbed PDF ticket generation (to be implemented)
- **React Hooks** (`/src/shared/hooks/useEmailReceipt.ts`) - Hooks for easy integration

## Features

### Order Receipt Email Template

The `OrderReceiptEmail` template provides a professional, mobile-responsive email with:

- ✅ Event information with hero image
- ✅ Purchaser details
- ✅ Order breakdown (matching checkout page layout)
- ✅ Subtotal, fees, tax, and total
- ✅ PDF ticket attachment support (stubbed)
- ✅ CTA buttons for viewing tickets and browsing events
- ✅ Email client compatibility (tested with inline styles)

### Configuration Options

The email template is fully configurable through the `OrderReceiptEmailData` interface:

```typescript
interface OrderReceiptEmailData {
  orderId: string;
  orderDate: string;
  event: EmailEventInfo;
  purchaser: EmailPurchaserInfo;
  orderSummary: EmailOrderSummary;
  pdfTicketAttachment?: string; // Base64 encoded PDF or URL
}
```

## Usage

### 1. Using the React Hook (Recommended)

```tsx
import { useEmailReceipt } from '@/shared/hooks/useEmailReceipt';

function CheckoutSuccess() {
  const { sendReceipt, isSending } = useEmailReceipt();

  const handleSendReceipt = async () => {
    const emailData: OrderReceiptEmailData = {
      // ... your order data
    };

    const result = await sendReceipt(emailData);
    if (result.success) {
      console.log('Email sent!');
    }
  };

  return (
    <button onClick={handleSendReceipt} disabled={isSending}>
      {isSending ? 'Sending...' : 'Send Receipt'}
    </button>
  );
}
```

### 2. Using the Service Directly

```typescript
import { EmailService } from '@/services/email';

// Send order receipt
const result = await EmailService.sendOrderReceipt(emailData);

// Send test email
const testResult = await EmailService.sendTestEmail('test@example.com');

// Preview email HTML
const html = EmailService.previewOrderReceiptEmail(emailData);

// Convert database order to email format
const emailData = EmailService.convertOrderToEmailData(order, purchaserInfo);
```

### 3. Previewing and Testing

Visit `/demo/email-template` (admin only) to:
- Preview the email template live
- Send test emails to your inbox
- Copy HTML for external testing
- View sample data structure

## Setup Required for Production

### 1. Create Supabase Edge Function

Create a new edge function called `send-email`:

```bash
supabase functions new send-email
```

### 2. Configure Email Provider

Choose an email provider and add to edge function:

**Option A: Resend (Recommended)**
```typescript
import { Resend } from 'resend';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

serve(async (req) => {
  const { to, subject, html, attachments } = await req.json();

  const { data, error } = await resend.emails.send({
    from: 'Force Majeure <noreply@forcemajeure.com>',
    to,
    subject,
    html,
    attachments,
  });

  return new Response(JSON.stringify({ messageId: data?.id }));
});
```

**Option B: SendGrid**
```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(Deno.env.get('SENDGRID_API_KEY')!);

serve(async (req) => {
  const { to, subject, html, attachments } = await req.json();

  const msg = {
    to,
    from: 'noreply@forcemajeure.com',
    subject,
    html,
    attachments,
  };

  const [response] = await sgMail.send(msg);
  return new Response(JSON.stringify({ messageId: response.headers['x-message-id'] }));
});
```

### 3. Add Secrets to Supabase

```bash
# For Resend
supabase secrets set RESEND_API_KEY=your_key_here

# For SendGrid
supabase secrets set SENDGRID_API_KEY=your_key_here
```

### 4. Deploy Edge Function

```bash
supabase functions deploy send-email
```

## PDF Ticket Generation (TODO)

The `TicketPDFService` is currently stubbed. To implement:

### Option 1: Client-Side Generation

**Libraries:** jsPDF, pdfmake

**Pros:**
- No server costs
- Immediate generation
- Full control

**Cons:**
- Increases bundle size
- Limited styling options
- Client-side computation

**Example:**
```typescript
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

static async generateTicketPDF(data: OrderReceiptEmailData): Promise<string> {
  const doc = new jsPDF();

  // Generate QR code
  const qrCodeData = await QRCode.toDataURL(data.orderId);

  // Add content
  doc.text(data.event.title, 20, 20);
  doc.addImage(qrCodeData, 'PNG', 20, 40, 50, 50);

  // Return as base64
  return doc.output('dataurlstring').split(',')[1];
}
```

### Option 2: Server-Side Generation (Recommended)

**Libraries:** Puppeteer, wkhtmltopdf, pdfkit

**Pros:**
- Better styling (can use full HTML/CSS)
- No bundle size impact
- More powerful rendering

**Cons:**
- Requires server resources
- Potential cold starts
- Additional complexity

**Example:**
```typescript
// Create edge function: supabase functions new generate-ticket-pdf

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { launch } from 'https://deno.land/x/puppeteer@16.2.0/mod.ts';

serve(async (req) => {
  const { orderData } = await req.json();

  const browser = await launch();
  const page = await browser.newPage();

  // Generate HTML ticket
  const html = generateTicketHTML(orderData);
  await page.setContent(html);

  // Generate PDF
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
  });

  await browser.close();

  // Return base64
  return new Response(
    JSON.stringify({ pdf: btoa(String.fromCharCode(...pdfBuffer)) })
  );
});
```

### Option 3: Third-Party Service

**Services:** PDFShift, DocRaptor, HTML2PDF.app

**Pros:**
- Reliable
- Maintained by experts
- High quality output

**Cons:**
- Additional cost
- External dependency
- API rate limits

## Email Template Customization

### Colors

The template uses a gold/black color scheme matching the Force Majeure brand:

```typescript
const colors = {
  gold: '#DAA520',
  black: '#000000',
  white: '#FFFFFF',
  lightGray: '#F5F5F5',
  darkGray: '#333333',
  borderGray: '#E0E0E0',
  mutedText: '#6B7280',
};
```

### Layout

The template uses table-based layout for maximum email client compatibility:
- 600px max width
- Responsive padding
- Inline styles only
- No external CSS

### Adding New Sections

To add new sections to the email:

1. Edit `templates/OrderReceiptEmail.tsx`
2. Add data to `OrderReceiptEmailData` interface in `/src/types/email.ts`
3. Update `EmailService.convertOrderToEmailData()` if pulling from database
4. Test in email preview at `/demo/email-template`

## Testing

### Manual Testing

1. Navigate to `/demo/email-template` (admin only)
2. Enter your email address
3. Click "Send Test Email"
4. Check your inbox

### Automated Testing

```typescript
import { generateOrderReceiptEmailHTML } from '@/services/email';

describe('OrderReceiptEmail', () => {
  it('generates valid HTML', () => {
    const html = generateOrderReceiptEmailHTML(sampleData);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain(sampleData.event.title);
  });
});
```

## File Structure

```
src/
├── types/
│   └── email.ts                          # Type definitions
├── services/
│   └── email/
│       ├── README.md                     # This file
│       ├── index.ts                      # Exports
│       ├── EmailService.ts               # Main email service
│       ├── TicketPDFService.ts          # PDF generation (stub)
│       └── templates/
│           └── OrderReceiptEmail.tsx    # HTML email template
├── shared/
│   └── hooks/
│       └── useEmailReceipt.ts           # React hooks
└── components/
    └── demo/
        └── EmailPreview.tsx              # Preview component
```

## Troubleshooting

### Email not sending
1. Check Supabase Edge Function logs
2. Verify email provider credentials
3. Check rate limits
4. Ensure `send-email` function is deployed

### Email looks broken
1. Test in multiple email clients (Gmail, Outlook, Apple Mail)
2. Use inline styles only (no external CSS)
3. Use table-based layout
4. Validate HTML at [HTML Email Check](https://www.htmlemailcheck.com/)

### PDF not attaching
1. Ensure `TicketPDFService` is implemented
2. Check base64 encoding
3. Verify attachment size limits
4. Test PDF generation independently

## Future Enhancements

- [ ] Implement PDF ticket generation
- [ ] Add QR codes for ticket validation
- [ ] Create additional email templates (confirmation, reminder, cancellation)
- [ ] Add email analytics tracking
- [ ] Implement email preview in different clients
- [ ] Add internationalization support
- [ ] Create branded email header/footer component
- [ ] Add calendar invite attachment (.ics file)

## Support

For questions or issues, contact the development team or open an issue in the project repository.

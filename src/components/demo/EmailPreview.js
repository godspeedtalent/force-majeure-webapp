import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/common/shadcn/card';
import { Button } from '@/components/common/shadcn/button';
import { Input } from '@/components/common/shadcn/input';
import { Label } from '@/components/common/shadcn/label';
import { Separator } from '@/components/common/shadcn/separator';
import { Mail, Copy, Send, Eye } from 'lucide-react';
import { generateOrderReceiptEmailHTML } from '@/services/email/templates/OrderReceiptEmail';
import { useSendTestEmail } from '@/shared/hooks/useEmailReceipt';
import { toast } from 'sonner';
import { formatHeader } from '@/shared';
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
    const sampleData = {
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
    return (_jsxs("div", { className: 'space-y-6', children: [_jsxs(Card, { className: 'p-[20px]', children: [_jsxs("div", { className: 'flex items-center gap-[10px] mb-[20px]', children: [_jsx(Mail, { className: 'h-5 w-5 text-fm-gold' }), _jsx("h3", { className: 'text-lg font-canela', children: formatHeader(t('emailPreview.title')) })] }), _jsxs("div", { className: 'space-y-4', children: [_jsxs("div", { children: [_jsx(Label, { htmlFor: 'test-email', className: 'text-xs uppercase', children: t('emailPreview.testEmailAddress') }), _jsxs("div", { className: 'flex gap-[10px] mt-2', children: [_jsx(Input, { id: 'test-email', type: 'email', placeholder: t('placeholders.email'), value: testEmail, onChange: e => setTestEmail(e.target.value), className: 'flex-1' }), _jsxs(Button, { onClick: handleSendTest, disabled: isSending || !testEmail, className: 'bg-fm-gold hover:bg-fm-gold/90 text-black', children: [_jsx(Send, { className: 'h-4 w-4 mr-2' }), isSending ? t('emailPreview.sending') : t('emailPreview.sendTest')] })] }), _jsx("p", { className: 'text-xs text-muted-foreground mt-2', children: t('emailPreview.sendTestHint') })] }), _jsx(Separator, {}), _jsxs("div", { className: 'flex gap-[10px]', children: [_jsxs(Button, { onClick: () => setShowPreview(!showPreview), variant: 'outline', className: 'flex-1', children: [_jsx(Eye, { className: 'h-4 w-4 mr-2' }), showPreview ? t('emailPreview.hidePreview') : t('emailPreview.showPreview')] }), _jsxs(Button, { onClick: handleCopyHTML, variant: 'outline', className: 'flex-1', children: [_jsx(Copy, { className: 'h-4 w-4 mr-2' }), t('emailPreview.copyHtml')] })] })] })] }), showPreview && (_jsxs(Card, { className: 'p-[20px]', children: [_jsx("h4", { className: 'text-md font-canela mb-[20px]', children: formatHeader(t('emailPreview.previewTitle')) }), _jsx("div", { className: 'border border-border rounded-none overflow-hidden bg-white', children: _jsx("iframe", { title: t('emailPreview.previewTitle'), srcDoc: htmlContent, style: {
                                width: '100%',
                                height: '800px',
                                border: 'none',
                            } }) }), _jsx("p", { className: 'text-xs text-muted-foreground mt-4', children: t('emailPreview.previewNote') })] })), _jsxs(Card, { className: 'p-[20px]', children: [_jsx("h4", { className: 'text-md font-canela mb-[20px]', children: formatHeader(t('emailPreview.sampleData')) }), _jsx("div", { className: 'bg-muted/50 rounded-none p-[20px] font-mono text-xs overflow-auto max-h-96', children: _jsx("pre", { children: JSON.stringify(sampleData, null, 2) }) }), _jsx("p", { className: 'text-xs text-muted-foreground mt-4', children: t('emailPreview.sampleDataNote') })] }), _jsxs(Card, { className: 'p-[20px] bg-muted/20 border-fm-gold/30', children: [_jsx("h4", { className: 'text-md font-canela mb-[20px]', children: formatHeader(t('emailPreview.implementationNotes')) }), _jsxs("div", { className: 'space-y-2 text-sm', children: [_jsxs("p", { children: [_jsx("strong", { children: t('emailPreview.emailServiceSetup') }), " ", t('emailPreview.emailServiceSetupDescription')] }), _jsxs("ol", { className: 'list-decimal list-inside space-y-1 ml-4 text-muted-foreground', children: [_jsxs("li", { children: [t('emailPreview.step1EdgeFunction'), ' ', _jsx("code", { className: 'text-xs bg-muted px-1 py-0.5 rounded', children: "send-email" })] }), _jsx("li", { children: t('emailPreview.step2Provider') }), _jsx("li", { children: t('emailPreview.step3Credentials') }), _jsx("li", { children: t('emailPreview.step4Deploy') })] }), _jsx(Separator, { className: 'my-4' }), _jsxs("p", { children: [_jsx("strong", { children: t('emailPreview.pdfTickets') }), " ", t('emailPreview.pdfTicketsDescription')] }), _jsxs("ol", { className: 'list-decimal list-inside space-y-1 ml-4 text-muted-foreground', children: [_jsx("li", { children: t('emailPreview.pdfStep1') }), _jsxs("li", { children: [t('emailPreview.pdfStep2'), ' ', _jsx("code", { className: 'text-xs bg-muted px-1 py-0.5 rounded', children: "TicketPDFService" }), ' ', t('emailPreview.pdfStep2Methods')] }), _jsx("li", { children: t('emailPreview.pdfStep3') }), _jsx("li", { children: t('emailPreview.pdfStep4') })] })] })] })] }));
};

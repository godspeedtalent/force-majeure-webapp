import { Mail } from 'lucide-react';
import { DemoLayout } from '@/components/demo/DemoLayout';
import { EmailPreview } from '@/components/demo/EmailPreview';

/**
 * EmailTemplateDemo - Demo page for email template preview and testing
 *
 * This page allows developers to:
 * - Preview the order receipt email template
 * - Send test emails
 * - View sample data structure
 * - Copy HTML for external testing
 */

export default function EmailTemplateDemo() {
  return (
    <DemoLayout
      title='Email Template Demo'
      description='Preview and test order receipt email templates'
      icon={Mail}
      condensed={false}
    >
      <EmailPreview />
    </DemoLayout>
  );
}

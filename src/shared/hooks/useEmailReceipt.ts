import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { EmailService } from '@/services/email';
import { OrderReceiptEmailData, EmailSendResult } from '@/types/email';
import { toast } from 'sonner';

/**
 * useEmailReceipt - React hook for sending order receipt emails
 *
 * Usage:
 * ```tsx
 * const { sendReceipt, isSending, error } = useEmailReceipt();
 *
 * const handleSendReceipt = async () => {
 *   const result = await sendReceipt(orderData);
 *   if (result.success) {
 *     console.log('Email sent!');
 *   }
 * };
 * ```
 */
export const useEmailReceipt = () => {
  const [lastResult, setLastResult] = useState<EmailSendResult | null>(null);

  const mutation = useMutation({
    mutationFn: async (data: OrderReceiptEmailData) => {
      return EmailService.sendOrderReceipt(data);
    },
    onSuccess: result => {
      setLastResult(result);
      if (result.success) {
        toast.success('Receipt email sent successfully');
      } else {
        toast.error('Failed to send receipt email', {
          description: result.error,
        });
      }
    },
    onError: error => {
      logger.error('Error sending receipt email:', error);
      toast.error('Failed to send receipt email', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  return {
    sendReceipt: mutation.mutateAsync,
    isSending: mutation.isPending,
    error: mutation.error,
    lastResult,
  };
};

/**
 * useSendTestEmail - React hook for sending test emails
 *
 * Useful for development and testing the email template
 */
export const useSendTestEmail = () => {
  const mutation = useMutation({
    mutationFn: async (toEmail: string) => {
      return EmailService.sendTestEmail(toEmail);
    },
    onSuccess: result => {
      if (result.success) {
        toast.success('Test email sent successfully');
      } else {
        toast.error('Failed to send test email', {
          description: result.error,
        });
      }
    },
    onError: error => {
      logger.error('Error sending test email:', error);
      toast.error('Failed to send test email', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });

  return {
    sendTestEmail: mutation.mutateAsync,
    isSending: mutation.isPending,
    error: mutation.error,
  };
};

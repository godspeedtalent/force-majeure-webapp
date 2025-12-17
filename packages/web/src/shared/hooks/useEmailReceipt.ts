import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { EmailService } from '@/services/email';
import { OrderReceiptEmailData, EmailSendResult } from '@/types/email';
import { toast } from 'sonner';
import { logger } from '@force-majeure/shared';

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
  const { t } = useTranslation('common');
  const [lastResult, setLastResult] = useState<EmailSendResult | null>(null);

  const mutation = useMutation({
    mutationFn: async (data: OrderReceiptEmailData) => {
      return EmailService.sendOrderReceipt(data);
    },
    onSuccess: result => {
      setLastResult(result);
      if (result.success) {
        toast.success(t('email.receiptSent'));
      } else {
        toast.error(t('email.receiptFailed'), {
          description: result.error,
        });
      }
    },
    onError: error => {
      logger.error('Error sending receipt email:', { error });
      toast.error(t('email.receiptFailed'), {
        description: error instanceof Error ? error.message : t('errors.unknown'),
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
  const { t } = useTranslation('common');
  const mutation = useMutation({
    mutationFn: async (toEmail: string) => {
      return EmailService.sendTestEmail(toEmail);
    },
    onSuccess: result => {
      if (result.success) {
        toast.success(t('email.testSent'));
      } else {
        toast.error(t('email.testFailed'), {
          description: result.error,
        });
      }
    },
    onError: error => {
      logger.error('Error sending test email:', error);
      toast.error(t('email.testFailed'), {
        description: error instanceof Error ? error.message : t('errors.unknown'),
      });
    },
  });

  return {
    sendTestEmail: mutation.mutateAsync,
    isSending: mutation.isPending,
    error: mutation.error,
  };
};

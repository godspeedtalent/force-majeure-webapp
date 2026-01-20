import { supabase } from '@/shared';
import {
  OrderReceiptEmailData,
  EmailSendResult,
  OrderForEmailConversion,
  OrderItemForEmail,
  OrderEventForEmail,
} from '@/types/email';
import { generateOrderReceiptEmailHTML } from './templates/OrderReceiptEmail';
import {
  generateRsvpConfirmationEmailHTML,
  RsvpConfirmationEmailData,
} from './templates/RsvpConfirmationEmail';
import { logger } from '@/shared';
import { TicketPDFService } from './TicketPDFService';
import type { EmailTemplateConfig } from '@/features/template-designer/types';

/**
 * EmailService - Handles sending emails via Supabase Edge Functions
 *
 * This service integrates with Supabase Edge Functions to send emails.
 * The actual email sending happens server-side to keep credentials secure.
 *
 * Setup required:
 * 1. Create a Supabase Edge Function (e.g., `send-email`)
 * 2. Configure email provider (SendGrid, Resend, AWS SES, etc.)
 * 3. Deploy the edge function
 */

export class EmailService {
  /**
   * Send order receipt email with PDF tickets
   */
  static async sendOrderReceipt(
    data: OrderReceiptEmailData
  ): Promise<EmailSendResult> {
    try {
      // Generate PDF ticket
      let pdfAttachment: string | undefined;
      if (data.pdfTicketAttachment) {
        pdfAttachment = data.pdfTicketAttachment;
      } else {
        try {
          pdfAttachment = await TicketPDFService.generateTicketPDF(data);
          if (pdfAttachment) {
            logger.info('PDF ticket generated successfully', { orderId: data.orderId });
          }
        } catch (pdfError) {
          // Log error but continue sending email without PDF attachment
          logger.warn('Failed to generate PDF ticket, sending email without attachment', {
            orderId: data.orderId,
            error: pdfError instanceof Error ? pdfError.message : 'Unknown',
          });
        }
      }

      // Generate HTML email
      const htmlContent = generateOrderReceiptEmailHTML({
        ...data,
        pdfTicketAttachment: pdfAttachment,
      });

      // Call Supabase Edge Function to send email
      const { data: response, error } = await supabase.functions.invoke(
        'send-email',
        {
          body: {
            to: [data.purchaser.email],
            subject: `Order Confirmation - ${data.event.title}`,
            html: htmlContent,
            attachments: pdfAttachment
              ? [
                  {
                    filename: `tickets-${data.orderId}.pdf`,
                    content: pdfAttachment,
                    contentType: 'application/pdf',
                  },
                ]
              : undefined,
          },
        }
      );

      if (error) {
        logger.error('Error sending email:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        messageId: response?.messageId,
      };
    } catch (error) {
      logger.error('Unexpected error sending email:', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send test email (for development/testing)
   */
  static async sendTestEmail(toEmail: string): Promise<EmailSendResult> {
    const testData: OrderReceiptEmailData = {
      orderId: 'TEST-' + Date.now(),
      orderDate: new Date().toISOString(),
      event: {
        title: 'Test Event',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
        time: '20:00',
        venue: {
          name: 'Test Venue',
          address: '123 Test Street',
          city: 'Test City, TC 12345',
        },
        imageUrl:
          'https://placehold.co/600x400/DAA520/FFFFFF/png?text=Test+Event',
      },
      purchaser: {
        fullName: 'Test User',
        email: toEmail,
        phone: '+1 (555) 123-4567',
      },
      orderSummary: {
        items: [
          {
            ticketTierName: 'General Admission',
            quantity: 2,
            unitPrice: 50.0,
            subtotal: 100.0,
          },
          {
            ticketTierName: 'VIP',
            quantity: 1,
            unitPrice: 150.0,
            subtotal: 150.0,
          },
        ],
        subtotal: 250.0,
        serviceFee: 12.5,
        processingFee: 7.5,
        ticketProtection: 10.0,
        tax: 24.0,
        total: 304.0,
        currency: 'USD',
      },
    };

    return this.sendOrderReceipt(testData);
  }

  /**
   * Preview email HTML (for development/testing)
   * Returns the HTML string that would be sent
   */
  static previewOrderReceiptEmail(data: OrderReceiptEmailData): string {
    return generateOrderReceiptEmailHTML(data);
  }

  /**
   * Convert order data from database to email format
   * Transforms snake_case database fields and cents-based amounts to email format
   *
   * @param order - Order data from database (with items)
   * @param event - Event data (title, date, time, venue, image)
   * @param purchaserInfo - Purchaser contact information
   */
  static convertOrderToEmailData(
    order: OrderForEmailConversion,
    event: OrderEventForEmail,
    purchaserInfo: { fullName: string; email: string; phone?: string }
  ): OrderReceiptEmailData {
    return {
      orderId: order.id,
      orderDate: order.created_at,
      event: {
        title: event.title,
        date: event.date,
        time: event.time,
        venue: {
          name: event.venue?.name || 'TBA',
          address: event.venue?.address || 'TBA',
          city: event.venue?.city || 'TBA',
        },
        imageUrl: event.image_url,
      },
      purchaser: purchaserInfo,
      orderSummary: {
        items: (order.items || []).map((item: OrderItemForEmail) => ({
          ticketTierName: item.ticket_tier?.name || 'Ticket',
          quantity: item.quantity,
          unitPrice: item.unit_price_cents / 100,
          subtotal: item.subtotal_cents / 100,
        })),
        subtotal: order.subtotal_cents / 100,
        serviceFee: order.service_fee_cents
          ? order.service_fee_cents / 100
          : undefined,
        processingFee: order.processing_fee_cents
          ? order.processing_fee_cents / 100
          : undefined,
        ticketProtection: order.ticket_protection_cents
          ? order.ticket_protection_cents / 100
          : undefined,
        tax: order.tax_cents ? order.tax_cents / 100 : 0,
        total: order.total_cents / 100,
        currency: order.currency || 'USD',
      },
    };
  }

  /**
   * Send a sample email using the current template configuration.
   * Used by the Template Designer to test email templates.
   */
  static async sendSampleEmail(
    toEmail: string,
    config?: EmailTemplateConfig
  ): Promise<EmailSendResult> {
    const sampleData: OrderReceiptEmailData = {
      orderId: 'SAMPLE-' + Date.now(),
      orderDate: new Date().toISOString(),
      event: {
        title: 'Midnight Resonance: A Force Majeure Experience',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
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
        fullName: 'Sample User',
        email: toEmail,
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
    };

    try {
      const htmlContent = generateOrderReceiptEmailHTML(sampleData, config);

      const { data: response, error } = await supabase.functions.invoke(
        'send-email',
        {
          body: {
            to: [toEmail],
            subject: `[Sample] Order Confirmation - ${sampleData.event.title}`,
            html: htmlContent,
          },
        }
      );

      if (error) {
        logger.error('Error sending sample email:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      logger.info('Sample email sent successfully', { email: toEmail });

      return {
        success: true,
        messageId: response?.messageId,
      };
    } catch (error) {
      logger.error('Unexpected error sending sample email:', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Send RSVP confirmation email with PDF ticket
   */
  static async sendRsvpConfirmation(
    data: RsvpConfirmationEmailData
  ): Promise<EmailSendResult> {
    try {
      // Generate PDF ticket for RSVP
      let pdfAttachment: string | undefined;
      if (data.pdfTicketAttachment) {
        pdfAttachment = data.pdfTicketAttachment;
      } else {
        try {
          pdfAttachment = await TicketPDFService.generateRsvpTicketPDF(data);
          if (pdfAttachment) {
            logger.info('RSVP PDF ticket generated successfully', {
              rsvpId: data.rsvpId,
            });
          }
        } catch (pdfError) {
          // Log error but continue sending email without PDF attachment
          logger.warn(
            'Failed to generate RSVP PDF ticket, sending email without attachment',
            {
              rsvpId: data.rsvpId,
              error: pdfError instanceof Error ? pdfError.message : 'Unknown',
            }
          );
        }
      }

      // Generate HTML email
      const htmlContent = generateRsvpConfirmationEmailHTML({
        ...data,
        pdfTicketAttachment: pdfAttachment,
      });

      // Call Supabase Edge Function to send email
      const { data: response, error } = await supabase.functions.invoke(
        'send-email',
        {
          body: {
            to: [data.attendee.email],
            subject: `RSVP Confirmed - ${data.event.title}`,
            html: htmlContent,
            attachments: pdfAttachment
              ? [
                  {
                    filename: `rsvp-ticket-${data.rsvpId}.pdf`,
                    content: pdfAttachment,
                    contentType: 'application/pdf',
                  },
                ]
              : undefined,
          },
        }
      );

      if (error) {
        logger.error('Error sending RSVP confirmation email:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      logger.info('RSVP confirmation email sent', {
        rsvpId: data.rsvpId,
        eventTitle: data.event.title,
        attendeeEmail: data.attendee.email,
      });

      return {
        success: true,
        messageId: response?.messageId,
      };
    } catch (error) {
      logger.error('Unexpected error sending RSVP confirmation email:', {
        error,
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

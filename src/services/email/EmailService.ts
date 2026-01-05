import { supabase } from '@/shared';
import {
  OrderReceiptEmailData,
  EmailSendResult,
  OrderForEmailConversion,
  OrderItemForEmail,
  OrderEventForEmail,
} from '@/types/email';
import { generateOrderReceiptEmailHTML } from './templates/OrderReceiptEmail';
import { generateArtistRegistrationEmailHTML } from './templates/ArtistRegistrationEmail';
import { logger } from '@/shared';
import { TicketPDFService } from './TicketPDFService';

export interface ArtistRegistrationEmailData {
  artistName: string;
  email: string;
  city: string;
  genres: string[];
  registrationDate: string;
}

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
   * Send artist registration confirmation email
   */
  static async sendArtistRegistrationConfirmation(
    data: ArtistRegistrationEmailData
  ): Promise<EmailSendResult> {
    try {
      // Generate HTML email
      const htmlContent = generateArtistRegistrationEmailHTML(data);

      // Call Supabase Edge Function to send email
      const { data: response, error } = await supabase.functions.invoke(
        'send-email',
        {
          body: {
            to: [data.email],
            subject: `Artist Registration Received - Force Majeure`,
            html: htmlContent,
          },
        }
      );

      if (error) {
        logger.error('Error sending artist registration email:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      logger.info('Artist registration confirmation email sent', {
        artistName: data.artistName,
        email: data.email,
      });

      return {
        success: true,
        messageId: response?.messageId,
      };
    } catch (error) {
      logger.error('Unexpected error sending artist registration email:', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

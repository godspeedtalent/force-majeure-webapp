import { OrderReceiptEmailData } from '@/types/email';
import { logger } from '@/shared/services/logger';
import { TicketPDFGenerator } from '@/services/pdf/TicketPDFGenerator';
import { supabase } from '@/shared/api/supabase/client';

const pdfLogger = logger.createNamespace('TicketPDF');

/**
 * TicketPDFService - Generates PDF tickets for orders
 *
 * Integrates with TicketPDFGenerator to create PDF tickets with:
 * - Event information
 * - QR code for ticket validation
 * - Ticket tier information
 * - Order details
 */

export interface TicketPDFOptions {
  includeQRCode?: boolean;
  includeBarcode?: boolean;
  format?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
}

export class TicketPDFService {
  /**
   * Generate PDF ticket(s) for an order
   *
   * @param data - Order receipt data
   * @param options - PDF generation options
   * @returns Base64 encoded PDF string or undefined if generation fails
   */
  static async generateTicketPDF(
    data: OrderReceiptEmailData,
    options: TicketPDFOptions = {}
  ): Promise<string | undefined> {
    try {
      // Validate options
      if (!this.validateOptions(options)) {
        pdfLogger.error('Invalid PDF options provided', { options });
        return undefined;
      }

      // Fetch order with all ticket and event details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(
          `
          id,
          user_id,
          event_id,
          profiles!orders_user_id_fkey (
            full_name
          ),
          events (
            title,
            start_time,
            venues (
              name,
              address
            )
          ),
          tickets (
            id,
            qr_code_data,
            attendee_name,
            attendee_email,
            ticket_tiers (
              name
            )
          )
        `
        )
        .eq('id', data.orderId)
        .single();

      if (orderError || !order) {
        pdfLogger.error('Error fetching order for PDF generation', {
          error: orderError?.message,
          orderId: data.orderId,
        });
        return undefined;
      }

      // Transform data for PDF generator
      const orderData = {
        order_id: order.id,
        purchaser_name: order.profiles?.full_name || 'Unknown Purchaser',
        event: {
          title: order.events?.title || 'Unknown Event',
          start_time: order.events?.start_time || new Date().toISOString(),
          venue: {
            name: order.events?.venues?.name || 'Unknown Venue',
            address: order.events?.venues?.address,
          },
        },
        tickets: order.tickets.map((ticket: any) => ({
          id: ticket.id,
          qr_code_data: ticket.qr_code_data,
          attendee_name: ticket.attendee_name,
          attendee_email: ticket.attendee_email,
          ticket_tier: {
            name: ticket.ticket_tiers?.name || 'General Admission',
          },
        })),
      };

      // Generate PDF
      const pdfBase64 = await TicketPDFGenerator.generateOrderTickets(
        orderData
      );

      pdfLogger.info('PDF generated successfully', {
        orderId: data.orderId,
        ticketCount: order.tickets.length,
      });

      return pdfBase64;
    } catch (error) {
      pdfLogger.error('Error generating ticket PDF', {
        error: error instanceof Error ? error.message : 'Unknown',
        orderId: data.orderId,
      });
      return undefined;
    }
  }

  /**
   * Generate individual ticket PDFs for each ticket in an order
   *
   * @param data - Order receipt data
   * @param options - PDF generation options
   * @returns Array of base64 encoded PDF strings, one per ticket
   */
  static async generateIndividualTicketPDFs(
    data: OrderReceiptEmailData,
    options: TicketPDFOptions = {}
  ): Promise<string[]> {
    try {
      // Validate options
      if (!this.validateOptions(options)) {
        pdfLogger.error('Invalid PDF options provided', { options });
        return [];
      }

      // Fetch order with all ticket and event details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(
          `
          id,
          user_id,
          event_id,
          profiles!orders_user_id_fkey (
            full_name
          ),
          events (
            title,
            start_time,
            venues (
              name,
              address
            )
          ),
          tickets (
            id,
            qr_code_data,
            attendee_name,
            attendee_email,
            ticket_tiers (
              name
            )
          )
        `
        )
        .eq('id', data.orderId)
        .single();

      if (orderError || !order) {
        pdfLogger.error('Error fetching order for individual PDF generation', {
          error: orderError?.message,
          orderId: data.orderId,
        });
        return [];
      }

      const eventDate = new Date(
        order.events?.start_time || new Date().toISOString()
      );

      // Generate individual PDFs for each ticket
      const pdfPromises = order.tickets.map((ticket: any) =>
        TicketPDFGenerator.generateSingleTicket(
          {
            ticketId: ticket.id,
            qrCodeData: ticket.qr_code_data,
            eventName: order.events?.title || 'Unknown Event',
            eventDate: eventDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            eventTime: eventDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            }),
            venueName: order.events?.venues?.name || 'Unknown Venue',
            venueAddress: order.events?.venues?.address,
            ticketTierName: ticket.ticket_tiers?.name || 'General Admission',
            attendeeName: ticket.attendee_name,
            attendeeEmail: ticket.attendee_email,
            orderNumber: order.id,
            purchaserName: order.profiles?.full_name || 'Unknown Purchaser',
          },
          {
            format: options.format || 'Letter',
            orientation: options.orientation || 'portrait',
          }
        )
      );

      const pdfs = await Promise.all(pdfPromises);

      pdfLogger.info('Individual PDFs generated successfully', {
        orderId: data.orderId,
        ticketCount: order.tickets.length,
      });

      return pdfs;
    } catch (error) {
      pdfLogger.error('Error generating individual ticket PDFs', {
        error: error instanceof Error ? error.message : 'Unknown',
        orderId: data.orderId,
      });
      return [];
    }
  }

  /**
   * Validate ticket PDF options
   */
  static validateOptions(options: TicketPDFOptions): boolean {
    const validFormats = ['A4', 'Letter'];
    const validOrientations = ['portrait', 'landscape'];

    if (options.format && !validFormats.includes(options.format)) {
      pdfLogger.error('Invalid PDF format', {
        format: options.format,
        validFormats,
      });
      return false;
    }

    if (
      options.orientation &&
      !validOrientations.includes(options.orientation)
    ) {
      pdfLogger.error('Invalid PDF orientation', {
        orientation: options.orientation,
        validOrientations,
      });
      return false;
    }

    return true;
  }
}

/**
 * Example usage:
 *
 * ```typescript
 * // Generate PDF for entire order
 * const pdfBase64 = await TicketPDFService.generateTicketPDF(orderData);
 *
 * // Generate individual PDFs for each ticket
 * const individualPDFs = await TicketPDFService.generateIndividualTicketPDFs(orderData, {
 *   includeQRCode: true,
 *   includeBarcode: true,
 *   format: 'A4',
 *   orientation: 'portrait',
 * });
 * ```
 */

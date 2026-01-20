import { OrderReceiptEmailData } from '@/types/email';
import { RsvpConfirmationEmailData } from './templates/RsvpConfirmationEmail';
import { logger } from '@/shared';
import { TicketPDFGenerator } from '@/services/pdf/TicketPDFGenerator';
import { supabase } from '@/shared';

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

      // Cast order to any to work around Supabase type inference limitations
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orderAny = order as any;

      // Transform data for PDF generator
      const orderData = {
        order_id: orderAny.id,
        purchaser_name: orderAny.profiles?.full_name || 'Unknown Purchaser',
        event: {
          title: orderAny.events?.title || 'Unknown Event',
          start_time: orderAny.events?.start_time || new Date().toISOString(),
          venue: {
            name: orderAny.events?.venues?.name || 'Unknown Venue',
            address: orderAny.events?.venues?.address,
          },
        },
        tickets: orderAny.tickets.map((ticket: any) => ({
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
        ticketCount: orderAny.tickets.length,
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

      // Cast order to any to work around Supabase type inference limitations
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const orderAny = order as any;

      const eventDate = new Date(
        orderAny.events?.start_time || new Date().toISOString()
      );

      // Generate individual PDFs for each ticket
      const pdfPromises = orderAny.tickets.map((ticket: any) =>
        TicketPDFGenerator.generateSingleTicket(
          {
            ticketId: ticket.id,
            qrCodeData: ticket.qr_code_data,
            eventName: orderAny.events?.title || 'Unknown Event',
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
            venueName: orderAny.events?.venues?.name || 'Unknown Venue',
            venueAddress: orderAny.events?.venues?.address,
            ticketTierName: ticket.ticket_tiers?.name || 'General Admission',
            attendeeName: ticket.attendee_name,
            attendeeEmail: ticket.attendee_email,
            orderNumber: orderAny.id,
            purchaserName: orderAny.profiles?.full_name || 'Unknown Purchaser',
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
        ticketCount: orderAny.tickets.length,
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

  /**
   * Generate PDF ticket for an RSVP confirmation
   *
   * @param data - RSVP confirmation email data
   * @param options - PDF generation options
   * @returns Base64 encoded PDF string or undefined if generation fails
   */
  static async generateRsvpTicketPDF(
    data: RsvpConfirmationEmailData,
    options: TicketPDFOptions = {}
  ): Promise<string | undefined> {
    try {
      // Validate options
      if (!this.validateOptions(options)) {
        pdfLogger.error('Invalid PDF options provided for RSVP', { options });
        return undefined;
      }

      // Parse the event date and time
      const eventDate = new Date(data.event.date);
      const formattedDate = eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Generate a unique QR code data for this RSVP ticket
      // Format: RSVP-{rsvpId}-{eventId}-{timestamp}
      const qrCodeData = `RSVP-${data.rsvpId}-${data.event.id}-${Date.now()}`;

      // Generate the ticket PDF
      const pdfBase64 = await TicketPDFGenerator.generateSingleTicket(
        {
          ticketId: data.rsvpId,
          qrCodeData,
          eventName: data.event.title,
          eventDate: formattedDate,
          eventTime: data.event.time,
          venueName: data.event.venue.name,
          venueAddress: data.event.venue.address
            ? `${data.event.venue.address}${data.event.venue.city ? `, ${data.event.venue.city}` : ''}`
            : undefined,
          ticketTierName: 'RSVP - Free Entry',
          attendeeName: data.attendee.fullName,
          attendeeEmail: data.attendee.email,
          orderNumber: `RSVP-${data.rsvpId.slice(0, 8).toUpperCase()}`,
          purchaserName: data.attendee.fullName,
          eventImageUrl: data.event.imageUrl,
        },
        {
          format: options.format || 'Letter',
          orientation: options.orientation || 'portrait',
        }
      );

      pdfLogger.info('RSVP PDF generated successfully', {
        rsvpId: data.rsvpId,
        eventTitle: data.event.title,
      });

      return pdfBase64;
    } catch (error) {
      pdfLogger.error('Error generating RSVP ticket PDF', {
        error: error instanceof Error ? error.message : 'Unknown',
        rsvpId: data.rsvpId,
      });
      return undefined;
    }
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

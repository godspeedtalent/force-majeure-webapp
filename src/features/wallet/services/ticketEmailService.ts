/**
 * Ticket Email Service
 *
 * Orchestrates sending ticket emails with PDF attachments via Resend.
 * This service is triggered after checkout completion to send tickets to users.
 */

import { supabase, logger } from '@/shared';
import { TicketPDFGenerator, TicketPDFData } from '@/services/pdf/TicketPDFGenerator';
import { generateOrderReceiptEmailHTML } from '@/services/email/templates/OrderReceiptEmail';
import { ticketService } from './ticketService';
import type { OrderReceiptEmailData, EmailSendResult } from '@/types/email';
import { format } from 'date-fns';

const emailLogger = logger.createNamespace('TicketEmailService');

/**
 * Order data structure for email generation
 */
interface OrderWithDetails {
  id: string;
  created_at: string;
  total_cents: number;
  subtotal_cents: number;
  fees_cents: number;
  currency: string;
  profile: {
    email: string;
    full_name: string | null;
    display_name: string | null;
  } | null;
  guest: {
    email: string;
    full_name: string | null;
  } | null;
  event: {
    id: string;
    title: string;
    start_time: string;
    hero_image: string | null;
    venue: {
      name: string;
      address_line_1: string | null;
      city: string | null;
      state: string | null;
    } | null;
  };
  order_items: Array<{
    quantity: number;
    unit_price_cents: number;
    subtotal_cents: number;
    ticket_tier: {
      name: string;
    };
  }>;
}

export const ticketEmailService = {
  /**
   * Send ticket email with PDF attachment
   *
   * @param orderId - The order ID to send tickets for
   * @returns Email send result
   */
  async sendTicketEmail(orderId: string): Promise<EmailSendResult> {
    try {
      emailLogger.info('Starting ticket email process', { orderId });

      // Fetch order details
      const order = await this.fetchOrderDetails(orderId);
      if (!order) {
        emailLogger.error('Order not found', { orderId });
        return { success: false, error: 'Order not found' };
      }

      // Get recipient email
      const recipientEmail = order.profile?.email || order.guest?.email;
      if (!recipientEmail) {
        emailLogger.error('No recipient email found', { orderId });
        return { success: false, error: 'No recipient email' };
      }

      // Fetch tickets for this order
      const tickets = await ticketService.getTicketsByOrderId(orderId);
      if (tickets.length === 0) {
        emailLogger.warn('No tickets found for order', { orderId });
        // Continue without PDF - email will just have order confirmation
      }

      // Generate PDF if we have tickets
      let pdfBase64: string | undefined;
      if (tickets.length > 0) {
        try {
          const pdfData = this.convertTicketsToPDFData(tickets, order);
          pdfBase64 = await TicketPDFGenerator.generateMultipleTickets(pdfData);
          emailLogger.info('PDF generated successfully', {
            orderId,
            ticketCount: tickets.length,
          });
        } catch (pdfError) {
          emailLogger.warn('Failed to generate PDF, continuing without attachment', {
            orderId,
            error: pdfError instanceof Error ? pdfError.message : 'Unknown',
          });
        }
      }

      // Build email data
      const emailData = this.buildEmailData(order, pdfBase64);

      // Generate HTML content
      const htmlContent = generateOrderReceiptEmailHTML(emailData);

      // Send via Resend edge function
      const { data: response, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: [recipientEmail],
          subject: `Your tickets for ${order.event.title}`,
          html: htmlContent,
          attachments: pdfBase64
            ? [
                {
                  filename: `tickets-${orderId.slice(0, 8)}.pdf`,
                  content: pdfBase64,
                },
              ]
            : undefined,
        },
      });

      if (error) {
        emailLogger.error('Failed to send email', {
          orderId,
          error: error.message,
        });
        return { success: false, error: error.message };
      }

      emailLogger.info('Ticket email sent successfully', {
        orderId,
        recipientEmail,
        hasAttachment: !!pdfBase64,
      });

      return {
        success: true,
        messageId: response?.messageId,
      };
    } catch (error) {
      emailLogger.error('Unexpected error in sendTicketEmail', {
        orderId,
        error: error instanceof Error ? error.message : 'Unknown',
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Fetch order details needed for email
   */
  async fetchOrderDetails(orderId: string): Promise<OrderWithDetails | null> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        created_at,
        total_cents,
        subtotal_cents,
        fees_cents,
        currency,
        profile:profiles!orders_user_id_profiles_fkey(
          email,
          full_name,
          display_name
        ),
        guest:guests!orders_guest_id_fkey(
          email,
          full_name
        ),
        event:events!orders_event_id_fkey(
          id,
          title,
          start_time,
          hero_image,
          venue:venues(
            name,
            address_line_1,
            city,
            state
          )
        ),
        order_items(
          quantity,
          unit_price_cents,
          subtotal_cents,
          ticket_tier:ticket_tiers(name)
        )
      `)
      .eq('id', orderId)
      .single();

    if (error) {
      emailLogger.error('Error fetching order details', {
        orderId,
        error: error.message,
      });
      return null;
    }

    return data as unknown as OrderWithDetails;
  },

  /**
   * Convert tickets to PDF data format
   */
  convertTicketsToPDFData(
    tickets: Awaited<ReturnType<typeof ticketService.getTicketsByOrderId>>,
    order: OrderWithDetails
  ): TicketPDFData[] {
    const purchaserName =
      order.profile?.full_name ||
      order.profile?.display_name ||
      order.guest?.full_name ||
      'Guest';

    const eventDate = format(new Date(order.event.start_time), 'EEEE, MMMM d, yyyy');
    const eventTime = format(new Date(order.event.start_time), 'h:mm a');

    const venueAddress = order.event.venue
      ? [
          order.event.venue.address_line_1,
          order.event.venue.city,
          order.event.venue.state,
        ]
          .filter(Boolean)
          .join(', ')
      : undefined;

    return tickets.map(ticket => ({
      ticketId: ticket.id,
      qrCodeData: ticket.qr_code_data,
      eventName: order.event.title,
      eventDate,
      eventTime,
      venueName: order.event.venue?.name || 'TBA',
      venueAddress,
      ticketTierName: ticket.ticket_tier.name,
      attendeeName: ticket.attendee_name || undefined,
      attendeeEmail: ticket.attendee_email || undefined,
      orderNumber: order.id.slice(0, 8).toUpperCase(),
      purchaserName,
    }));
  },

  /**
   * Build email data structure
   */
  buildEmailData(order: OrderWithDetails, pdfBase64?: string): OrderReceiptEmailData {
    const purchaserName =
      order.profile?.full_name ||
      order.profile?.display_name ||
      order.guest?.full_name ||
      'Guest';
    const purchaserEmail = order.profile?.email || order.guest?.email || '';

    const eventDate = format(new Date(order.event.start_time), 'MMMM d, yyyy');
    const eventTime = format(new Date(order.event.start_time), 'h:mm a');

    return {
      orderId: order.id,
      orderDate: order.created_at,
      event: {
        title: order.event.title,
        date: eventDate,
        time: eventTime,
        venue: {
          name: order.event.venue?.name || 'TBA',
          address: order.event.venue?.address_line_1 || '',
          city: [order.event.venue?.city, order.event.venue?.state]
            .filter(Boolean)
            .join(', '),
        },
        imageUrl: order.event.hero_image || undefined,
      },
      purchaser: {
        fullName: purchaserName,
        email: purchaserEmail,
      },
      orderSummary: {
        items: order.order_items.map(item => ({
          ticketTierName: item.ticket_tier.name,
          quantity: item.quantity,
          unitPrice: item.unit_price_cents / 100,
          subtotal: item.subtotal_cents / 100,
        })),
        subtotal: order.subtotal_cents / 100,
        tax: 0, // Tax is included in fees for this system
        total: order.total_cents / 100,
        currency: order.currency || 'USD',
        serviceFee: order.fees_cents / 100,
      },
      pdfTicketAttachment: pdfBase64,
    };
  },
};

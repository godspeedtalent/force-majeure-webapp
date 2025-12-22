/**
 * TicketPDFGenerator - Client-side PDF generation for tickets
 *
 * Generates PDF tickets with Force Majeure branding, QR codes, and event details.
 * Uses jsPDF for PDF generation and qrcode for QR code images.
 *
 * @module services/pdf/TicketPDFGenerator
 */

import jsPDF from 'jspdf';
import * as QRCode from 'qrcode';
import { logger } from '@/shared';

const pdfLogger = logger.createNamespace('TicketPDFGenerator');

/**
 * Ticket data structure for PDF generation
 */
export interface TicketPDFData {
  ticketId: string;
  qrCodeData: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  venueName: string;
  venueAddress?: string;
  ticketTierName: string;
  attendeeName?: string;
  attendeeEmail?: string;
  orderNumber: string;
  purchaserName: string;
}

/**
 * PDF generation options
 */
export interface PDFGenerationOptions {
  format?: 'A4' | 'Letter';
  orientation?: 'portrait' | 'landscape';
}

/**
 * TicketPDFGenerator class
 * Handles all PDF generation logic for tickets
 */
export class TicketPDFGenerator {
  /**
   * Add ticket content to a PDF page
   * @private
   */
  private static async addTicketPageContent(
    doc: jsPDF,
    ticketData: TicketPDFData,
    _options: PDFGenerationOptions = {}
  ): Promise<void> {
    // Set up dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // Colors (Force Majeure design system)
    const goldColor = '#dfba7d'; // fm-gold
    const blackColor = '#000000';
    const whiteColor = '#ffffff';

    // Background (black)
    doc.setFillColor(blackColor);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    let yPosition = margin;

    // Header Section
    doc.setFontSize(24);
    doc.setTextColor(goldColor);
    doc.text('FORCE MAJEURE', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    doc.setFontSize(10);
    doc.setTextColor(whiteColor);
    doc.text('ELECTRONIC MUSIC EVENTS', pageWidth / 2, yPosition, {
      align: 'center',
    });
    yPosition += 15;

    // Divider line
    doc.setDrawColor(goldColor);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Event Name
    doc.setFontSize(18);
    doc.setTextColor(goldColor);
    const eventNameLines = doc.splitTextToSize(
      ticketData.eventName,
      pageWidth - margin * 2
    );
    doc.text(eventNameLines, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += eventNameLines.length * 7 + 5;

    // Event Details
    doc.setFontSize(12);
    doc.setTextColor(whiteColor);

    const eventDetails = [
      `${ticketData.eventDate} at ${ticketData.eventTime}`,
      ticketData.venueName,
    ];

    if (ticketData.venueAddress) {
      eventDetails.push(ticketData.venueAddress);
    }

    eventDetails.forEach(detail => {
      doc.text(detail, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 6;
    });

    yPosition += 10;

    // QR Code Section
    const qrSize = 60; // mm
    const qrX = (pageWidth - qrSize) / 2;

    // Generate QR code as data URL
    const qrDataURL = await QRCode.toDataURL(ticketData.qrCodeData, {
      width: 300,
      margin: 1,
      color: {
        dark: blackColor,
        light: whiteColor,
      },
    });

    // Add white background for QR code
    doc.setFillColor(whiteColor);
    doc.rect(qrX - 2, yPosition - 2, qrSize + 4, qrSize + 4, 'F');

    // Add QR code image
    doc.addImage(qrDataURL, 'PNG', qrX, yPosition, qrSize, qrSize);
    yPosition += qrSize + 10;

    // QR code instruction
    doc.setFontSize(10);
    doc.setTextColor(goldColor);
    doc.text('SCAN AT VENUE ENTRANCE', pageWidth / 2, yPosition, {
      align: 'center',
    });
    yPosition += 10;

    // Divider line
    doc.setDrawColor(goldColor);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Ticket Information
    doc.setFontSize(10);
    doc.setTextColor(whiteColor);

    const ticketInfo = [
      { label: 'TICKET TYPE:', value: ticketData.ticketTierName },
      {
        label: 'ATTENDEE:',
        value: ticketData.attendeeName || 'Not specified',
      },
      { label: 'ORDER NUMBER:', value: ticketData.orderNumber },
      { label: 'PURCHASER:', value: ticketData.purchaserName },
    ];

    ticketInfo.forEach(info => {
      doc.setTextColor(goldColor);
      doc.text(info.label, margin, yPosition);
      doc.setTextColor(whiteColor);
      doc.text(info.value, margin + 40, yPosition);
      yPosition += 6;
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor('#888888');
    const footerY = pageHeight - 15;
    doc.text(
      'This ticket is valid for one admission only. Do not share or duplicate.',
      pageWidth / 2,
      footerY,
      { align: 'center' }
    );
    doc.text(
      `Ticket ID: ${ticketData.ticketId}`,
      pageWidth / 2,
      footerY + 4,
      { align: 'center' }
    );
  }

  /**
   * Generate a single ticket PDF
   *
   * @param ticketData - Ticket information
   * @param options - PDF generation options
   * @returns Base64 encoded PDF string
   */
  static async generateSingleTicket(
    ticketData: TicketPDFData,
    options: PDFGenerationOptions = {}
  ): Promise<string> {
    try {
      const { format = 'Letter', orientation = 'portrait' } = options;

      // Create new PDF document
      const doc = new jsPDF({
        orientation,
        unit: 'mm',
        format,
      });

      // Set up dimensions
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;

      // Colors (Force Majeure design system)
      const goldColor = '#dfba7d'; // fm-gold
      const blackColor = '#000000';
      const whiteColor = '#ffffff';

      // Background (black)
      doc.setFillColor(blackColor);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      let yPosition = margin;

      // Header Section
      doc.setFontSize(24);
      doc.setTextColor(goldColor);
      doc.text('FORCE MAJEURE', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      doc.setFontSize(10);
      doc.setTextColor(whiteColor);
      doc.text('ELECTRONIC MUSIC EVENTS', pageWidth / 2, yPosition, {
        align: 'center',
      });
      yPosition += 15;

      // Divider line
      doc.setDrawColor(goldColor);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Event Name
      doc.setFontSize(18);
      doc.setTextColor(goldColor);
      const eventNameLines = doc.splitTextToSize(
        ticketData.eventName,
        pageWidth - margin * 2
      );
      doc.text(eventNameLines, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += eventNameLines.length * 7 + 5;

      // Event Details
      doc.setFontSize(12);
      doc.setTextColor(whiteColor);

      const eventDetails = [
        `${ticketData.eventDate} at ${ticketData.eventTime}`,
        ticketData.venueName,
      ];

      if (ticketData.venueAddress) {
        eventDetails.push(ticketData.venueAddress);
      }

      eventDetails.forEach(detail => {
        doc.text(detail, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 6;
      });

      yPosition += 10;

      // QR Code Section
      const qrSize = 60; // mm
      const qrX = (pageWidth - qrSize) / 2;

      // Generate QR code as data URL
      const qrDataURL = await QRCode.toDataURL(ticketData.qrCodeData, {
        width: 300,
        margin: 1,
        color: {
          dark: blackColor,
          light: whiteColor,
        },
      });

      // Add white background for QR code
      doc.setFillColor(whiteColor);
      doc.rect(qrX - 2, yPosition - 2, qrSize + 4, qrSize + 4, 'F');

      // Add QR code image
      doc.addImage(qrDataURL, 'PNG', qrX, yPosition, qrSize, qrSize);
      yPosition += qrSize + 10;

      // QR code instruction
      doc.setFontSize(10);
      doc.setTextColor(goldColor);
      doc.text('SCAN AT VENUE ENTRANCE', pageWidth / 2, yPosition, {
        align: 'center',
      });
      yPosition += 10;

      // Divider line
      doc.setDrawColor(goldColor);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Ticket Information
      doc.setFontSize(10);
      doc.setTextColor(whiteColor);

      const ticketInfo = [
        { label: 'TICKET TYPE:', value: ticketData.ticketTierName },
        {
          label: 'ATTENDEE:',
          value: ticketData.attendeeName || 'Not specified',
        },
        { label: 'ORDER NUMBER:', value: ticketData.orderNumber },
        { label: 'PURCHASER:', value: ticketData.purchaserName },
      ];

      ticketInfo.forEach(info => {
        doc.setTextColor(goldColor);
        doc.text(info.label, margin, yPosition);
        doc.setTextColor(whiteColor);
        doc.text(info.value, margin + 40, yPosition);
        yPosition += 6;
      });

      yPosition += 5;

      // Footer
      doc.setFontSize(8);
      doc.setTextColor('#888888');
      const footerY = pageHeight - 15;
      doc.text(
        'This ticket is valid for one admission only. Do not share or duplicate.',
        pageWidth / 2,
        footerY,
        { align: 'center' }
      );
      doc.text(
        `Ticket ID: ${ticketData.ticketId}`,
        pageWidth / 2,
        footerY + 4,
        { align: 'center' }
      );

      // Convert to base64
      const pdfBase64 = doc.output('datauristring').split(',')[1];

      pdfLogger.info('PDF generated successfully', {
        ticketId: ticketData.ticketId,
        eventName: ticketData.eventName,
      });

      return pdfBase64;
    } catch (error) {
      pdfLogger.error('Error generating PDF', {
        error: error instanceof Error ? error.message : 'Unknown',
        ticketId: ticketData.ticketId,
      });
      throw error;
    }
  }

  /**
   * Generate multiple tickets in a single PDF
   *
   * @param tickets - Array of ticket data
   * @param options - PDF generation options
   * @returns Base64 encoded PDF string
   */
  static async generateMultipleTickets(
    tickets: TicketPDFData[],
    options: PDFGenerationOptions = {}
  ): Promise<string> {
    try {
      if (tickets.length === 0) {
        throw new Error('No tickets provided');
      }

      if (tickets.length === 1) {
        return await this.generateSingleTicket(tickets[0], options);
      }

      const { format = 'Letter', orientation = 'portrait' } = options;

      // Create new PDF document
      const doc = new jsPDF({
        orientation,
        unit: 'mm',
        format,
      });

      // Note: jsPDF doesn't directly support merging PDFs
      // For MVP, we'll generate separate PDFs and let the email service handle attachment
      // For production, consider using pdf-lib or server-side generation

      // Generate first ticket content on first page
      await this.addTicketPageContent(doc, tickets[0], options);

      // For subsequent tickets, add new pages
      for (let i = 1; i < tickets.length; i++) {
        doc.addPage();
        await this.addTicketPageContent(doc, tickets[i], options);
      }

      const pdfBase64 = doc.output('datauristring').split(',')[1];

      pdfLogger.info('Multiple tickets PDF generated', {
        ticketCount: tickets.length,
      });

      return pdfBase64;
    } catch (error) {
      pdfLogger.error('Error generating multiple tickets PDF', {
        error: error instanceof Error ? error.message : 'Unknown',
        ticketCount: tickets.length,
      });
      throw error;
    }
  }

  /**
   * Generate PDF for all tickets in an order
   * This is a convenience method that handles data transformation
   *
   * @param orderData - Order data with tickets
   * @returns Base64 encoded PDF string
   */
  static async generateOrderTickets(orderData: {
    order_id: string;
    purchaser_name: string;
    event: {
      title: string;
      start_time: string;
      venue: {
        name: string;
        address?: string;
      };
    };
    tickets: Array<{
      id: string;
      qr_code_data: string;
      attendee_name?: string;
      attendee_email?: string;
      ticket_tier: {
        name: string;
      };
    }>;
  }): Promise<string> {
    try {
      // Transform order data to ticket PDF data
      const eventDate = new Date(orderData.event.start_time);
      const ticketData: TicketPDFData[] = orderData.tickets.map(ticket => ({
        ticketId: ticket.id,
        qrCodeData: ticket.qr_code_data,
        eventName: orderData.event.title,
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
        venueName: orderData.event.venue.name,
        venueAddress: orderData.event.venue.address,
        ticketTierName: ticket.ticket_tier.name,
        attendeeName: ticket.attendee_name,
        attendeeEmail: ticket.attendee_email,
        orderNumber: orderData.order_id,
        purchaserName: orderData.purchaser_name,
      }));

      return await this.generateMultipleTickets(ticketData);
    } catch (error) {
      pdfLogger.error('Error generating order tickets PDF', {
        error: error instanceof Error ? error.message : 'Unknown',
        orderId: orderData.order_id,
      });
      throw error;
    }
  }
}

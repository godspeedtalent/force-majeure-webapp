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
import type { PDFTemplateConfig } from '@/features/template-designer/types';
import { DEFAULT_TICKET_PDF_CONFIG } from '@/features/template-designer/config/defaults';

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
    _options: PDFGenerationOptions = {},
    config?: PDFTemplateConfig
  ): Promise<void> {
    // Use provided config or default
    const cfg = config || DEFAULT_TICKET_PDF_CONFIG;

    // Set up dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = cfg.spacing.margin;

    // Colors from config
    const goldColor = cfg.colors.primary;
    const blackColor = cfg.colors.secondary;
    const whiteColor = cfg.colors.text;
    const mutedColor = cfg.colors.mutedText;

    // Typography from config
    const fontSize = cfg.typography;

    // Content from config
    const content = cfg.content;

    // Toggles from config
    const toggles = cfg.toggles;

    // Background
    doc.setFillColor(blackColor);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    let yPosition = margin;

    // Header Section
    doc.setFontSize(fontSize.headerSize);
    doc.setTextColor(goldColor);
    doc.text(content.headerTitle, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    if (toggles.showSubtitle) {
      doc.setFontSize(fontSize.labelSize);
      doc.setTextColor(whiteColor);
      doc.text(content.headerSubtitle, pageWidth / 2, yPosition, {
        align: 'center',
      });
      yPosition += 15;
    } else {
      yPosition += 5;
    }

    // Divider line
    doc.setDrawColor(goldColor);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += cfg.spacing.sectionGap;

    // Event Name
    doc.setFontSize(fontSize.titleSize);
    doc.setTextColor(goldColor);
    const eventNameLines = doc.splitTextToSize(
      ticketData.eventName,
      pageWidth - margin * 2
    );
    doc.text(eventNameLines, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += eventNameLines.length * 7 + 5;

    // Event Details
    doc.setFontSize(fontSize.bodySize);
    doc.setTextColor(whiteColor);

    const eventDetails = [
      `${ticketData.eventDate} at ${ticketData.eventTime}`,
      ticketData.venueName,
    ];

    if (toggles.showVenueAddress && ticketData.venueAddress) {
      eventDetails.push(ticketData.venueAddress);
    }

    eventDetails.forEach(detail => {
      doc.text(detail, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 6;
    });

    yPosition += cfg.spacing.sectionGap;

    // QR Code Section
    const qrSize = cfg.qrSize;
    const qrX = (pageWidth - qrSize) / 2;

    // Generate QR code as data URL
    const qrDataURL = await QRCode.toDataURL(ticketData.qrCodeData, {
      width: 300,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    // Add white background for QR code
    doc.setFillColor('#ffffff');
    doc.rect(qrX - 2, yPosition - 2, qrSize + 4, qrSize + 4, 'F');

    // Add QR code image
    doc.addImage(qrDataURL, 'PNG', qrX, yPosition, qrSize, qrSize);
    yPosition += qrSize + cfg.spacing.sectionGap;

    // QR code instruction
    doc.setFontSize(fontSize.labelSize);
    doc.setTextColor(goldColor);
    doc.text(content.qrInstruction, pageWidth / 2, yPosition, {
      align: 'center',
    });
    yPosition += cfg.spacing.sectionGap;

    // Divider line
    doc.setDrawColor(goldColor);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += cfg.spacing.sectionGap;

    // Ticket Information
    doc.setFontSize(fontSize.labelSize);
    doc.setTextColor(whiteColor);

    const ticketInfo: Array<{ label: string; value: string }> = [
      { label: 'TICKET TYPE:', value: ticketData.ticketTierName },
    ];

    if (toggles.showAttendeeName) {
      ticketInfo.push({
        label: 'ATTENDEE:',
        value: ticketData.attendeeName || 'Not specified',
      });
    }

    ticketInfo.push({ label: 'ORDER NUMBER:', value: ticketData.orderNumber });

    if (toggles.showPurchaserName) {
      ticketInfo.push({ label: 'PURCHASER:', value: ticketData.purchaserName });
    }

    ticketInfo.forEach(info => {
      doc.setTextColor(goldColor);
      doc.text(info.label, margin, yPosition);
      doc.setTextColor(whiteColor);
      doc.text(info.value, margin + 40, yPosition);
      yPosition += 6;
    });

    // Footer
    if (toggles.showFooterDisclaimer) {
      doc.setFontSize(fontSize.footerSize);
      doc.setTextColor(mutedColor);
      const footerY = pageHeight - margin;
      doc.text(content.footerDisclaimer, pageWidth / 2, footerY, {
        align: 'center',
      });
      doc.text(
        `${content.footerTicketId} ${ticketData.ticketId}`,
        pageWidth / 2,
        footerY + 4,
        { align: 'center' }
      );
    }
  }

  /**
   * Generate a single ticket PDF
   *
   * @param ticketData - Ticket information
   * @param options - PDF generation options
   * @param config - Optional template configuration
   * @returns Base64 encoded PDF string
   */
  static async generateSingleTicket(
    ticketData: TicketPDFData,
    options: PDFGenerationOptions = {},
    config?: PDFTemplateConfig
  ): Promise<string> {
    try {
      // Use config values for format/orientation if provided, else options, else defaults
      const cfg = config || DEFAULT_TICKET_PDF_CONFIG;
      const format = options.format || cfg.format;
      const orientation = options.orientation || cfg.orientation;

      // Create new PDF document
      const doc = new jsPDF({
        orientation,
        unit: 'mm',
        format,
      });

      // Use the shared addTicketPageContent method
      await this.addTicketPageContent(doc, ticketData, options, config);

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
   * @param config - Optional template configuration
   * @returns Base64 encoded PDF string
   */
  static async generateMultipleTickets(
    tickets: TicketPDFData[],
    options: PDFGenerationOptions = {},
    config?: PDFTemplateConfig
  ): Promise<string> {
    try {
      if (tickets.length === 0) {
        throw new Error('No tickets provided');
      }

      if (tickets.length === 1) {
        return await this.generateSingleTicket(tickets[0], options, config);
      }

      // Use config values for format/orientation if provided
      const cfg = config || DEFAULT_TICKET_PDF_CONFIG;
      const format = options.format || cfg.format;
      const orientation = options.orientation || cfg.orientation;

      // Create new PDF document
      const doc = new jsPDF({
        orientation,
        unit: 'mm',
        format,
      });

      // Generate first ticket content on first page
      await this.addTicketPageContent(doc, tickets[0], options, config);

      // For subsequent tickets, add new pages
      for (let i = 1; i < tickets.length; i++) {
        doc.addPage();
        await this.addTicketPageContent(doc, tickets[i], options, config);
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

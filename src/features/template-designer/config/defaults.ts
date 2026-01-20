/**
 * Default Template Configurations
 *
 * These defaults match the current hardcoded values in the templates
 * to ensure backward compatibility.
 */

import type {
  EmailTemplateConfig,
  PDFTemplateConfig,
  TemplateColorConfig,
} from '../types';

// Shared color palettes
export const EMAIL_DEFAULT_COLORS: TemplateColorConfig = {
  primary: '#DAA520', // Gold (current email template)
  secondary: '#F5F5F5', // Light gray background
  text: '#333333', // Dark gray text
  mutedText: '#6B7280', // Muted text
  border: '#E0E0E0', // Border gray
  success: '#10B981', // Green success
};

export const PDF_DEFAULT_COLORS: TemplateColorConfig = {
  primary: '#dfba7d', // fm-gold (design system)
  secondary: '#000000', // Black background
  text: '#ffffff', // White text
  mutedText: '#888888', // Gray muted text
  border: '#dfba7d', // Gold borders
  success: '#10B981', // Green success
};

// Default Order Receipt Email configuration
export const DEFAULT_ORDER_RECEIPT_CONFIG: EmailTemplateConfig = {
  id: 'order-receipt',
  name: 'Order Receipt',
  colors: EMAIL_DEFAULT_COLORS,
  typography: {
    headerSize: 28,
    titleSize: 24,
    bodySize: 14,
    labelSize: 13,
    footerSize: 11,
  },
  spacing: {
    margin: 40,
    padding: 30,
    sectionGap: 20,
  },
  content: {
    headerTitle: 'FORCE MAJEURE',
    headerSubtitle: 'Order Confirmation',
    successMessage: 'Thank You for Your Purchase!',
    successSubtext:
      "Your tickets have been confirmed. We've sent them to your email.",
    ticketNotice:
      'Your PDF tickets are attached to this email. Please present them at the venue entrance.',
    ctaPrimaryText: 'View My Tickets',
    ctaSecondaryText: 'Browse More Events',
    footerContact: 'Questions? Contact us at support@forcemajeure.com',
    footerCopyright: 'Force Majeure. All rights reserved.',
  },
  toggles: {
    showHeroImage: true,
    showSuccessIcon: true,
    showPurchaserInfo: true,
    showOrderBreakdown: true,
    showTicketProtection: true,
    showServiceFee: true,
    showProcessingFee: true,
    showCtaButtons: true,
    showFooter: true,
  },
};

// Default Ticket PDF configuration
export const DEFAULT_TICKET_PDF_CONFIG: PDFTemplateConfig = {
  id: 'ticket',
  name: 'Ticket PDF',
  colors: PDF_DEFAULT_COLORS,
  typography: {
    headerSize: 24,
    titleSize: 18,
    bodySize: 12,
    labelSize: 10,
    footerSize: 8,
  },
  spacing: {
    margin: 15,
    padding: 10,
    sectionGap: 10,
  },
  content: {
    headerTitle: 'FORCE MAJEURE',
    headerSubtitle: 'ELECTRONIC MUSIC EVENTS',
    qrInstruction: 'SCAN AT VENUE ENTRANCE',
    footerDisclaimer:
      'This ticket is valid for one admission only. Do not share or duplicate.',
    footerTicketId: 'Ticket ID:',
  },
  toggles: {
    showLogo: true,
    showSubtitle: true,
    showEventImage: true,
    showVenueAddress: true,
    showAttendeeName: true,
    showPurchaserName: true,
    showFooterDisclaimer: true,
  },
  format: 'Letter',
  orientation: 'portrait',
  qrSize: 60,
};

// Export all defaults as a record for easy access
export const DEFAULT_EMAIL_CONFIGS: Record<string, EmailTemplateConfig> = {
  'order-receipt': DEFAULT_ORDER_RECEIPT_CONFIG,
};

export const DEFAULT_PDF_CONFIGS: Record<string, PDFTemplateConfig> = {
  ticket: DEFAULT_TICKET_PDF_CONFIG,
};

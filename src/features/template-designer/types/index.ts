/**
 * Template Designer Types
 *
 * Type definitions for email and PDF template configuration.
 */

// Template identifiers
export type EmailTemplateId = 'order-receipt' | 'artist-registration';
export type PDFTemplateId = 'ticket';
export type TemplateId = EmailTemplateId | PDFTemplateId;
export type TemplateType = 'email' | 'pdf';

// Color configuration
export interface TemplateColorConfig {
  primary: string; // Gold accent
  secondary: string; // Background color
  text: string; // Primary text color
  mutedText: string; // Secondary/muted text
  border: string; // Dividers and borders
  success: string; // Success indicators
}

// Typography configuration (sizes in pixels/points)
export interface TemplateTypographyConfig {
  headerSize: number;
  titleSize: number;
  bodySize: number;
  labelSize: number;
  footerSize: number;
}

// Spacing configuration (in pixels for email, mm for PDF)
export interface TemplateSpacingConfig {
  margin: number;
  padding: number;
  sectionGap: number;
}

// Email-specific content configuration
export interface EmailContentConfig {
  headerTitle: string;
  headerSubtitle: string;
  successMessage: string;
  successSubtext: string;
  ticketNotice: string;
  ctaPrimaryText: string;
  ctaSecondaryText: string;
  footerContact: string;
  footerCopyright: string;
}

// PDF-specific content configuration
export interface PDFContentConfig {
  headerTitle: string;
  headerSubtitle: string;
  qrInstruction: string;
  footerDisclaimer: string;
  footerTicketId: string;
}

// Toggle configuration for email templates
export interface EmailTogglesConfig {
  showHeroImage: boolean;
  showSuccessIcon: boolean;
  showPurchaserInfo: boolean;
  showOrderBreakdown: boolean;
  showTicketProtection: boolean;
  showServiceFee: boolean;
  showProcessingFee: boolean;
  showCtaButtons: boolean;
  showFooter: boolean;
}

// Toggle configuration for PDF templates
export interface PDFTogglesConfig {
  showSubtitle: boolean;
  showVenueAddress: boolean;
  showAttendeeName: boolean;
  showPurchaserName: boolean;
  showFooterDisclaimer: boolean;
}

// Complete email template configuration
export interface EmailTemplateConfig {
  id: EmailTemplateId;
  name: string;
  colors: TemplateColorConfig;
  typography: TemplateTypographyConfig;
  spacing: TemplateSpacingConfig;
  content: EmailContentConfig;
  toggles: EmailTogglesConfig;
}

// Complete PDF template configuration
export interface PDFTemplateConfig {
  id: PDFTemplateId;
  name: string;
  colors: TemplateColorConfig;
  typography: TemplateTypographyConfig;
  spacing: TemplateSpacingConfig;
  content: PDFContentConfig;
  toggles: PDFTogglesConfig;
  format: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
  qrSize: number; // in mm
}

// Union type for any template config
export type TemplateConfig = EmailTemplateConfig | PDFTemplateConfig;

// Type guards
export function isEmailTemplateConfig(
  config: TemplateConfig
): config is EmailTemplateConfig {
  return (
    config.id === 'order-receipt' || config.id === 'artist-registration'
  );
}

export function isPDFTemplateConfig(
  config: TemplateConfig
): config is PDFTemplateConfig {
  return config.id === 'ticket';
}

// Template metadata for UI display
export interface TemplateMetadata {
  id: TemplateId;
  name: string;
  description: string;
  type: TemplateType;
}

// All available templates
export const TEMPLATE_METADATA: TemplateMetadata[] = [
  {
    id: 'order-receipt',
    name: 'Order Receipt',
    description: 'Email sent after successful ticket purchase',
    type: 'email',
  },
  {
    id: 'artist-registration',
    name: 'Artist Registration',
    description: 'Email sent to confirm artist registration',
    type: 'email',
  },
  {
    id: 'ticket',
    name: 'Ticket PDF',
    description: 'PDF ticket with QR code for venue entry',
    type: 'pdf',
  },
];

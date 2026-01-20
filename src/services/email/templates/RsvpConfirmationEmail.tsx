/**
 * RsvpConfirmationEmail - Email template for RSVP confirmations
 *
 * Sent when a user RSVPs to a free event, includes PDF ticket for entry.
 */

import type { EmailTemplateConfig } from '@/features/template-designer/types';
import { DEFAULT_ORDER_RECEIPT_CONFIG } from '@/features/template-designer/config/defaults';

export interface RsvpConfirmationEmailData {
  rsvpId: string;
  event: {
    id: string;
    title: string;
    date: string;
    time: string;
    venue: {
      name: string;
      address?: string;
      city?: string;
    };
    imageUrl?: string;
  };
  attendee: {
    fullName: string;
    email: string;
  };
  /** Base64-encoded PDF ticket */
  pdfTicketAttachment?: string;
}

interface RsvpConfirmationEmailProps {
  data: RsvpConfirmationEmailData;
  config?: EmailTemplateConfig;
}

/**
 * Generate RSVP confirmation email HTML
 */
export const generateRsvpConfirmationEmailHTML = (
  data: RsvpConfirmationEmailData,
  config?: EmailTemplateConfig
): string => {
  const { event, attendee } = data;

  // Use provided config or default
  const cfg = config || DEFAULT_ORDER_RECEIPT_CONFIG;

  // Colors
  const colors = {
    gold: cfg.colors.primary,
    black: '#000000',
    white: '#ffffff',
    lightGray: cfg.colors.secondary,
    darkGray: cfg.colors.text,
    mutedText: cfg.colors.mutedText,
    success: cfg.colors.success,
    borderGray: cfg.colors.border,
  };

  // Font sizes
  const fontSize = {
    header: cfg.typography.headerSize,
    title: cfg.typography.titleSize,
    body: cfg.typography.bodySize,
    label: cfg.typography.labelSize,
    footer: cfg.typography.footerSize,
  };

  // Spacing
  const spacing = {
    margin: cfg.spacing.margin,
    padding: cfg.spacing.padding,
    sectionGap: cfg.spacing.sectionGap,
  };

  // Format date
  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <title>RSVP Confirmed - ${event.title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.5;
      background-color: ${colors.lightGray};
    }
    table {
      border-collapse: collapse;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${colors.lightGray};">
  <!-- Wrapper Table -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${colors.lightGray};">
    <tr>
      <td style="padding: 40px 20px;">

        <!-- Main Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: ${colors.white}; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: ${colors.black}; padding: ${spacing.padding}px; text-align: center;">
              <h1 style="margin: 0; color: ${colors.gold}; font-size: ${fontSize.header}px; font-weight: 700; letter-spacing: 0.5px;">
                FORCE MAJEURE
              </h1>
              <p style="margin: 10px 0 0 0; color: ${colors.white}; font-size: ${fontSize.body}px;">
                RSVP Confirmed
              </p>
            </td>
          </tr>

          <!-- Success Message -->
          <tr>
            <td style="padding: ${spacing.margin}px ${spacing.margin}px ${spacing.sectionGap}px ${spacing.margin}px; text-align: center;">
              <div style="width: 60px; height: 60px; margin: 0 auto 20px auto; border-radius: 50%; background-color: ${colors.success}; display: flex; align-items: center; justify-content: center;">
                <span style="color: ${colors.white}; font-size: 32px; line-height: 1;">✓</span>
              </div>
              <h2 style="margin: 0 0 10px 0; color: ${colors.darkGray}; font-size: ${fontSize.title}px; font-weight: 600;">
                You're on the list!
              </h2>
              <p style="margin: 0; color: ${colors.mutedText}; font-size: ${fontSize.body}px;">
                Your RSVP has been confirmed. Your ticket is attached to this email.
              </p>
            </td>
          </tr>

          <!-- Event Hero Image -->
          ${
            event.imageUrl
              ? `
          <tr>
            <td style="padding: 0 ${spacing.margin}px;">
              <img src="${event.imageUrl}" alt="${event.title}" style="width: 100%; height: auto; border-radius: 8px; display: block;" />
            </td>
          </tr>
          `
              : ''
          }

          <!-- Event Information -->
          <tr>
            <td style="padding: ${spacing.margin}px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${colors.lightGray}; border-radius: 8px; padding: 20px;">
                <tr>
                  <td style="padding: 15px;">
                    <h3 style="margin: 0 0 15px 0; color: ${colors.gold}; font-size: ${fontSize.title}px; font-weight: 600;">
                      ${event.title}
                    </h3>

                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 5px 0; font-size: ${fontSize.body}px; color: ${colors.darkGray};">
                          <strong style="color: ${colors.gold};">📅</strong>&nbsp;&nbsp;${formattedDate}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: ${fontSize.body}px; color: ${colors.darkGray};">
                          <strong style="color: ${colors.gold};">⏰</strong>&nbsp;&nbsp;${event.time}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0; font-size: ${fontSize.body}px; color: ${colors.darkGray};">
                          <strong style="color: ${colors.gold};">📍</strong>&nbsp;&nbsp;${event.venue.name}
                        </td>
                      </tr>
                      ${
                        event.venue.address
                          ? `
                      <tr>
                        <td style="padding: 5px 0 5px 24px; font-size: ${fontSize.label}px; color: ${colors.mutedText};">
                          ${event.venue.address}${event.venue.city ? `, ${event.venue.city}` : ''}
                        </td>
                      </tr>
                      `
                          : ''
                      }
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Attendee Info -->
          <tr>
            <td style="padding: 0 ${spacing.margin}px ${spacing.padding}px ${spacing.margin}px;">
              <h3 style="margin: 0 0 10px 0; color: ${colors.darkGray}; font-size: 16px; font-weight: 600;">
                Attendee
              </h3>
              <p style="margin: 0; font-size: ${fontSize.body}px; color: ${colors.darkGray};">
                ${attendee.fullName}
              </p>
              <p style="margin: 5px 0 0 0; font-size: ${fontSize.label}px; color: ${colors.mutedText};">
                ${attendee.email}
              </p>
            </td>
          </tr>

          <!-- Ticket Notice -->
          <tr>
            <td style="padding: 0 ${spacing.margin}px ${spacing.padding}px ${spacing.margin}px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: rgba(218, 165, 32, 0.1); border-left: 4px solid ${colors.gold}; border-radius: 0 6px 6px 0;">
                <tr>
                  <td style="padding: 15px;">
                    <p style="margin: 0; font-size: ${fontSize.body}px; color: ${colors.darkGray};">
                      <strong>📎 Your ticket is attached</strong>
                    </p>
                    <p style="margin: 10px 0 0 0; font-size: ${fontSize.label}px; color: ${colors.mutedText};">
                      ${data.pdfTicketAttachment ? 'Your PDF ticket is attached to this email. Please present it at the venue entrance.' : 'Your ticket will be available in your account shortly.'}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Buttons -->
          <tr>
            <td style="padding: 0 ${spacing.margin}px ${spacing.margin}px ${spacing.margin}px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center; padding-bottom: 15px;">
                    <a href="https://forcemajeure.com/wallet" style="display: inline-block; background-color: ${colors.gold}; color: ${colors.black}; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: ${fontSize.body}px; font-weight: 600;">
                      View My Tickets
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center;">
                    <a href="https://forcemajeure.com/events/${event.id}" style="display: inline-block; background-color: transparent; color: ${colors.darkGray}; text-decoration: none; padding: 12px 32px; border: 2px solid ${colors.borderGray}; border-radius: 6px; font-size: ${fontSize.body}px; font-weight: 500;">
                      View Event Details
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: ${colors.lightGray}; padding: ${spacing.padding}px ${spacing.margin}px; border-top: 1px solid ${colors.borderGray};">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center; padding-bottom: 15px;">
                    <p style="margin: 0; font-size: ${fontSize.footer}px; color: ${colors.mutedText};">
                      Questions? Contact us at support@forcemajeure.com
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0; font-size: ${fontSize.footer}px; color: ${colors.mutedText};">
                      © ${new Date().getFullYear()} Force Majeure. All rights reserved.
                    </p>
                    <p style="margin: 10px 0 0 0; font-size: ${fontSize.footer}px; color: ${colors.mutedText};">
                      This email was sent to ${attendee.email} regarding your RSVP.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!-- End Main Container -->

      </td>
    </tr>
  </table>
  <!-- End Wrapper Table -->
</body>
</html>
  `.trim();
};

/**
 * React component version for preview/testing purposes
 */
export const RsvpConfirmationEmail = ({
  data,
  config,
}: RsvpConfirmationEmailProps) => {
  const html = generateRsvpConfirmationEmailHTML(data, config);

  return (
    <div
      dangerouslySetInnerHTML={{ __html: html }}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

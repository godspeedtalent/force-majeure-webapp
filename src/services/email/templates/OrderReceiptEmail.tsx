import { OrderReceiptEmailData } from '@/types/email';
import { formatTimeDisplay } from '@/shared';
import type { EmailTemplateConfig } from '@/features/template-designer/types';
import { DEFAULT_ORDER_RECEIPT_CONFIG } from '@/features/template-designer/config/defaults';

/**
 * OrderReceiptEmail - HTML email template for order receipts
 *
 * This template is designed to work across all major email clients
 * using inline styles and table-based layout.
 *
 * Features:
 * - Event information with hero image
 * - Purchaser details
 * - Order breakdown matching checkout page layout
 * - PDF ticket attachment support (stubbed)
 * - Configurable colors, typography, spacing, and content via config parameter
 */

interface OrderReceiptEmailProps {
  data: OrderReceiptEmailData;
  config?: EmailTemplateConfig;
}

export const generateOrderReceiptEmailHTML = (
  data: OrderReceiptEmailData,
  config?: EmailTemplateConfig
): string => {
  const { orderId, orderDate, event, purchaser, orderSummary } = data;

  // Use provided config or default
  const cfg = config || DEFAULT_ORDER_RECEIPT_CONFIG;

  // Color palette from config
  const colors = {
    gold: cfg.colors.primary,
    black: '#000000',
    white: '#FFFFFF',
    lightGray: cfg.colors.secondary,
    darkGray: cfg.colors.text,
    borderGray: cfg.colors.border,
    mutedText: cfg.colors.mutedText,
    success: cfg.colors.success,
  };

  // Typography from config
  const fontSize = {
    header: cfg.typography.headerSize,
    title: cfg.typography.titleSize,
    body: cfg.typography.bodySize,
    label: cfg.typography.labelSize,
    footer: cfg.typography.footerSize,
  };

  // Spacing from config
  const spacing = {
    margin: cfg.spacing.margin,
    padding: cfg.spacing.padding,
    sectionGap: cfg.spacing.sectionGap,
  };

  // Content from config
  const content = cfg.content;

  // Toggles from config
  const toggles = cfg.toggles;

  // Format date for display
  const formattedDate = new Date(orderDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedEventDate = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = formatTimeDisplay(event.time);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Receipt - ${event.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: ${colors.lightGray};">

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
                ${content.headerTitle}
              </h1>
              <p style="margin: 10px 0 0 0; color: ${colors.white}; font-size: ${fontSize.body}px;">
                ${content.headerSubtitle}
              </p>
            </td>
          </tr>

          <!-- Success Message -->
          ${toggles.showSuccessIcon ? `
          <tr>
            <td style="padding: ${spacing.margin}px ${spacing.margin}px ${spacing.sectionGap}px ${spacing.margin}px; text-align: center;">
              <div style="width: 60px; height: 60px; margin: 0 auto 20px auto; border-radius: 50%; background-color: ${colors.success}; display: flex; align-items: center; justify-content: center;">
                <span style="color: ${colors.white}; font-size: 32px; line-height: 1;">✓</span>
              </div>
              <h2 style="margin: 0 0 10px 0; color: ${colors.darkGray}; font-size: ${fontSize.title}px; font-weight: 600;">
                ${content.successMessage}
              </h2>
              <p style="margin: 0; color: ${colors.mutedText}; font-size: ${fontSize.body}px;">
                ${content.successSubtext}
              </p>
            </td>
          </tr>
          ` : ''}

          <!-- Event Hero Image -->
          ${
            toggles.showHeroImage && event.imageUrl
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
            <td style="padding: ${event.imageUrl ? '30px' : '20px'} 40px 30px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${colors.lightGray}; border-radius: 8px; padding: 20px;">
                <tr>
                  <td>
                    <h3 style="margin: 0 0 15px 0; color: ${colors.darkGray}; font-size: 20px; font-weight: 600;">
                      ${event.title}
                    </h3>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding-bottom: 8px; color: ${colors.mutedText}; font-size: 14px;">
                          <strong style="color: ${colors.darkGray};">📅 Date:</strong> ${formattedEventDate}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 8px; color: ${colors.mutedText}; font-size: 14px;">
                          <strong style="color: ${colors.darkGray};">🕐 Time:</strong> ${formattedTime}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 8px; color: ${colors.mutedText}; font-size: 14px;">
                          <strong style="color: ${colors.darkGray};">📍 Venue:</strong> ${event.venue.name}
                        </td>
                      </tr>
                      <tr>
                        <td style="color: ${colors.mutedText}; font-size: 14px;">
                          ${event.venue.address}, ${event.venue.city}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Order Details Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="border-top: 2px solid ${colors.gold}; margin: 20px 0;"></div>
            </td>
          </tr>

          <!-- Order ID and Date -->
          <tr>
            <td style="padding: 0 40px 20px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="font-size: 13px; color: ${colors.mutedText};">
                    Order ID: <strong style="color: ${colors.darkGray};">${orderId}</strong>
                  </td>
                  <td style="font-size: 13px; color: ${colors.mutedText}; text-align: right;">
                    ${formattedDate}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Purchaser Information -->
          ${toggles.showPurchaserInfo ? `
          <tr>
            <td style="padding: 0 ${spacing.margin}px ${spacing.padding}px ${spacing.margin}px;">
              <h3 style="margin: 0 0 15px 0; color: ${colors.darkGray}; font-size: 16px; font-weight: 600;">
                Purchaser Information
              </h3>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${colors.lightGray}; border-radius: 6px; padding: 15px;">
                <tr>
                  <td style="padding-bottom: 8px; font-size: ${fontSize.body}px; color: ${colors.darkGray};">
                    <strong>Name:</strong> ${purchaser.fullName}
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 8px; font-size: ${fontSize.body}px; color: ${colors.darkGray};">
                    <strong>Email:</strong> ${purchaser.email}
                  </td>
                </tr>
                ${
                  purchaser.phone
                    ? `
                <tr>
                  <td style="font-size: ${fontSize.body}px; color: ${colors.darkGray};">
                    <strong>Phone:</strong> ${purchaser.phone}
                  </td>
                </tr>
                `
                    : ''
                }
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Order Summary -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <h3 style="margin: 0 0 15px 0; color: ${colors.darkGray}; font-size: 16px; font-weight: 600;">
                Order Summary
              </h3>

              <!-- Order Items -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 15px;">
                ${orderSummary.items
                  .map(
                    item => `
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid ${colors.borderGray};">
                    <div style="font-size: 14px; font-weight: 500; color: ${colors.darkGray}; margin-bottom: 4px;">
                      ${item.ticketTierName}
                    </div>
                    <div style="font-size: 12px; color: ${colors.mutedText};">
                      Qty: ${item.quantity} × $${item.unitPrice.toFixed(2)}
                    </div>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid ${colors.borderGray}; text-align: right; font-size: 14px; font-weight: 500; color: ${colors.darkGray};">
                    $${item.subtotal.toFixed(2)}
                  </td>
                </tr>
                `
                  )
                  .join('')}
              </table>

              <!-- Summary Breakdown -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${colors.lightGray}; border-radius: 6px; padding: 15px;">
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: ${colors.mutedText};">
                    Subtotal
                  </td>
                  <td style="padding: 6px 0; font-size: 14px; color: ${colors.darkGray}; text-align: right;">
                    $${orderSummary.subtotal.toFixed(2)}
                  </td>
                </tr>

                ${
                  orderSummary.ticketProtection
                    ? `
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: ${colors.mutedText};">
                    Ticket Protection
                  </td>
                  <td style="padding: 6px 0; font-size: 14px; color: ${colors.darkGray}; text-align: right;">
                    $${orderSummary.ticketProtection.toFixed(2)}
                  </td>
                </tr>
                `
                    : ''
                }

                ${
                  orderSummary.serviceFee
                    ? `
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: ${colors.mutedText};">
                    Service Fee
                  </td>
                  <td style="padding: 6px 0; font-size: 14px; color: ${colors.darkGray}; text-align: right;">
                    $${orderSummary.serviceFee.toFixed(2)}
                  </td>
                </tr>
                `
                    : ''
                }

                ${
                  orderSummary.processingFee
                    ? `
                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: ${colors.mutedText};">
                    Processing Fee
                  </td>
                  <td style="padding: 6px 0; font-size: 14px; color: ${colors.darkGray}; text-align: right;">
                    $${orderSummary.processingFee.toFixed(2)}
                  </td>
                </tr>
                `
                    : ''
                }

                <tr>
                  <td style="padding: 6px 0; font-size: 14px; color: ${colors.mutedText};">
                    Tax
                  </td>
                  <td style="padding: 6px 0; font-size: 14px; color: ${colors.darkGray}; text-align: right;">
                    $${orderSummary.tax.toFixed(2)}
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td colspan="2" style="padding-top: 10px;">
                    <div style="border-top: 2px solid ${colors.borderGray}; margin-bottom: 10px;"></div>
                  </td>
                </tr>

                <!-- Total -->
                <tr>
                  <td style="font-size: 18px; font-weight: 600; color: ${colors.darkGray};">
                    Total
                  </td>
                  <td style="font-size: 24px; font-weight: 700; color: ${colors.gold}; text-align: right;">
                    $${orderSummary.total.toFixed(2)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- PDF Ticket Notice -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #FEF3C7; border-left: 4px solid ${colors.gold}; border-radius: 6px; padding: 15px;">
                <tr>
                  <td style="font-size: 14px; color: ${colors.darkGray};">
                    <strong style="display: block; margin-bottom: 5px;">📎 Your Tickets</strong>
                    Your PDF tickets ${data.pdfTicketAttachment ? 'are attached to this email' : 'will be available in your account shortly'}. Please present them at the venue entrance.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Buttons -->
          ${toggles.showCtaButtons ? `
          <tr>
            <td style="padding: 0 ${spacing.margin}px ${spacing.margin}px ${spacing.margin}px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center; padding-bottom: 15px;">
                    <a href="https://forcemajeure.com/wallet" style="display: inline-block; background-color: ${colors.gold}; color: ${colors.black}; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: ${fontSize.body}px; font-weight: 600;">
                      ${content.ctaPrimaryText}
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center;">
                    <a href="https://forcemajeure.com/events" style="display: inline-block; background-color: transparent; color: ${colors.darkGray}; text-decoration: none; padding: 12px 32px; border: 2px solid ${colors.borderGray}; border-radius: 6px; font-size: ${fontSize.body}px; font-weight: 500;">
                      ${content.ctaSecondaryText}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Footer -->
          ${toggles.showFooter ? `
          <tr>
            <td style="background-color: ${colors.lightGray}; padding: ${spacing.padding}px ${spacing.margin}px; border-top: 1px solid ${colors.borderGray};">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center; padding-bottom: 15px;">
                    <p style="margin: 0; font-size: ${fontSize.footer}px; color: ${colors.mutedText};">
                      ${content.footerContact}
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0; font-size: ${fontSize.footer}px; color: ${colors.mutedText};">
                      © ${new Date().getFullYear()} ${content.footerCopyright}
                    </p>
                    <p style="margin: 10px 0 0 0; font-size: ${fontSize.footer}px; color: ${colors.mutedText};">
                      This email was sent to ${purchaser.email} regarding your ticket purchase.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ` : ''}

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
export const OrderReceiptEmail = ({ data, config }: OrderReceiptEmailProps) => {
  const html = generateOrderReceiptEmailHTML(data, config);

  return (
    <div
      dangerouslySetInnerHTML={{ __html: html }}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

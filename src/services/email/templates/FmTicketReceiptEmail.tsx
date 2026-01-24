/**
 * FmTicketReceiptEmail - Sleek FM-branded ticket receipt template
 *
 * Features a premium ticket card design with:
 * - Dark aesthetic with gold accents
 * - Event hero image with gold border
 * - Dashed perforation lines
 * - Clean info blocks with icons
 * - QR code section
 * - Order summary
 */

import { OrderReceiptEmailData } from '@/types/email';
import { formatTimeDisplay } from '@/shared';

/**
 * FM Email color palette
 */
const FM_EMAIL_COLORS = {
  bgPrimary: '#000000',
  bgSecondary: '#0a0a0a',
  bgCard: '#0d0d0d',
  bgCardInner: '#111111',
  gold: '#dfba7d',
  goldDark: '#c9a365',
  goldLight: '#f0d4a8',
  textPrimary: '#ffffff',
  textSecondary: '#a0a0a0',
  textMuted: '#666666',
  borderGold: '#dfba7d',
  borderSubtle: '#222222',
  white: '#ffffff',
};

interface FmTicketReceiptEmailProps {
  data: OrderReceiptEmailData;
}

/**
 * Generate FM-branded ticket receipt HTML
 */
export const generateFmTicketReceiptEmailHTML = (
  data: OrderReceiptEmailData
): string => {
  const { orderId, orderDate, event, purchaser, orderSummary } = data;

  const colors = FM_EMAIL_COLORS;

  // Format dates
  const formattedOrderDate = new Date(orderDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedEventDate = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const formattedTime = formatTimeDisplay(event.time);

  // Calculate total tickets
  const totalTickets = orderSummary.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  // Build ticket type summary (e.g., "2 GA, 1 VIP")
  const ticketSummary = orderSummary.items
    .map(item => `${item.quantity} ${item.ticketTierName}`)
    .join(', ');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <title>Your Tickets - ${event.title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, 'Times New Roman', serif; background-color: ${colors.bgPrimary}; color: ${colors.textPrimary};">

  <!-- Wrapper Table -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${colors.bgPrimary};">
    <tr>
      <td style="padding: 40px 20px;">

        <!-- Main Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: ${colors.bgSecondary}; border: 1px solid ${colors.borderSubtle};">

          <!-- Gold Top Bar -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, ${colors.gold}, ${colors.goldDark}, ${colors.gold});"></td>
          </tr>

          <!-- Logo Section -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              <img
                src="https://orgxcrnnecblhuxjfruy.supabase.co/storage/v1/object/public/images/FM%20Icon%20(white).png"
                alt="Force Majeure"
                width="140"
                height="42"
                style="display: block; margin: 0 auto;"
              />
            </td>
          </tr>

          <!-- Header Message -->
          <tr>
            <td style="padding: 10px 40px 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: ${colors.gold}; font-size: 26px; font-weight: 400; font-family: Georgia, 'Times New Roman', serif; letter-spacing: 0.5px;">
                Your tickets are ready.
              </h1>
            </td>
          </tr>

          <!-- TICKET CARD -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${colors.bgCard}; border: 1px solid ${colors.borderSubtle};">

                <!-- Event Hero Image -->
                ${
                  event.imageUrl
                    ? `
                <tr>
                  <td style="padding: 20px 20px 15px 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="border: 2px solid ${colors.gold}; padding: 3px;">
                          <img
                            src="${event.imageUrl}"
                            alt="${event.title}"
                            width="100%"
                            style="display: block; width: 100%; height: auto;"
                          />
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                `
                    : ''
                }

                <!-- Event Title -->
                <tr>
                  <td style="padding: 15px 20px 20px 20px; text-align: center;">
                    <h2 style="margin: 0; color: ${colors.gold}; font-size: 24px; font-weight: 400; font-family: Georgia, 'Times New Roman', serif; letter-spacing: 0.5px;">
                      ${event.title}
                    </h2>
                  </td>
                </tr>

                <!-- Perforation Line -->
                <tr>
                  <td style="padding: 0 20px;">
                    <div style="height: 1px; border-bottom: 2px dashed ${colors.borderSubtle};"></div>
                  </td>
                </tr>

                <!-- Event Info Grid -->
                <tr>
                  <td style="padding: 25px 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <!-- Location -->
                        <td width="50%" style="vertical-align: top; padding-right: 10px;">
                          <p style="margin: 0 0 5px 0; color: ${colors.textMuted}; font-size: 11px; font-family: 'Segoe UI', Roboto, Arial, sans-serif; text-transform: uppercase; letter-spacing: 1px;">
                            &#128205; Location
                          </p>
                          <p style="margin: 0; color: ${colors.textPrimary}; font-size: 14px; font-family: 'Segoe UI', Roboto, Arial, sans-serif; font-weight: 500;">
                            ${event.venue.name}
                          </p>
                          <p style="margin: 3px 0 0 0; color: ${colors.textSecondary}; font-size: 12px; font-family: 'Segoe UI', Roboto, Arial, sans-serif;">
                            ${event.venue.city}
                          </p>
                        </td>
                        <!-- Tickets -->
                        <td width="50%" style="vertical-align: top; padding-left: 10px;">
                          <p style="margin: 0 0 5px 0; color: ${colors.textMuted}; font-size: 11px; font-family: 'Segoe UI', Roboto, Arial, sans-serif; text-transform: uppercase; letter-spacing: 1px;">
                            &#127915; Tickets
                          </p>
                          <p style="margin: 0; color: ${colors.textPrimary}; font-size: 14px; font-family: 'Segoe UI', Roboto, Arial, sans-serif; font-weight: 500;">
                            ${totalTickets} ticket${totalTickets > 1 ? 's' : ''}
                          </p>
                          <p style="margin: 3px 0 0 0; color: ${colors.textSecondary}; font-size: 12px; font-family: 'Segoe UI', Roboto, Arial, sans-serif;">
                            ${ticketSummary}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Date & Time Row -->
                <tr>
                  <td style="padding: 0 20px 25px 20px;">
                    <p style="margin: 0 0 5px 0; color: ${colors.textMuted}; font-size: 11px; font-family: 'Segoe UI', Roboto, Arial, sans-serif; text-transform: uppercase; letter-spacing: 1px;">
                      &#128197; Date & Time
                    </p>
                    <p style="margin: 0; color: ${colors.textPrimary}; font-size: 14px; font-family: 'Segoe UI', Roboto, Arial, sans-serif; font-weight: 500;">
                      ${formattedEventDate} &middot; ${formattedTime}
                    </p>
                  </td>
                </tr>

                <!-- Order Number Row -->
                <tr>
                  <td style="padding: 0 20px 25px 20px;">
                    <p style="margin: 0 0 5px 0; color: ${colors.textMuted}; font-size: 11px; font-family: 'Segoe UI', Roboto, Arial, sans-serif; text-transform: uppercase; letter-spacing: 1px;">
                      &#127903; Order Number
                    </p>
                    <p style="margin: 0; color: ${colors.gold}; font-size: 16px; font-family: 'Courier New', monospace; font-weight: 600; letter-spacing: 1px;">
                      ${orderId}
                    </p>
                  </td>
                </tr>

                <!-- Perforation Line -->
                <tr>
                  <td style="padding: 0 20px;">
                    <div style="height: 1px; border-bottom: 2px dashed ${colors.borderSubtle};"></div>
                  </td>
                </tr>

                <!-- QR Code Section -->
                <tr>
                  <td style="padding: 25px 20px; text-align: center;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                      <tr>
                        <td style="background-color: ${colors.white}; padding: 10px;">
                          <!-- QR Code placeholder - actual QR would be generated server-side -->
                          <div style="width: 120px; height: 120px; background-color: ${colors.white}; display: flex; align-items: center; justify-content: center;">
                            <img
                              src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(orderId)}"
                              alt="Ticket QR Code"
                              width="120"
                              height="120"
                              style="display: block;"
                            />
                          </div>
                        </td>
                      </tr>
                    </table>
                    <p style="margin: 15px 0 0 0; color: ${colors.gold}; font-size: 11px; font-family: 'Segoe UI', Roboto, Arial, sans-serif; text-transform: uppercase; letter-spacing: 2px;">
                      Scan at venue entrance
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
          <!-- END TICKET CARD -->

          <!-- ORDER SUMMARY -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${colors.bgCard}; border: 1px solid ${colors.borderSubtle};">

                <!-- Header -->
                <tr>
                  <td style="padding: 20px 20px 15px 20px; border-bottom: 2px solid ${colors.gold};">
                    <h3 style="margin: 0; color: ${colors.gold}; font-size: 14px; font-weight: 600; font-family: 'Segoe UI', Roboto, Arial, sans-serif; text-transform: uppercase; letter-spacing: 1px;">
                      Order Summary
                    </h3>
                    <p style="margin: 5px 0 0 0; color: ${colors.textMuted}; font-size: 12px; font-family: 'Segoe UI', Roboto, Arial, sans-serif;">
                      ${formattedOrderDate}
                    </p>
                  </td>
                </tr>

                <!-- Line Items -->
                ${orderSummary.items
                  .map(
                    item => `
                <tr>
                  <td style="padding: 15px 20px; border-bottom: 1px solid ${colors.borderSubtle};">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="color: ${colors.textPrimary}; font-size: 14px; font-family: 'Segoe UI', Roboto, Arial, sans-serif;">
                          ${item.ticketTierName} &times; ${item.quantity}
                        </td>
                        <td style="text-align: right; color: ${colors.textPrimary}; font-size: 14px; font-family: 'Segoe UI', Roboto, Arial, sans-serif;">
                          $${item.subtotal.toFixed(2)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                `
                  )
                  .join('')}

                <!-- Subtotal -->
                <tr>
                  <td style="padding: 15px 20px 8px 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="color: ${colors.textSecondary}; font-size: 13px; font-family: 'Segoe UI', Roboto, Arial, sans-serif;">
                          Subtotal
                        </td>
                        <td style="text-align: right; color: ${colors.textSecondary}; font-size: 13px; font-family: 'Segoe UI', Roboto, Arial, sans-serif;">
                          $${orderSummary.subtotal.toFixed(2)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Service Fee (if applicable) -->
                ${
                  orderSummary.serviceFee
                    ? `
                <tr>
                  <td style="padding: 8px 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="color: ${colors.textSecondary}; font-size: 13px; font-family: 'Segoe UI', Roboto, Arial, sans-serif;">
                          Service Fee
                        </td>
                        <td style="text-align: right; color: ${colors.textSecondary}; font-size: 13px; font-family: 'Segoe UI', Roboto, Arial, sans-serif;">
                          $${orderSummary.serviceFee.toFixed(2)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                `
                    : ''
                }

                <!-- Processing Fee (if applicable) -->
                ${
                  orderSummary.processingFee
                    ? `
                <tr>
                  <td style="padding: 8px 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="color: ${colors.textSecondary}; font-size: 13px; font-family: 'Segoe UI', Roboto, Arial, sans-serif;">
                          Processing Fee
                        </td>
                        <td style="text-align: right; color: ${colors.textSecondary}; font-size: 13px; font-family: 'Segoe UI', Roboto, Arial, sans-serif;">
                          $${orderSummary.processingFee.toFixed(2)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                `
                    : ''
                }

                <!-- Tax -->
                <tr>
                  <td style="padding: 8px 20px 15px 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="color: ${colors.textSecondary}; font-size: 13px; font-family: 'Segoe UI', Roboto, Arial, sans-serif;">
                          Tax
                        </td>
                        <td style="text-align: right; color: ${colors.textSecondary}; font-size: 13px; font-family: 'Segoe UI', Roboto, Arial, sans-serif;">
                          $${orderSummary.tax.toFixed(2)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Total -->
                <tr>
                  <td style="padding: 15px 20px; border-top: 2px solid ${colors.gold};">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="color: ${colors.textPrimary}; font-size: 16px; font-family: 'Segoe UI', Roboto, Arial, sans-serif; font-weight: 600;">
                          Total
                        </td>
                        <td style="text-align: right; color: ${colors.gold}; font-size: 20px; font-family: Georgia, 'Times New Roman', serif; font-weight: 600;">
                          $${orderSummary.total.toFixed(2)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
          <!-- END ORDER SUMMARY -->

          <!-- CTA Buttons -->
          <tr>
            <td style="padding: 0 30px 30px 30px; text-align: center;">
              <!-- Primary Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto 15px auto;">
                <tr>
                  <td style="background-color: ${colors.gold}; padding: 16px 50px;">
                    <a
                      href="https://forcemajeure.com/wallet"
                      style="color: #000000; text-decoration: none; font-size: 14px; font-weight: 600; font-family: 'Segoe UI', Roboto, Arial, sans-serif; letter-spacing: 1px; text-transform: uppercase;"
                    >
                      VIEW MY TICKETS
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Secondary Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: transparent; border: 1px solid ${colors.borderSubtle}; padding: 14px 40px;">
                    <a
                      href="https://forcemajeure.com/events"
                      style="color: ${colors.textSecondary}; text-decoration: none; font-size: 13px; font-family: 'Segoe UI', Roboto, Arial, sans-serif;"
                    >
                      Browse More Events
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Gold Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="height: 1px; background: linear-gradient(90deg, transparent, ${colors.gold}, transparent);"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; background-color: ${colors.bgPrimary};">
              <p style="margin: 0 0 10px 0; color: ${colors.textSecondary}; font-size: 13px; font-family: 'Segoe UI', Roboto, Arial, sans-serif;">
                Questions? <a href="mailto:support@forcemajeure.com" style="color: ${colors.gold}; text-decoration: none;">support@forcemajeure.com</a>
              </p>
              <p style="margin: 0 0 5px 0; color: ${colors.gold}; font-size: 12px; font-family: Georgia, 'Times New Roman', serif; letter-spacing: 2px;">
                FORCE MAJEURE
              </p>
              <p style="margin: 0 0 10px 0; color: ${colors.textMuted}; font-size: 11px; font-family: 'Segoe UI', Roboto, Arial, sans-serif;">
                Los Angeles &middot; Electronic Music Events
              </p>
              <p style="margin: 0; color: ${colors.textMuted}; font-size: 11px; font-family: 'Segoe UI', Roboto, Arial, sans-serif;">
                &copy; ${new Date().getFullYear()} Force Majeure. All rights reserved.
              </p>
              <p style="margin: 10px 0 0 0; color: ${colors.textMuted}; font-size: 10px; font-family: 'Segoe UI', Roboto, Arial, sans-serif;">
                This email was sent to ${purchaser.email} regarding your ticket purchase.
              </p>
            </td>
          </tr>

          <!-- Gold Bottom Bar -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, ${colors.gold}, ${colors.goldDark}, ${colors.gold});"></td>
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
export const FmTicketReceiptEmail = ({ data }: FmTicketReceiptEmailProps) => {
  const html = generateFmTicketReceiptEmailHTML(data);

  return (
    <div
      dangerouslySetInnerHTML={{ __html: html }}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

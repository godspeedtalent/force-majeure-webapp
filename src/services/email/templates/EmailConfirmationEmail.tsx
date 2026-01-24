/**
 * EmailConfirmationEmail - FM-branded email verification template
 *
 * Sent during signup for email verification.
 * Uses dark aesthetic with gold accents matching FM brand.
 */

import type { EmailConfirmationData } from '@/types/email';

/**
 * FM Email color palette
 */
const FM_EMAIL_COLORS = {
  bgPrimary: '#000000',
  bgSecondary: '#0a0a0a',
  bgCard: '#0d0d0d',
  gold: '#dfba7d',
  goldDark: '#c9a365',
  textPrimary: '#ffffff',
  textSecondary: '#a0a0a0',
  textMuted: '#666666',
  borderGold: '#dfba7d',
  borderSubtle: '#222222',
};

/**
 * Generate email confirmation HTML
 */
export const generateEmailConfirmationHTML = (
  data: EmailConfirmationData
): string => {
  const { userName, userEmail, confirmationUrl, expiresInHours = 24 } = data;

  const colors = FM_EMAIL_COLORS;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <title>Verify Your Email - Force Majeure</title>
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

          <!-- Gold Divider -->
          <tr>
            <td style="padding: 0 60px;">
              <div style="height: 1px; background: linear-gradient(90deg, transparent, ${colors.gold}, transparent);"></div>
            </td>
          </tr>

          <!-- Welcome Message -->
          <tr>
            <td style="padding: 30px 40px 10px 40px; text-align: center;">
              <h1 style="margin: 0; color: ${colors.gold}; font-size: 28px; font-weight: 400; font-family: Georgia, 'Times New Roman', serif; letter-spacing: 0.5px;">
                Welcome to the experience.
              </h1>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 20px 40px 30px 40px; text-align: center;">
              <p style="margin: 0 0 20px 0; color: ${colors.textPrimary}; font-size: 16px; line-height: 1.6; font-family: 'Segoe UI', Roboto, Arial, sans-serif;">
                Hi ${userName || 'there'},
              </p>
              <p style="margin: 0 0 30px 0; color: ${colors.textSecondary}; font-size: 15px; line-height: 1.6; font-family: 'Segoe UI', Roboto, Arial, sans-serif;">
                Please verify your email address to complete your Force Majeure account setup.
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: ${colors.gold}; padding: 16px 40px;">
                    <a
                      href="${confirmationUrl}"
                      style="color: #000000; text-decoration: none; font-size: 14px; font-weight: 600; font-family: 'Segoe UI', Roboto, Arial, sans-serif; letter-spacing: 1px; text-transform: uppercase;"
                    >
                      VERIFY EMAIL
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiration Notice -->
              <p style="margin: 30px 0 0 0; color: ${colors.textMuted}; font-size: 13px; font-family: 'Segoe UI', Roboto, Arial, sans-serif;">
                This link expires in ${expiresInHours} hours.
              </p>
            </td>
          </tr>

          <!-- Alternative Link -->
          <tr>
            <td style="padding: 0 40px 30px 40px; text-align: center;">
              <p style="margin: 0; color: ${colors.textMuted}; font-size: 12px; font-family: 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 10px 0 0 0; word-break: break-all;">
                <a href="${confirmationUrl}" style="color: ${colors.gold}; font-size: 11px; font-family: monospace;">${confirmationUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Security Notice -->
          <tr>
            <td style="padding: 0 40px 30px 40px; text-align: center;">
              <p style="margin: 0; color: ${colors.textMuted}; font-size: 12px; font-family: 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6;">
                If you didn't create a Force Majeure account, you can safely ignore this email.
              </p>
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
                This email was sent to ${userEmail}
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
interface EmailConfirmationEmailProps {
  data: EmailConfirmationData;
}

export const EmailConfirmationEmail = ({
  data,
}: EmailConfirmationEmailProps) => {
  const html = generateEmailConfirmationHTML(data);

  return (
    <div
      dangerouslySetInnerHTML={{ __html: html }}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

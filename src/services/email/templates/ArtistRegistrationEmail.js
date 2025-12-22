export const generateArtistRegistrationEmailHTML = (data) => {
    const { artistName, city, genres, registrationDate } = data;
    // Color palette matching Force Majeure brand
    const colors = {
        gold: '#DAA520',
        black: '#000000',
        white: '#FFFFFF',
        lightGray: '#F5F5F5',
        darkGray: '#333333',
        borderGray: '#E0E0E0',
        mutedText: '#6B7280',
    };
    // Format date for display
    const formattedDate = new Date(registrationDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    const genreList = genres.length > 0 ? genres.join(', ') : 'Not specified';
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Artist Registration Received - Force Majeure</title>
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
            <td style="background-color: ${colors.black}; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: ${colors.gold}; font-size: 28px; font-weight: 700; letter-spacing: 0.5px;">
                FORCE MAJEURE
              </h1>
              <p style="margin: 10px 0 0 0; color: ${colors.white}; font-size: 14px;">
                Artist Registration Received
              </p>
            </td>
          </tr>

          <!-- Success Message -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              <div style="width: 60px; height: 60px; margin: 0 auto 20px auto; border-radius: 50%; background-color: ${colors.gold}; display: flex; align-items: center; justify-content: center;">
                <span style="color: ${colors.black}; font-size: 32px; line-height: 1;">🎵</span>
              </div>
              <h2 style="margin: 0 0 10px 0; color: ${colors.darkGray}; font-size: 24px; font-weight: 600;">
                Welcome to the FM Fam, ${artistName}!
              </h2>
              <p style="margin: 0; color: ${colors.mutedText}; font-size: 14px;">
                Your artist registration has been received and is now under review.
              </p>
            </td>
          </tr>

          <!-- Registration Details -->
          <tr>
            <td style="padding: 20px 40px 30px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${colors.lightGray}; border-radius: 8px; padding: 20px;">
                <tr>
                  <td>
                    <h3 style="margin: 0 0 15px 0; color: ${colors.darkGray}; font-size: 18px; font-weight: 600;">
                      Registration Details
                    </h3>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding-bottom: 8px; color: ${colors.mutedText}; font-size: 14px;">
                          <strong style="color: ${colors.darkGray};">🎤 Artist Name:</strong> ${artistName}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 8px; color: ${colors.mutedText}; font-size: 14px;">
                          <strong style="color: ${colors.darkGray};">📍 City:</strong> ${city}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-bottom: 8px; color: ${colors.mutedText}; font-size: 14px;">
                          <strong style="color: ${colors.darkGray};">🎶 Genres:</strong> ${genreList}
                        </td>
                      </tr>
                      <tr>
                        <td style="color: ${colors.mutedText}; font-size: 14px;">
                          <strong style="color: ${colors.darkGray};">📅 Submitted:</strong> ${formattedDate}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- What's Next Section -->
          <tr>
            <td style="padding: 0 40px 30px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border: 1px solid ${colors.borderGray}; border-radius: 8px; padding: 20px;">
                <tr>
                  <td>
                    <h3 style="margin: 0 0 15px 0; color: ${colors.darkGray}; font-size: 18px; font-weight: 600;">
                      What Happens Next?
                    </h3>
                    <ol style="margin: 0; padding-left: 20px; color: ${colors.mutedText}; font-size: 14px; line-height: 1.8;">
                      <li>Our team will review your submission</li>
                      <li>We'll listen to your music and check out your socials</li>
                      <li>If your sound is a good fit, we'll reach out about upcoming events</li>
                    </ol>
                    <p style="margin: 15px 0 0 0; color: ${colors.mutedText}; font-size: 13px; font-style: italic;">
                      Note: Due to the volume of submissions, we may not be able to respond to everyone. If you don't hear back within 4-6 weeks, feel free to reapply for future events.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Section -->
          <tr>
            <td style="padding: 0 40px 30px 40px; text-align: center;">
              <p style="margin: 0 0 15px 0; color: ${colors.mutedText}; font-size: 14px;">
                In the meantime, follow us to stay updated on upcoming events:
              </p>
              <a href="https://www.instagram.com/forcemajeureatx/" style="display: inline-block; padding: 12px 30px; background-color: ${colors.black}; color: ${colors.gold}; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 14px;">
                Follow @forcemajeureatx
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: ${colors.lightGray}; padding: 25px 40px; text-align: center; border-top: 1px solid ${colors.borderGray};">
              <p style="margin: 0 0 10px 0; color: ${colors.mutedText}; font-size: 12px;">
                Questions? Contact us at <a href="mailto:management@forcemajeure.vip" style="color: ${colors.gold};">management@forcemajeure.vip</a>
              </p>
              <p style="margin: 0; color: ${colors.mutedText}; font-size: 11px;">
                © ${new Date().getFullYear()} Force Majeure. All rights reserved.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `.trim();
};

/**
 * Notification utilities for artist screening
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface DecisionNotificationParams {
  artistName: string;
  artistEmail: string;
  status: 'approved' | 'rejected';
  notes?: string;
}

/**
 * Send decision notification email to artist
 * Uses the send-email edge function
 */
export async function sendDecisionNotification(
  supabase: SupabaseClient,
  params: DecisionNotificationParams
): Promise<void> {
  const { artistName, artistEmail, status, notes } = params;

  // Generate email content
  const subject =
    status === 'approved'
      ? '🎉 Your Artist Submission Has Been Approved!'
      : 'Artist Submission Update';

  const html = generateDecisionEmailHtml(artistName, status, notes);

  // Call send-email edge function
  const { error } = await supabase.functions.invoke('send-email', {
    body: {
      to: [artistEmail],
      subject,
      html,
    },
  });

  if (error) {
    throw error;
  }
}

/**
 * Generate HTML email content for decision notification
 */
function generateDecisionEmailHtml(
  artistName: string,
  status: 'approved' | 'rejected',
  notes?: string
): string {
  const isApproved = status === 'approved';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 40px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: ${isApproved ? '#dfba7d' : '#545E75'};
      margin-bottom: 20px;
    }
    .status {
      display: inline-block;
      padding: 10px 20px;
      border-radius: 4px;
      font-weight: 600;
      color: #ffffff;
      background-color: ${isApproved ? '#28a745' : '#dc3545'};
      margin-bottom: 20px;
    }
    .greeting {
      font-size: 18px;
      margin-bottom: 20px;
    }
    .message {
      margin-bottom: 20px;
      line-height: 1.8;
    }
    .notes {
      background-color: #f8f9fa;
      border-left: 4px solid ${isApproved ? '#dfba7d' : '#6c757d'};
      padding: 15px;
      margin: 20px 0;
      font-style: italic;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e9ecef;
      text-align: center;
      font-size: 14px;
      color: #6c757d;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #dfba7d;
      color: #000000;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 600;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">FORCE MAJEURE</div>
      <div class="status">${isApproved ? 'APPROVED ✓' : 'UPDATE'}</div>
    </div>

    <div class="greeting">
      Hi ${artistName},
    </div>

    <div class="message">
      ${
        isApproved
          ? `
        <p>Great news! Your artist submission has been approved by our team.</p>
        <p>We're excited to have you in our lineup. Our team will be in touch soon with next steps regarding upcoming events and booking opportunities.</p>
      `
          : `
        <p>Thank you for submitting your artist profile to Force Majeure. After careful review, we've decided not to move forward at this time.</p>
        <p>We appreciate your interest and encourage you to keep creating. Our roster needs evolve over time, and we hope you'll consider submitting again in the future.</p>
      `
      }
    </div>

    ${
      notes
        ? `
      <div class="notes">
        <strong>Notes from our team:</strong><br>
        ${notes}
      </div>
    `
        : ''
    }

    <div class="message">
      ${
        isApproved
          ? `
        <p>In the meantime, make sure your profile is complete and up to date. Feel free to reach out if you have any questions.</p>
        <p>Welcome to the Force Majeure family! 🎉</p>
      `
          : `
        <p>Best of luck with your music, and thank you again for your submission.</p>
      `
      }
    </div>

    <div class="footer">
      <p><strong>Force Majeure</strong></p>
      <p>Electronic Music Events & Artist Management</p>
      <p style="font-size: 12px; color: #adb5bd; margin-top: 10px;">
        This is an automated notification. Please do not reply to this email.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

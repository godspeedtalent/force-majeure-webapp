import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Resend } from 'npm:resend@2.0.0';
import { getCorsHeaders, handleCorsPreflightRequest, isOriginAllowed, createForbiddenResponse } from '../_shared/cors.ts';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

interface EmailRequest {
  to: string[];
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string; // base64 encoded
  }>;
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

  // Check origin for non-preflight requests
  if (!isOriginAllowed(origin)) {
    return createForbiddenResponse();
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    // Get email sender from environment variable
    const emailFrom = Deno.env.get('EMAIL_FROM');
    if (!emailFrom) {
      throw new Error('EMAIL_FROM is not configured. Set to your verified Resend domain (e.g., "Force Majeure <noreply@forcemajeure.com>")');
    }

    const { to, subject, html, attachments }: EmailRequest = await req.json();

    console.log('Sending email via Resend:', { to, subject, hasAttachments: !!attachments });

    const emailResponse = await resend.emails.send({
      from: emailFrom,
      to,
      subject,
      html,
      attachments: attachments?.map(att => ({
        filename: att.filename,
        content: att.content,
      })),
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({ success: true, result: emailResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Resend } from 'https://esm.sh/resend@2.0.0';
import { getCorsHeaders, handleCorsPreflightRequest, isOriginAllowed, createForbiddenResponse } from '../_shared/cors.ts';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

interface ContactFormRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
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

    const emailFrom = Deno.env.get('EMAIL_FROM');
    if (!emailFrom) {
      throw new Error('EMAIL_FROM is not configured');
    }

    const { name, email, subject, message }: ContactFormRequest = await req.json();

    // Validate required fields
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid email address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Sending contact form email:', { name, email, subject });

    // Send email to management
    const emailResponse = await resend.emails.send({
      from: emailFrom,
      to: ['management@forcemajeure.vip'],
      replyTo: email,
      subject: `[Contact Form] ${subject || 'New Message'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dfba7d; border-bottom: 1px solid #333; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>

          <div style="margin: 20px 0;">
            <p><strong>From:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Subject:</strong> ${subject || 'No subject provided'}</p>
          </div>

          <div style="background-color: #1a1a1a; padding: 20px; border-left: 3px solid #dfba7d; margin: 20px 0;">
            <h3 style="color: #dfba7d; margin-top: 0;">Message:</h3>
            <p style="color: #fff; white-space: pre-wrap;">${message}</p>
          </div>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This email was sent from the Force Majeure contact form.
            Reply directly to this email to respond to ${name}.
          </p>
        </div>
      `,
    });

    console.log('Contact email sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({ success: true, result: emailResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error sending contact email:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

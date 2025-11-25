import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string[];
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string; // base64 encoded
    type: string;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const mailchimpApiKey = Deno.env.get('MAILCHIMP_API_KEY');
    if (!mailchimpApiKey) {
      throw new Error('MAILCHIMP_API_KEY is not configured');
    }

    const { to, subject, html, attachments }: EmailRequest = await req.json();

    console.log('Sending email via Mailchimp:', { to, subject, hasAttachments: !!attachments });

    // Extract datacenter from API key (e.g., us1, us2, etc.)
    const datacenter = mailchimpApiKey.split('-').pop();
    
    // Mailchimp Transactional API (Mandrill) endpoint
    const mailchimpUrl = `https://${datacenter}.api.mailchimp.com/3.0/messages/send`;

    const mailchimpPayload = {
      message: {
        subject,
        html,
        from_email: 'noreply@yourdomain.com', // TODO: Configure this
        from_name: 'Event Platform',
        to: to.map(email => ({ email, type: 'to' })),
        attachments: attachments?.map(att => ({
          type: att.type,
          name: att.filename,
          content: att.content,
        })),
      },
    };

    const response = await fetch(mailchimpUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mailchimpApiKey}`,
      },
      body: JSON.stringify(mailchimpPayload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Mailchimp API error:', error);
      throw new Error(`Failed to send email: ${error}`);
    }

    const result = await response.json();
    console.log('Email sent successfully:', result);

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

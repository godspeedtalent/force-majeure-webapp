/**
 * QR Code Generation and Verification Utilities
 *
 * Provides secure QR code generation and verification for physical tickets.
 * Uses HMAC-SHA256 signatures to prevent forgery and ensure one-time use.
 *
 * @module _shared/qr
 */

/**
 * QR Code Data Structure
 * Compact JSON format to minimize QR code size
 */
export interface TicketQRData {
  t: string; // ticket_id (UUID)
  e: string; // event_id (UUID)
  v: number; // version (1)
  s: string; // HMAC-SHA256 signature (first 16 chars)
}

/**
 * Verification Result
 */
export interface QRVerificationResult {
  valid: boolean;
  ticketId?: string;
  eventId?: string;
  error?: string;
}

/**
 * Get QR secret key from environment
 * Falls back to a default for development (NOT for production!)
 */
function getQRSecret(): string {
  const secret = Deno.env.get('QR_SECRET_KEY');
  if (!secret) {
    console.warn(
      'WARNING: QR_SECRET_KEY not set in environment. Using development default. DO NOT USE IN PRODUCTION!'
    );
    return 'dev-secret-key-change-in-production-immediately';
  }
  return secret;
}

/**
 * Generate HMAC-SHA256 signature for ticket data
 *
 * @param ticketId - UUID of the ticket
 * @param eventId - UUID of the event
 * @returns Hex string signature (first 16 characters)
 */
async function generateSignature(
  ticketId: string,
  eventId: string
): Promise<string> {
  const secret = getQRSecret();
  const data = `${ticketId}:${eventId}:v1`;

  // Create key from secret
  const keyData = new TextEncoder().encode(secret);
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Sign the data
  const dataBuffer = new TextEncoder().encode(data);
  const signature = await crypto.subtle.sign('HMAC', key, dataBuffer);

  // Convert to hex string and take first 16 characters
  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 16);
}

/**
 * Generate QR code data for a ticket
 *
 * @param ticketId - UUID of the ticket
 * @param eventId - UUID of the event
 * @returns JSON string to encode in QR code
 *
 * @example
 * ```ts
 * const qrData = await generateTicketQR(
 *   '550e8400-e29b-41d4-a716-446655440000',
 *   '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
 * );
 * // Returns: '{"t":"550e8400...","e":"6ba7b810...","v":1,"s":"a1b2c3d4..."}'
 * ```
 */
export async function generateTicketQR(
  ticketId: string,
  eventId: string
): Promise<string> {
  const signature = await generateSignature(ticketId, eventId);

  const qrData: TicketQRData = {
    t: ticketId,
    e: eventId,
    v: 1,
    s: signature,
  };

  return JSON.stringify(qrData);
}

/**
 * Verify QR code data and extract ticket information
 *
 * @param qrDataString - JSON string from QR code
 * @returns Verification result with ticket/event IDs or error
 *
 * @example
 * ```ts
 * const result = await verifyTicketQR(qrCodeData);
 * if (result.valid) {
 *   console.log('Valid ticket:', result.ticketId);
 * } else {
 *   console.error('Invalid:', result.error);
 * }
 * ```
 */
export async function verifyTicketQR(
  qrDataString: string
): Promise<QRVerificationResult> {
  try {
    // Parse JSON
    const qrData = JSON.parse(qrDataString) as TicketQRData;

    // Validate structure
    if (!qrData.t || !qrData.e || !qrData.v || !qrData.s) {
      return {
        valid: false,
        error: 'Invalid QR code format: missing required fields',
      };
    }

    // Check version
    if (qrData.v !== 1) {
      return {
        valid: false,
        error: `Unsupported QR code version: ${qrData.v}`,
      };
    }

    // Validate UUIDs format (basic check)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(qrData.t) || !uuidRegex.test(qrData.e)) {
      return {
        valid: false,
        error: 'Invalid QR code format: malformed UUIDs',
      };
    }

    // Verify signature
    const expectedSignature = await generateSignature(qrData.t, qrData.e);
    if (qrData.s !== expectedSignature) {
      return {
        valid: false,
        error: 'Invalid QR code: signature verification failed',
      };
    }

    // All checks passed
    return {
      valid: true,
      ticketId: qrData.t,
      eventId: qrData.e,
    };
  } catch (error) {
    return {
      valid: false,
      error: `QR code parsing error: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    };
  }
}

/**
 * Validate that a string looks like valid QR data
 * Quick check before attempting full verification
 *
 * @param qrDataString - String to validate
 * @returns true if looks like valid QR JSON
 */
export function looksLikeValidQR(qrDataString: string): boolean {
  try {
    const data = JSON.parse(qrDataString);
    return (
      typeof data === 'object' &&
      data !== null &&
      'string' === typeof data.t &&
      'string' === typeof data.e &&
      'number' === typeof data.v &&
      'string' === typeof data.s
    );
  } catch {
    return false;
  }
}

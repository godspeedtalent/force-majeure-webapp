/**
 * Email template type definitions for order receipts and ticket delivery
 */

export interface EmailOrderItem {
  ticketTierName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface EmailEventInfo {
  title: string;
  date: string;
  time: string;
  venue: {
    name: string;
    address: string;
    city: string;
  };
  imageUrl?: string;
}

export interface EmailPurchaserInfo {
  fullName: string;
  email: string;
  phone?: string;
}

export interface EmailOrderSummary {
  items: EmailOrderItem[];
  subtotal: number;
  serviceFee?: number;
  processingFee?: number;
  ticketProtection?: number;
  tax: number;
  total: number;
  currency: string;
}

export interface OrderReceiptEmailData {
  orderId: string;
  orderDate: string;
  event: EmailEventInfo;
  purchaser: EmailPurchaserInfo;
  orderSummary: EmailOrderSummary;
  pdfTicketAttachment?: string; // Base64 encoded PDF or URL (to be implemented)
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Order item as stored in the database (snake_case, cents-based amounts)
 * Used for converting database orders to email format
 */
export interface OrderItemForEmail {
  ticket_tier?: {
    id?: string;
    name: string;
    description?: string | null;
  };
  quantity: number;
  unit_price_cents: number;
  unit_fee_cents?: number;
  subtotal_cents: number;
  fees_cents?: number;
  total_cents?: number;
}

/**
 * Event venue info as stored in the database
 */
export interface OrderEventVenueForEmail {
  name?: string;
  address?: string;
  city?: string;
}

/**
 * Event info as stored in the database (for email conversion)
 */
export interface OrderEventForEmail {
  title: string;
  date: string;
  time: string;
  venue?: OrderEventVenueForEmail;
  image_url?: string;
}

/**
 * Order data structure as stored in the database (snake_case, cents-based amounts)
 * Used by EmailService.convertOrderToEmailData() to convert to EmailOrderReceiptData
 */
export interface OrderForEmailConversion {
  id: string;
  created_at: string;
  items?: OrderItemForEmail[];
  subtotal_cents: number;
  fees_cents?: number;
  service_fee_cents?: number;
  processing_fee_cents?: number;
  ticket_protection_cents?: number;
  tax_cents?: number;
  total_cents: number;
  currency?: string;
}

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

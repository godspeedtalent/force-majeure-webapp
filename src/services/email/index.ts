/**
 * Email services index
 * Exports all email-related services and utilities
 */

export { EmailService } from './EmailService';
export { TicketPDFService } from './TicketPDFService';
export { generateOrderReceiptEmailHTML, OrderReceiptEmail } from './templates/OrderReceiptEmail';
export type { TicketPDFOptions } from './TicketPDFService';

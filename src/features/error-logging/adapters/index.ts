/**
 * Error Logging Adapters
 *
 * Export all adapter implementations for error logging.
 */

export type { ErrorLogAdapter, AdapterResult } from './ErrorLogAdapter';
export { NoOpErrorLogAdapter, ConsoleErrorLogAdapter } from './ErrorLogAdapter';
export { SupabaseErrorLogAdapter } from './SupabaseErrorLogAdapter';

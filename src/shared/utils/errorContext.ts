/**
 * Error Context Utility
 *
 * Extracts comprehensive contextual information from errors for debugging
 * and staff note creation. Captures runtime details like page URL, edge functions,
 * parameters, and stack traces.
 */

export interface ErrorContextInfo {
  /** Error message */
  errorMessage: string;

  /** Full stack trace (if available) */
  stackTrace?: string;

  /** Current page URL */
  pageUrl: string;

  /** Current route path */
  routePath: string;

  /** Browser and OS information */
  userAgent: string;

  /** Timestamp when error occurred */
  timestamp: string;

  /** Edge function or API endpoint called (if provided) */
  endpoint?: string;

  /** HTTP method used (if provided) */
  method?: string;

  /** Additional context provided by caller */
  context?: string;

  /** Error details object (if available) */
  details?: Record<string, unknown>;

  /** HTTP status code (if available) */
  status?: number;
}

/**
 * Extract comprehensive error context for debugging
 */
export function extractErrorContext(
  error: unknown,
  options?: {
    context?: string;
    endpoint?: string;
    method?: string;
    additionalInfo?: Record<string, unknown>;
  }
): ErrorContextInfo {
  const errorObj = error instanceof Error ? error : new Error(String(error));

  const contextInfo: ErrorContextInfo = {
    errorMessage: errorObj.message,
    stackTrace: errorObj.stack,
    pageUrl: window.location.href,
    routePath: window.location.pathname,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    context: options?.context,
    endpoint: options?.endpoint,
    method: options?.method,
  };

  // Extract additional details from error object
  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>;

    // Supabase/PostgrestError format
    if ('details' in err) {
      contextInfo.details = err.details as Record<string, unknown>;
    }

    // HTTP status code
    if ('status' in err && typeof err.status === 'number') {
      contextInfo.status = err.status;
    }

    // Additional error properties
    if ('code' in err || 'statusText' in err || 'body' in err) {
      contextInfo.details = {
        ...contextInfo.details,
        code: err.code,
        statusText: err.statusText,
        body: err.body,
      };
    }
  }

  // Add any additional info provided
  if (options?.additionalInfo) {
    contextInfo.details = {
      ...contextInfo.details,
      ...options.additionalInfo,
    };
  }

  return contextInfo;
}

/**
 * Format error context as a readable string for staff notes
 */
export function formatErrorContextForNote(contextInfo: ErrorContextInfo): string {
  const sections: string[] = [];

  // Error summary
  sections.push('## Error Summary');
  sections.push(`**Message:** ${contextInfo.errorMessage}`);
  if (contextInfo.status) {
    sections.push(`**Status Code:** ${contextInfo.status}`);
  }
  sections.push('');

  // Location details
  sections.push('## Location');
  sections.push(`**Page:** ${contextInfo.pageUrl}`);
  sections.push(`**Route:** ${contextInfo.routePath}`);
  sections.push(`**Timestamp:** ${contextInfo.timestamp}`);
  sections.push('');

  // API details (if available)
  if (contextInfo.endpoint || contextInfo.method || contextInfo.context) {
    sections.push('## API Details');
    if (contextInfo.endpoint) {
      sections.push(`**Endpoint:** ${contextInfo.endpoint}`);
    }
    if (contextInfo.method) {
      sections.push(`**Method:** ${contextInfo.method}`);
    }
    if (contextInfo.context) {
      sections.push(`**Context:** ${contextInfo.context}`);
    }
    sections.push('');
  }

  // Additional details
  if (contextInfo.details && Object.keys(contextInfo.details).length > 0) {
    sections.push('## Additional Details');
    sections.push('```json');
    sections.push(JSON.stringify(contextInfo.details, null, 2));
    sections.push('```');
    sections.push('');
  }

  // Stack trace
  if (contextInfo.stackTrace) {
    sections.push('## Stack Trace');
    sections.push('```');
    sections.push(contextInfo.stackTrace);
    sections.push('```');
    sections.push('');
  }

  // Environment details
  sections.push('## Environment');
  sections.push(`**User Agent:** ${contextInfo.userAgent}`);

  return sections.join('\n');
}

/**
 * Generate a descriptive title for a staff note from error context
 */
export function generateErrorNoteTitle(contextInfo: ErrorContextInfo): string {
  const parts: string[] = ['Error'];

  // Add endpoint/context if available
  if (contextInfo.endpoint) {
    const endpointName = contextInfo.endpoint.split('/').pop() || contextInfo.endpoint;
    parts.push(`in ${endpointName}`);
  } else if (contextInfo.context) {
    parts.push(`in ${contextInfo.context}`);
  }

  // Add route for context
  if (contextInfo.routePath && contextInfo.routePath !== '/') {
    parts.push(`on ${contextInfo.routePath}`);
  }

  return parts.join(' ');
}

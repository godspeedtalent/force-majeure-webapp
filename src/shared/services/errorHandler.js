/**
 * Centralized Error Handling Service
 *
 * Provides a consistent way to handle errors throughout the application.
 * For developers/admins, shows detailed error information with copyable content.
 * For regular users, shows user-friendly error messages.
 *
 * Usage:
 * ```ts
 * import { handleError } from '@/shared/services/errorHandler';
 *
 * try {
 *   await someApiCall();
 * } catch (error) {
 *   handleError(error, {
 *     title: 'Failed to Save',
 *     context: 'Saving user profile'
 *   });
 * }
 * ```
 */
import { showErrorToast } from '@/components/common/feedback/FmErrorToast';
import { logApiError } from '@/shared';
import { logger } from '@/shared';
/**
 * Check if user is a developer or admin
 *
 * ✅ SECURITY FIX: Only accepts explicitly passed role from server-side verification
 * Never checks localStorage to prevent client-side privilege escalation
 */
function isDeveloperOrAdmin(userRole) {
    // Only trust roles explicitly passed from server-verified sources
    return userRole === 'developer' || userRole === 'admin';
}
/**
 * Check if error is a network/server connection error
 */
function isNetworkError(error) {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        return (message.includes('failed to fetch') ||
            message.includes('network request failed') ||
            message.includes('network error') ||
            message.includes('connection refused') ||
            message.includes('econnrefused') ||
            message.includes('timeout') ||
            message.includes('network timeout'));
    }
    if (error && typeof error === 'object') {
        const err = error;
        // Check for fetch errors
        if (err.name === 'TypeError' && err.message?.includes('fetch')) {
            return true;
        }
        // Check for network status codes
        if (err.status === 0 || err.status === 503 || err.status === 504) {
            return true;
        }
    }
    return false;
}
/**
 * Extract error details from various error types
 */
function extractErrorDetails(error) {
    const networkError = isNetworkError(error);
    // Network/Server connection errors get special treatment
    if (networkError) {
        return {
            message: 'Unable to connect to server',
            details: 'The server appears to be offline or unreachable. Please check your connection or try again later.',
            isNetworkError: true,
        };
    }
    // Standard Error object
    if (error instanceof Error) {
        return {
            message: error.message,
            stack: error.stack,
        };
    }
    // Supabase error format
    if (error && typeof error === 'object') {
        const err = error;
        // PostgrestError format
        if (err.message && err.details) {
            return {
                message: err.message,
                details: err.details,
                status: err.code,
            };
        }
        // HTTP Response error
        if (err.status && err.statusText) {
            return {
                message: err.statusText || 'Request failed',
                status: err.status,
                details: err.body || err.data,
            };
        }
        // Generic error object
        if (err.error || err.message) {
            return {
                message: err.error || err.message || 'Unknown error',
                details: err.details,
                status: err.status,
            };
        }
    }
    // String error
    if (typeof error === 'string') {
        return {
            message: error,
        };
    }
    // Unknown error type
    return {
        message: 'An unexpected error occurred',
        details: error,
    };
}
/**
 * Build response body for developer display
 */
function buildResponseBody(errorDetails) {
    const parts = [];
    if (errorDetails.message) {
        parts.push(`Message: ${errorDetails.message}`);
    }
    if (errorDetails.status) {
        parts.push(`Status: ${errorDetails.status}`);
    }
    if (errorDetails.details) {
        parts.push(`Details: ${JSON.stringify(errorDetails.details, null, 2)}`);
    }
    if (errorDetails.stack) {
        parts.push(`\nStack Trace:\n${errorDetails.stack}`);
    }
    return parts.join('\n');
}
/**
 * Main error handler function
 *
 * @param error - The error that occurred
 * @param options - Configuration options
 */
export async function handleError(error, options) {
    const { title, description, context, endpoint, method, showToast = true, logError = true, userRole, } = options;
    const isDev = isDeveloperOrAdmin(userRole);
    const errorDetails = extractErrorDetails(error);
    // Log to console for debugging
    logger.error(`[ErrorHandler] ${title}:`, { error });
    if (context) {
        logger.error(`[ErrorHandler] Context: ${context}`);
    }
    // Log to backend if enabled (skip if network error to prevent cascade)
    if (logError && !errorDetails.isNetworkError) {
        try {
            await logApiError({
                level: 'error',
                source: 'client',
                endpoint: endpoint || context || 'unknown',
                method: method || 'UNKNOWN',
                status: errorDetails.status,
                message: `${title}: ${errorDetails.message}`,
                details: {
                    description,
                    context,
                    errorDetails: errorDetails.details,
                    stack: errorDetails.stack,
                },
            });
        }
        catch (logErr) {
            // Silently fail if logging fails
            logger.error('[ErrorHandler] Failed to log error:', { error: logErr });
        }
    }
    // Show toast notification if enabled
    if (showToast) {
        const errorObject = new Error(errorDetails.message);
        if (errorDetails.stack) {
            errorObject.stack = errorDetails.stack;
        }
        // Build enhanced description
        let finalDescription = description || errorDetails.message;
        // Special handling for network errors
        if (errorDetails.isNetworkError) {
            if (isDev) {
                finalDescription = `${errorDetails.message}\n\n${errorDetails.details}\n\n💡 Tip: Check if Supabase is running locally (npx supabase start)`;
            }
            else {
                finalDescription = `${errorDetails.details}\n\nWe're working to resolve this issue. Please try again in a few moments.`;
            }
        }
        else if (isDev && errorDetails.details) {
            // Build enhanced description for developers on other errors
            const responseBody = buildResponseBody(errorDetails);
            finalDescription = `${description || errorDetails.message}\n\nResponse:\n${responseBody}`;
        }
        showErrorToast({
            title,
            description: finalDescription,
            error: errorObject,
            isDeveloper: isDev,
            context,
            endpoint,
            method,
        });
    }
}
/**
 * Async wrapper that catches and handles errors
 *
 * Usage:
 * ```ts
 * const result = await withErrorHandler(
 *   async () => await supabase.from('events').select(),
 *   { title: 'Failed to load events' }
 * );
 * ```
 */
export async function withErrorHandler(fn, options) {
    try {
        return await fn();
    }
    catch (error) {
        await handleError(error, options);
        return null;
    }
}
/**
 * Sync wrapper that catches and handles errors
 */
export function withErrorHandlerSync(fn, options) {
    try {
        return fn();
    }
    catch (error) {
        handleError(error, options);
        return null;
    }
}

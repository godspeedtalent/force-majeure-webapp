/**
 * Shared response utilities for Edge Functions
 *
 * Provides standardized response formatting for success and error cases.
 */

import { ZodError } from 'https://deno.land/x/zod/mod.ts';

/**
 * Create successful JSON response with standardized format
 *
 * Response format:
 * {
 *   success: true,
 *   data: <your data>
 * }
 */
export function createSuccessResponse(
  data: unknown,
  corsHeaders: Record<string, string>,
  status = 200
): Response {
  return new Response(
    JSON.stringify({
      success: true,
      data,
    }),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Create error JSON response with standardized format
 *
 * Response format:
 * {
 *   success: false,
 *   error: <error message>,
 *   requestId: <uuid>
 * }
 */
export function createErrorResponse(
  message: string,
  status: number,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
      requestId: crypto.randomUUID(),
    }),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Create validation error response from Zod errors
 *
 * Response format:
 * {
 *   success: false,
 *   error: "Validation failed",
 *   errors: [
 *     { field: "email", message: "Invalid email" },
 *     ...
 *   ],
 *   requestId: <uuid>
 * }
 */
export function createValidationErrorResponse(
  zodError: ZodError,
  corsHeaders: Record<string, string>
): Response {
  const errors = zodError.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  return new Response(
    JSON.stringify({
      success: false,
      error: 'Validation failed',
      errors,
      requestId: crypto.randomUUID(),
    }),
    {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Helper to handle errors and return appropriate response
 * Automatically handles different error types (Zod, standard errors)
 */
export function handleError(
  error: unknown,
  corsHeaders: Record<string, string>
): Response {
  console.error('Edge function error:', error);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return createValidationErrorResponse(error, corsHeaders);
  }

  // Handle standard errors
  if (error instanceof Error) {
    // Check for specific error types
    if (error.message.includes('Unauthorized')) {
      return createErrorResponse(error.message, 401, corsHeaders);
    }
    if (error.message.includes('Forbidden')) {
      return createErrorResponse(error.message, 403, corsHeaders);
    }
    if (error.message.includes('Not found')) {
      return createErrorResponse(error.message, 404, corsHeaders);
    }

    // Default to 500 for unknown errors
    return createErrorResponse(error.message, 500, corsHeaders);
  }

  // Unknown error type
  return createErrorResponse(
    'An unexpected error occurred',
    500,
    corsHeaders
  );
}

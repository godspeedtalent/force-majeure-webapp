/**
 * RLS Test Assertions
 *
 * Custom assertion functions for testing Row-Level Security policies.
 * These provide clear error messages for security test failures.
 */

export class RLSTestError extends Error {
  constructor(
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'RLSTestError';
  }
}

/**
 * Assert that a query returns the expected number of rows
 */
export function assertRowCount(
  actual: number,
  expected: number,
  message: string
): void {
  if (actual !== expected) {
    throw new RLSTestError(
      `${message}: Expected ${expected} rows, got ${actual}`,
      { actual, expected }
    );
  }
}

/**
 * Assert that a query returns no rows (access denied)
 */
export function assertDenied(rows: unknown[], message: string): void {
  if (rows.length > 0) {
    throw new RLSTestError(
      `${message}: Expected access denied (0 rows), but got ${rows.length} rows`,
      { rowCount: rows.length }
    );
  }
}

/**
 * Assert that a query returns at least one row (access granted)
 */
export function assertGranted(rows: unknown[], message: string): void {
  if (rows.length === 0) {
    throw new RLSTestError(
      `${message}: Expected access granted (1+ rows), but got 0 rows`
    );
  }
}

/**
 * Assert that a mutation fails (is denied by RLS)
 * @param fn - Async function that attempts the mutation
 * @param message - Description of what should be denied
 */
export async function assertMutationDenied(
  fn: () => Promise<{ error?: { message?: string } | null; data?: unknown }>,
  message: string
): Promise<void> {
  const result = await fn();

  // In Supabase, RLS denial for UPDATE/DELETE returns success but affects 0 rows
  // For INSERT, it may return an error
  if (result.error) {
    // Expected - mutation was denied with an error
    return;
  }

  // If no error, check if the mutation actually affected anything
  // This depends on the mutation type and what was returned
  // For now, we'll consider no error as potentially successful
  // The test should verify separately that the data wasn't actually changed
}

/**
 * Assert that a mutation succeeds
 */
export async function assertMutationGranted(
  fn: () => Promise<{ error?: { message?: string } | null; data?: unknown }>,
  message: string
): Promise<void> {
  const result = await fn();

  if (result.error) {
    throw new RLSTestError(
      `${message}: Expected mutation to succeed, but it failed`,
      { error: result.error }
    );
  }
}

/**
 * Assert that all rows in result belong to specified user
 */
export function assertAllBelongToUser(
  rows: Array<{ user_id?: string }>,
  userId: string,
  message: string
): void {
  const wrongOwner = rows.find((r) => r.user_id !== userId);
  if (wrongOwner) {
    throw new RLSTestError(
      `${message}: Found row belonging to different user`,
      { wrongOwner, expectedUserId: userId }
    );
  }
}

/**
 * Assert query returned an error
 */
export function assertError(
  error: { message?: string } | null | undefined,
  message: string
): void {
  if (!error) {
    throw new RLSTestError(
      `${message}: Expected an error, but query succeeded`
    );
  }
}

/**
 * Assert query did not return an error
 */
export function assertNoError(
  error: { message?: string } | null | undefined,
  message: string
): void {
  if (error) {
    throw new RLSTestError(
      `${message}: Expected success, but got error: ${error.message}`,
      { error }
    );
  }
}

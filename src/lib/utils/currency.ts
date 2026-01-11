/**
 * Format cents as dollars with proper currency formatting
 * @param cents - Amount in cents (e.g., 1099)
 * @param currency - Currency code (default: 'USD')
 * @returns Formatted currency string (e.g., "$10.99")
 */
export const formatCurrency = (cents: number, currency: string = 'USD'): string => {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(dollars);
};

/**
 * Convert cents to dollars (decimal)
 * @param cents - Amount in cents
 * @returns Amount in dollars
 */
export const centsToDollars = (cents: number): number => {
  return cents / 100;
};

/**
 * Convert dollars to cents (integer)
 * @param dollars - Amount in dollars
 * @returns Amount in cents
 */
export const dollarsToCents = (dollars: number): number => {
  return Math.round(dollars * 100);
};

/**
 * Format dollars as currency with proper formatting (commas for thousands)
 * @param dollars - Amount in dollars (e.g., 10.99)
 * @param currency - Currency code (default: 'USD')
 * @returns Formatted currency string (e.g., "$10.99" or "$1,234.56")
 */
export const formatDollars = (dollars: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(dollars);
};

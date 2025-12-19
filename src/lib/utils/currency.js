/**
 * Format cents as dollars with proper currency formatting
 * @param cents - Amount in cents (e.g., 1099)
 * @param currency - Currency code (default: 'USD')
 * @returns Formatted currency string (e.g., "$10.99")
 */
export const formatCurrency = (cents, currency = 'USD') => {
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
export const centsToDollars = (cents) => {
    return cents / 100;
};
/**
 * Convert dollars to cents (integer)
 * @param dollars - Amount in dollars
 * @returns Amount in cents
 */
export const dollarsToCents = (dollars) => {
    return Math.round(dollars * 100);
};

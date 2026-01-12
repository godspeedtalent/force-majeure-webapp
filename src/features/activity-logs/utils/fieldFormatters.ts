/**
 * Field Formatters for Activity Log Details
 *
 * Utilities for formatting field values in activity log detail views.
 * Handles dates, booleans, arrays, numbers, currency, and other common types.
 */

import { format, parseISO, isValid } from 'date-fns';

/**
 * Format a date/datetime value
 */
export function formatDateTime(value: unknown): string {
  if (!value) return '';

  try {
    const date = typeof value === 'string' ? parseISO(value) : value;
    if (date instanceof Date && isValid(date)) {
      return format(date, 'MMM d, yyyy h:mm a');
    }
  } catch {
    // Fall through to string conversion
  }

  return String(value);
}

/**
 * Format a date-only value (no time)
 */
export function formatDate(value: unknown): string {
  if (!value) return '';

  try {
    const date = typeof value === 'string' ? parseISO(value) : value;
    if (date instanceof Date && isValid(date)) {
      return format(date, 'MMM d, yyyy');
    }
  } catch {
    // Fall through to string conversion
  }

  return String(value);
}

/**
 * Format a boolean value
 */
export function formatBoolean(value: unknown): string {
  if (value === null || value === undefined) return '';
  return value ? 'Yes' : 'No';
}

/**
 * Format an array value (e.g., genres)
 */
export function formatArray(value: unknown): string {
  if (!value) return '';
  if (Array.isArray(value)) {
    return value.filter(Boolean).join(', ') || '(empty)';
  }
  return String(value);
}

/**
 * Format a number value
 */
export function formatNumber(value: unknown): string {
  if (value === null || value === undefined) return '';
  const num = Number(value);
  if (isNaN(num)) return String(value);
  return num.toLocaleString();
}

/**
 * Format a currency value
 */
export function formatCurrency(value: unknown): string {
  if (value === null || value === undefined) return '';
  const num = Number(value);
  if (isNaN(num)) return String(value);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
}

/**
 * Format a duration in seconds to human-readable format
 */
export function formatDuration(value: unknown): string {
  if (value === null || value === undefined) return '';
  const seconds = Number(value);
  if (isNaN(seconds)) return String(value);

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Format a URL value (show just domain or "Connected" for social links)
 */
export function formatUrl(value: unknown): string {
  if (!value) return '';
  const str = String(value);

  try {
    const url = new URL(str);
    return url.hostname.replace('www.', '');
  } catch {
    return str.length > 50 ? `${str.substring(0, 47)}...` : str;
  }
}

/**
 * Truncate a long string value
 */
export function truncateString(value: unknown, maxLength = 100): string {
  if (!value) return '';
  const str = String(value);
  if (str.length <= maxLength) return str;
  return `${str.substring(0, maxLength - 3)}...`;
}

/**
 * Format a generic field value with type detection
 */
export function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) return '(none)';

  // Boolean
  if (typeof value === 'boolean') {
    return formatBoolean(value);
  }

  // Array
  if (Array.isArray(value)) {
    return formatArray(value);
  }

  // Number
  if (typeof value === 'number') {
    return formatNumber(value);
  }

  // String - check for date patterns
  if (typeof value === 'string') {
    // ISO date pattern
    if (/^\d{4}-\d{2}-\d{2}(T|\s)/.test(value)) {
      return formatDateTime(value);
    }
    // Just a date
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return formatDate(value);
    }
    // Truncate long strings
    if (value.length > 100) {
      return truncateString(value, 100);
    }
    return value;
  }

  // Object - stringify
  if (typeof value === 'object') {
    try {
      const str = JSON.stringify(value);
      return truncateString(str, 100);
    } catch {
      return String(value);
    }
  }

  return String(value);
}

/**
 * Format a changed field showing before → after
 */
export function formatChangedField(
  before: unknown,
  after: unknown,
  formatter?: (value: unknown) => string
): string {
  const format = formatter || formatFieldValue;
  const beforeStr = format(before);
  const afterStr = format(after);

  // Handle additions (before was null/undefined/empty)
  if (!before && before !== 0 && before !== false) {
    return `→ ${afterStr}`;
  }

  // Handle removals (after is null/undefined/empty)
  if (!after && after !== 0 && after !== false) {
    return `${beforeStr} →`;
  }

  // Normal change
  return `${beforeStr} → ${afterStr}`;
}

/**
 * Get a human-readable label from a field key
 * Converts snake_case to Title Case
 */
export function fieldKeyToLabel(key: string): string {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Fields that should always be hidden from detail views
 * These are internal system fields
 */
export const HIDDEN_FIELDS = new Set([
  'id',
  'created_at',
  'updated_at',
  'user_id',
  'organization_id',
  'created_by',
  'updated_by',
  'deleted_at',
]);

/**
 * Check if a field should be hidden
 */
export function isFieldHidden(key: string): boolean {
  return HIDDEN_FIELDS.has(key) || key.endsWith('_id');
}

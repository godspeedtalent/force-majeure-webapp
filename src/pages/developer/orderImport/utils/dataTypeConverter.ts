/**
 * Data Type Converter
 *
 * Converts string values to target data types.
 */

import type { FieldDataType } from '../types';

/**
 * Converts a string value to the target data type
 * Returns { value, error } - error is set if conversion fails
 */
export function convertToDataType(
  value: string,
  dataType: FieldDataType,
  enumValues?: string[]
): { value: string | number | Date | null; error?: string } {
  const trimmed = value.trim();

  if (!trimmed) {
    return { value: null };
  }

  switch (dataType) {
    case 'text':
      return { value: trimmed };

    case 'integer': {
      // Remove currency symbols, commas, and whitespace
      const cleaned = trimmed.replace(/[$,\s]/g, '');
      // Handle decimal values by rounding
      const num = parseFloat(cleaned);
      if (isNaN(num)) {
        return { value: null, error: `Cannot convert "${trimmed}" to integer` };
      }
      return { value: Math.round(num) };
    }

    case 'date': {
      // Try parsing various date formats
      const parsed = new Date(trimmed);
      if (isNaN(parsed.getTime())) {
        // Try additional formats: MM/DD/YYYY, DD-MM-YYYY, etc.
        const formats = [
          /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // MM/DD/YYYY
          /^(\d{1,2})-(\d{1,2})-(\d{4})$/,   // MM-DD-YYYY
          /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/, // YYYY/MM/DD
        ];

        for (const format of formats) {
          const match = trimmed.match(format);
          if (match) {
            const [, a, b, c] = match;
            // Try to construct a valid date
            const tryDate = new Date(`${c}-${a.padStart(2, '0')}-${b.padStart(2, '0')}`);
            if (!isNaN(tryDate.getTime())) {
              return { value: tryDate.toISOString() };
            }
          }
        }
        return { value: null, error: `Cannot parse date "${trimmed}"` };
      }
      return { value: parsed.toISOString() };
    }

    case 'enum': {
      const lower = trimmed.toLowerCase();
      // Check for exact or fuzzy match against enum values
      const matched = enumValues?.find(v =>
        v.toLowerCase() === lower ||
        lower.includes(v.toLowerCase()) ||
        v.toLowerCase().includes(lower)
      );
      if (matched) {
        return { value: matched };
      }
      return { value: null, error: `"${trimmed}" is not a valid option (${enumValues?.join(', ')})` };
    }

    default:
      return { value: trimmed };
  }
}

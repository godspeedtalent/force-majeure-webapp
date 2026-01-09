/**
 * Field Resolver
 *
 * Resolves field values based on mapping configuration.
 * Handles column, hardcoded, formula, and ignore modes.
 */

import { DATE_DEFAULTS } from '../constants';
import { evaluateFormula } from './formulaEvaluator';
import type {
  CsvRow,
  FieldMapping,
  ResolveContext,
} from '../types';

/**
 * Resolves special date default values
 * - $NOW: Current timestamp
 * - $EVENT: Event start date
 */
export function resolveDateDefault(value: string, eventDate?: string): string {
  if (value === DATE_DEFAULTS.NOW) {
    return new Date().toISOString();
  }
  if (value === DATE_DEFAULTS.EVENT_DATE && eventDate) {
    return eventDate;
  }
  return value;
}

/**
 * Resolves a field value based on mapping mode
 * Returns the resolved value, or the default value if empty
 */
export function resolveFieldValue(
  mapping: FieldMapping,
  row: CsvRow,
  context: { tierPrice: number; eventDate?: string }
): string {
  // If ignored, return empty (caller should use default)
  if (mapping.mode === 'ignore') {
    const defaultValue = mapping.defaultValue || '';
    return resolveDateDefault(defaultValue, context.eventDate);
  }

  let resolvedValue = '';

  switch (mapping.mode) {
    case 'column':
      if (mapping.value) {
        resolvedValue = row[mapping.value]?.trim() ?? '';
      }
      break;
    case 'hardcoded':
      resolvedValue = mapping.value;
      break;
    case 'formula':
      if (mapping.value) {
        const result = evaluateFormula(mapping.value, { tierPrice: context.tierPrice, row });
        resolvedValue = result.toString();
      }
      break;
  }

  // Use default value if resolved value is empty
  if (!resolvedValue && mapping.defaultValue) {
    return resolveDateDefault(mapping.defaultValue, context.eventDate);
  }

  return resolvedValue;
}

/**
 * Resolves a numeric field value (price, quantity, etc.)
 * Returns the resolved number, or 0 if not resolvable
 */
export function resolveNumericValue(
  mapping: FieldMapping,
  row: CsvRow,
  context: ResolveContext,
  defaultValue: number = 0
): number {
  // If ignored, return default
  if (mapping.mode === 'ignore') {
    const defaultStr = mapping.defaultValue;
    return defaultStr ? parseInt(defaultStr, 10) || defaultValue : defaultValue;
  }

  let resolvedValue = '';

  switch (mapping.mode) {
    case 'column':
      if (mapping.value) {
        resolvedValue = row[mapping.value]?.trim() ?? '';
      }
      break;
    case 'hardcoded':
      resolvedValue = mapping.value;
      break;
    case 'formula':
      if (mapping.value) {
        return evaluateFormula(mapping.value, { tierPrice: context.tierPrice, row });
      }
      break;
  }

  // Try to parse the resolved value
  if (resolvedValue) {
    const parsed = parseFloat(resolvedValue);
    if (!isNaN(parsed)) {
      return Math.round(parsed); // Round to integer for cents
    }
  }

  // Use default
  const defaultStr = mapping.defaultValue;
  return defaultStr ? parseInt(defaultStr, 10) || defaultValue : defaultValue;
}

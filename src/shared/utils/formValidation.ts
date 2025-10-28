/**
 * Form Validation Utilities
 * 
 * Common validation schemas and helpers for forms
 * Uses zod for type-safe validation
 */

import { z } from 'zod';

/**
 * Common field validations with security best practices
 */

// String validations
export const stringRequired = (fieldName: string, maxLength = 255) =>
  z
    .string()
    .trim()
    .min(1, `${fieldName} is required`)
    .max(maxLength, `${fieldName} must be less than ${maxLength} characters`);

export const stringOptional = (maxLength = 255) =>
  z
    .string()
    .trim()
    .max(maxLength, `Must be less than ${maxLength} characters`)
    .optional()
    .or(z.literal(''));

// Email validation
export const emailField = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Invalid email address')
  .max(255, 'Email must be less than 255 characters');

// Password validation
export const passwordField = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain at least one uppercase letter, one lowercase letter, and one number'
  );

// URL validation
export const urlField = z
  .string()
  .trim()
  .url('Invalid URL')
  .max(2048, 'URL must be less than 2048 characters');

export const urlOptional = z
  .string()
  .trim()
  .url('Invalid URL')
  .max(2048, 'URL must be less than 2048 characters')
  .optional()
  .or(z.literal(''));

// Phone validation (basic)
export const phoneField = z
  .string()
  .trim()
  .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, 'Invalid phone number')
  .max(20, 'Phone number must be less than 20 characters');

// Date validations
export const dateField = z.date({
  required_error: 'Date is required',
  invalid_type_error: 'Invalid date',
});

export const dateOptional = z.date().optional();

export const futureDateField = z.date().refine((date) => date > new Date(), {
  message: 'Date must be in the future',
});

export const pastDateField = z.date().refine((date) => date < new Date(), {
  message: 'Date must be in the past',
});

// Number validations
export const positiveNumber = z
  .number({ required_error: 'This field is required' })
  .positive('Must be a positive number');

export const nonNegativeNumber = z
  .number({ required_error: 'This field is required' })
  .nonnegative('Must be a non-negative number');

export const integerField = z
  .number({ required_error: 'This field is required' })
  .int('Must be a whole number');

// Price validation (in cents)
export const priceField = z
  .number({ required_error: 'Price is required' })
  .int('Price must be in cents (whole number)')
  .nonnegative('Price cannot be negative')
  .max(99999999, 'Price is too large'); // $999,999.99 max

/**
 * Common validation helpers
 */

// Sanitize HTML/dangerous characters
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 10000); // Hard limit on length
};

// Encode for URL parameters
export const encodeForUrl = (input: string): string => {
  return encodeURIComponent(input.trim());
};

// Validate file upload
export const createFileValidation = (
  maxSizeMB: number,
  allowedTypes: string[]
) => {
  return z
    .instanceof(File)
    .refine((file) => file.size <= maxSizeMB * 1024 * 1024, {
      message: `File size must be less than ${maxSizeMB}MB`,
    })
    .refine((file) => allowedTypes.includes(file.type), {
      message: `File type must be one of: ${allowedTypes.join(', ')}`,
    });
};

/**
 * Common form schemas
 */

// Contact form schema
export const contactFormSchema = z.object({
  name: stringRequired('Name', 100),
  email: emailField,
  subject: stringRequired('Subject', 200),
  message: stringRequired('Message', 1000),
});

// Event form schema example
export const eventFormSchema = z.object({
  title: stringRequired('Event title', 200),
  description: stringOptional(2000),
  date: futureDateField,
  venue: stringRequired('Venue', 200),
  ticketUrl: urlOptional,
});

// User profile schema example
export const profileFormSchema = z.object({
  displayName: stringRequired('Display name', 100),
  email: emailField,
  bio: stringOptional(500),
  website: urlOptional,
  phone: phoneField.optional().or(z.literal('')),
});

/**
 * Password confirmation helper
 */
export const passwordConfirmation = (schema: z.ZodObject<any>) => {
  return schema
    .extend({
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ['confirmPassword'],
    });
};

/**
 * Form data to API payload converter
 * Removes empty strings and trims values
 */
export const prepareFormData = <T extends Record<string, any>>(
  data: T
): Partial<T> => {
  return Object.entries(data).reduce((acc, [key, value]) => {
    if (value === '' || value === null || value === undefined) {
      return acc;
    }
    
    if (typeof value === 'string') {
      acc[key as keyof T] = value.trim() as any;
    } else {
      acc[key as keyof T] = value;
    }
    
    return acc;
  }, {} as Partial<T>);
};

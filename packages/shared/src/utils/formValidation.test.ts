import { describe, it, expect, beforeEach, vi } from 'vitest';
import { z } from 'zod';
import {
  stringRequired,
  stringOptional,
  emailField,
  passwordField,
  urlField,
  urlOptional,
  phoneField,
  dateField,
  dateOptional,
  futureDateField,
  pastDateField,
  positiveNumber,
  nonNegativeNumber,
  integerField,
  priceField,
  sanitizeInput,
  encodeForUrl,
  createFileValidation,
  contactFormSchema,
  eventFormSchema,
  profileFormSchema,
  passwordConfirmation,
  prepareFormData,
} from './formValidation';

describe('stringRequired', () => {
  it('validates non-empty string', () => {
    const schema = stringRequired('Name');
    expect(schema.parse('John Doe')).toBe('John Doe');
  });

  it('trims whitespace', () => {
    const schema = stringRequired('Name');
    expect(schema.parse('  John Doe  ')).toBe('John Doe');
  });

  it('rejects empty string', () => {
    const schema = stringRequired('Name');
    expect(() => schema.parse('')).toThrow('Name is required');
  });

  it('rejects string that exceeds max length', () => {
    const schema = stringRequired('Name', 5);
    expect(() => schema.parse('Too long name')).toThrow(
      'Name must be less than 5 characters'
    );
  });

  it('uses default max length of 255', () => {
    const schema = stringRequired('Name');
    const longString = 'a'.repeat(256);
    expect(() => schema.parse(longString)).toThrow('less than 255 characters');
  });
});

describe('stringOptional', () => {
  it('accepts valid string', () => {
    const schema = stringOptional();
    expect(schema.parse('Hello')).toBe('Hello');
  });

  it('accepts empty string', () => {
    const schema = stringOptional();
    expect(schema.parse('')).toBe('');
  });

  it('accepts undefined', () => {
    const schema = stringOptional();
    expect(schema.parse(undefined)).toBeUndefined();
  });

  it('rejects string exceeding max length', () => {
    const schema = stringOptional(10);
    expect(() => schema.parse('This is too long')).toThrow(
      'Must be less than 10 characters'
    );
  });
});

describe('emailField', () => {
  it('validates correct email', () => {
    expect(emailField.parse('test@example.com')).toBe('test@example.com');
  });

  it('trims whitespace', () => {
    expect(emailField.parse('  test@example.com  ')).toBe('test@example.com');
  });

  it('rejects invalid email format', () => {
    expect(() => emailField.parse('not-an-email')).toThrow('Invalid email');
  });

  it('rejects empty string', () => {
    expect(() => emailField.parse('')).toThrow('Email is required');
  });

  it('validates email with subdomains', () => {
    expect(emailField.parse('user@mail.example.com')).toBe(
      'user@mail.example.com'
    );
  });
});

describe('passwordField', () => {
  it('validates strong password', () => {
    expect(passwordField.parse('Password123')).toBe('Password123');
  });

  it('rejects password shorter than 8 characters', () => {
    expect(() => passwordField.parse('Pass1')).toThrow('at least 8 characters');
  });

  it('rejects password without uppercase letter', () => {
    expect(() => passwordField.parse('password123')).toThrow(
      'one uppercase letter'
    );
  });

  it('rejects password without lowercase letter', () => {
    expect(() => passwordField.parse('PASSWORD123')).toThrow(
      'one lowercase letter'
    );
  });

  it('rejects password without number', () => {
    expect(() => passwordField.parse('PasswordABC')).toThrow('one number');
  });

  it('rejects password longer than 128 characters', () => {
    const longPassword = 'A'.repeat(126) + 'a1'; // 128 chars exactly
    expect(() => passwordField.parse(longPassword + 'X')).toThrow(
      'less than 128 characters'
    );
  });
});

describe('urlField', () => {
  it('validates HTTP URL', () => {
    expect(urlField.parse('http://example.com')).toBe('http://example.com');
  });

  it('validates HTTPS URL', () => {
    expect(urlField.parse('https://example.com')).toBe('https://example.com');
  });

  it('trims whitespace', () => {
    expect(urlField.parse('  https://example.com  ')).toBe(
      'https://example.com'
    );
  });

  it('rejects invalid URL', () => {
    expect(() => urlField.parse('not a url')).toThrow('Invalid URL');
  });

  it('rejects URL longer than 2048 characters', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(2050);
    expect(() => urlField.parse(longUrl)).toThrow('less than 2048 characters');
  });
});

describe('urlOptional', () => {
  it('accepts valid URL', () => {
    expect(urlOptional.parse('https://example.com')).toBe(
      'https://example.com'
    );
  });

  it('accepts empty string', () => {
    expect(urlOptional.parse('')).toBe('');
  });

  it('accepts undefined', () => {
    expect(urlOptional.parse(undefined)).toBeUndefined();
  });
});

describe('phoneField', () => {
  it('validates US phone format', () => {
    expect(phoneField.parse('555-123-4567')).toBe('555-123-4567');
  });

  it('validates international phone format', () => {
    expect(phoneField.parse('+15551234567')).toBe('+15551234567');
  });

  it('validates phone without separators', () => {
    expect(phoneField.parse('5551234567')).toBe('5551234567');
  });

  it('rejects invalid phone format', () => {
    expect(() => phoneField.parse('abc-def-ghij')).toThrow(
      'Invalid phone number'
    );
  });

  it('rejects phone longer than 20 characters', () => {
    expect(() => phoneField.parse('1'.repeat(21))).toThrow(
      'less than 20 characters'
    );
  });
});

describe('dateField', () => {
  it('validates date object', () => {
    const date = new Date('2025-12-01');
    expect(dateField.parse(date)).toEqual(date);
  });

  it('rejects non-date value', () => {
    expect(() => dateField.parse('not a date')).toThrow('Invalid date');
  });

  it('rejects undefined', () => {
    expect(() => dateField.parse(undefined)).toThrow('Date is required');
  });
});

describe('dateOptional', () => {
  it('accepts date object', () => {
    const date = new Date('2025-12-01');
    expect(dateOptional.parse(date)).toEqual(date);
  });

  it('accepts undefined', () => {
    expect(dateOptional.parse(undefined)).toBeUndefined();
  });
});

describe('futureDateField', () => {
  beforeEach(() => {
    // Mock current date to 2025-01-01
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01'));
  });

  it('validates future date', () => {
    const futureDate = new Date('2025-12-01');
    expect(futureDateField.parse(futureDate)).toEqual(futureDate);
  });

  it('rejects past date', () => {
    const pastDate = new Date('2024-01-01');
    expect(() => futureDateField.parse(pastDate)).toThrow(
      'Date must be in the future'
    );
  });

  it('rejects current date', () => {
    const now = new Date();
    expect(() => futureDateField.parse(now)).toThrow(
      'Date must be in the future'
    );
  });
});

describe('pastDateField', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01'));
  });

  it('validates past date', () => {
    const pastDate = new Date('2024-01-01');
    expect(pastDateField.parse(pastDate)).toEqual(pastDate);
  });

  it('rejects future date', () => {
    const futureDate = new Date('2026-01-01');
    expect(() => pastDateField.parse(futureDate)).toThrow(
      'Date must be in the past'
    );
  });

  it('rejects current date', () => {
    const now = new Date();
    expect(() => pastDateField.parse(now)).toThrow('Date must be in the past');
  });
});

describe('positiveNumber', () => {
  it('validates positive number', () => {
    expect(positiveNumber.parse(5)).toBe(5);
    expect(positiveNumber.parse(0.1)).toBe(0.1);
  });

  it('rejects zero', () => {
    expect(() => positiveNumber.parse(0)).toThrow('Must be a positive number');
  });

  it('rejects negative number', () => {
    expect(() => positiveNumber.parse(-5)).toThrow('Must be a positive number');
  });
});

describe('nonNegativeNumber', () => {
  it('validates positive number', () => {
    expect(nonNegativeNumber.parse(5)).toBe(5);
  });

  it('validates zero', () => {
    expect(nonNegativeNumber.parse(0)).toBe(0);
  });

  it('rejects negative number', () => {
    expect(() => nonNegativeNumber.parse(-5)).toThrow(
      'Must be a non-negative number'
    );
  });
});

describe('integerField', () => {
  it('validates integer', () => {
    expect(integerField.parse(5)).toBe(5);
  });

  it('rejects decimal', () => {
    expect(() => integerField.parse(5.5)).toThrow('Must be a whole number');
  });
});

describe('priceField', () => {
  it('validates price in cents', () => {
    expect(priceField.parse(1000)).toBe(1000); // $10.00
  });

  it('validates zero price', () => {
    expect(priceField.parse(0)).toBe(0);
  });

  it('rejects negative price', () => {
    expect(() => priceField.parse(-100)).toThrow('Price cannot be negative');
  });

  it('rejects decimal price', () => {
    expect(() => priceField.parse(10.5)).toThrow(
      'Price must be in cents (whole number)'
    );
  });

  it('rejects price exceeding max', () => {
    expect(() => priceField.parse(100000000)).toThrow('Price is too large');
  });
});

describe('sanitizeInput', () => {
  it('removes HTML brackets', () => {
    expect(sanitizeInput('<script>alert("XSS")</script>')).toBe(
      'scriptalert("XSS")/script'
    );
  });

  it('trims whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });

  it('limits length to 10000 characters', () => {
    const longString = 'a'.repeat(10001);
    expect(sanitizeInput(longString)).toHaveLength(10000);
  });

  it('preserves safe characters', () => {
    expect(sanitizeInput('Hello, World! 123')).toBe('Hello, World! 123');
  });
});

describe('encodeForUrl', () => {
  it('encodes special characters', () => {
    expect(encodeForUrl('hello world')).toBe('hello%20world');
  });

  it('trims whitespace before encoding', () => {
    expect(encodeForUrl('  hello  ')).toBe('hello');
  });

  it('encodes special URL characters', () => {
    expect(encodeForUrl('hello&world=test')).toContain('%26');
  });
});

describe('createFileValidation', () => {
  it('validates file within size limit', () => {
    const schema = createFileValidation(1, ['image/png']);
    const file = new File(['content'], 'test.png', { type: 'image/png' });
    expect(schema.parse(file)).toEqual(file);
  });

  it('rejects file exceeding size limit', () => {
    const schema = createFileValidation(1, ['image/png']);
    const largeContent = new Array(2 * 1024 * 1024).fill('a').join('');
    const file = new File([largeContent], 'test.png', { type: 'image/png' });
    expect(() => schema.parse(file)).toThrow('File size must be less than 1MB');
  });

  it('rejects file with wrong type', () => {
    const schema = createFileValidation(1, ['image/png']);
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    expect(() => schema.parse(file)).toThrow('File type must be one of');
  });
});

describe('contactFormSchema', () => {
  it('validates complete contact form', () => {
    const data = {
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Question',
      message: 'Hello, I have a question.',
    };
    expect(contactFormSchema.parse(data)).toEqual(data);
  });

  it('rejects form with missing fields', () => {
    const data = {
      name: 'John Doe',
      email: 'john@example.com',
    };
    expect(() => contactFormSchema.parse(data)).toThrow();
  });
});

describe('eventFormSchema', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01'));
  });

  it('validates complete event form', () => {
    const data = {
      title: 'Concert',
      description: 'A great concert',
      date: new Date('2025-12-01'),
      venue: 'Main Hall',
      ticketUrl: 'https://tickets.example.com',
    };
    expect(eventFormSchema.parse(data)).toEqual(data);
  });

  it('accepts form with optional fields omitted', () => {
    const data = {
      title: 'Concert',
      description: '',
      date: new Date('2025-12-01'),
      venue: 'Main Hall',
      ticketUrl: '',
    };
    expect(eventFormSchema.parse(data)).toEqual(data);
  });
});

describe('profileFormSchema', () => {
  it('validates complete profile form', () => {
    const data = {
      displayName: 'John Doe',
      email: 'john@example.com',
      bio: 'Software developer',
      website: 'https://john.com',
      phone: '555-123-4567',
    };
    expect(profileFormSchema.parse(data)).toEqual(data);
  });
});

describe('passwordConfirmation', () => {
  it('validates matching passwords', () => {
    const schema = passwordConfirmation(
      z.object({ password: z.string() })
    );
    const data = {
      password: 'Password123',
      confirmPassword: 'Password123',
    };
    expect(schema.parse(data)).toEqual(data);
  });

  it('rejects non-matching passwords', () => {
    const schema = passwordConfirmation(
      z.object({ password: z.string() })
    );
    const data = {
      password: 'Password123',
      confirmPassword: 'Different123',
    };
    expect(() => schema.parse(data)).toThrow("Passwords don't match");
  });
});

describe('prepareFormData', () => {
  it('removes empty strings', () => {
    const data = { name: 'John', email: '' };
    expect(prepareFormData(data)).toEqual({ name: 'John' });
  });

  it('removes null values', () => {
    const data = { name: 'John', email: null };
    expect(prepareFormData(data)).toEqual({ name: 'John' });
  });

  it('removes undefined values', () => {
    const data = { name: 'John', email: undefined };
    expect(prepareFormData(data)).toEqual({ name: 'John' });
  });

  it('trims string values', () => {
    const data = { name: '  John  ', email: '  john@example.com  ' };
    expect(prepareFormData(data)).toEqual({
      name: 'John',
      email: 'john@example.com',
    });
  });

  it('preserves non-string values', () => {
    const data = { name: 'John', age: 30, active: true };
    expect(prepareFormData(data)).toEqual({
      name: 'John',
      age: 30,
      active: true,
    });
  });

  it('returns empty object for all empty values', () => {
    const data = { name: '', email: null, bio: undefined };
    expect(prepareFormData(data)).toEqual({});
  });
});

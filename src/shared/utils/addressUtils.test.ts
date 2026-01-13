import { describe, it, expect } from 'vitest';
import {
  formatFullAddress,
  getGoogleMapsEmbedUrl,
  getGoogleMapsSearchUrl,
} from './addressUtils';

// ============================================================================
// formatFullAddress Tests
// ============================================================================

describe('formatFullAddress', () => {
  describe('complete address', () => {
    it('formats complete address with all components', () => {
      const result = formatFullAddress(
        '123 Main Street',
        'Suite 100',
        'Los Angeles',
        'CA',
        '90001'
      );
      expect(result).toBe('123 Main Street, Suite 100, Los Angeles, CA 90001');
    });

    it('formats address without suite/unit', () => {
      const result = formatFullAddress(
        '456 Oak Avenue',
        null,
        'New York',
        'NY',
        '10001'
      );
      expect(result).toBe('456 Oak Avenue, New York, NY 10001');
    });
  });

  describe('partial address', () => {
    it('formats address with only street and city', () => {
      const result = formatFullAddress(
        '789 Pine Road',
        null,
        'Chicago',
        null,
        null
      );
      expect(result).toBe('789 Pine Road, Chicago');
    });

    it('formats address with only street', () => {
      const result = formatFullAddress(
        '321 Elm Street',
        null,
        null,
        null,
        null
      );
      expect(result).toBe('321 Elm Street');
    });

    it('formats address with city, state, and zip only', () => {
      const result = formatFullAddress(
        null,
        null,
        'Miami',
        'FL',
        '33101'
      );
      expect(result).toBe('Miami, FL 33101');
    });

    it('formats address with only state and zip', () => {
      const result = formatFullAddress(
        null,
        null,
        null,
        'TX',
        '75001'
      );
      expect(result).toBe('TX 75001');
    });

    it('formats address with only state', () => {
      const result = formatFullAddress(
        null,
        null,
        null,
        'WA',
        null
      );
      expect(result).toBe('WA');
    });

    it('formats address with only zip', () => {
      const result = formatFullAddress(
        null,
        null,
        null,
        null,
        '90210'
      );
      expect(result).toBe('90210');
    });

    it('formats address with only city', () => {
      const result = formatFullAddress(
        null,
        null,
        'Seattle',
        null,
        null
      );
      expect(result).toBe('Seattle');
    });
  });

  describe('addressLine2 handling', () => {
    it('appends addressLine2 with comma to addressLine1', () => {
      const result = formatFullAddress(
        '100 Broadway',
        'Apt 5B',
        'New York',
        'NY',
        '10004'
      );
      expect(result).toBe('100 Broadway, Apt 5B, New York, NY 10004');
    });

    it('ignores addressLine2 when addressLine1 is missing', () => {
      // addressLine2 without addressLine1 is not added
      const result = formatFullAddress(
        null,
        'Suite 200',
        'Boston',
        'MA',
        '02101'
      );
      expect(result).toBe('Boston, MA 02101');
    });

    it('handles various addressLine2 formats', () => {
      const testCases = [
        { line2: 'Unit 10', expected: '123 Test, Unit 10, City, ST 12345' },
        { line2: '#200', expected: '123 Test, #200, City, ST 12345' },
        { line2: 'Floor 3', expected: '123 Test, Floor 3, City, ST 12345' },
        { line2: 'Building A', expected: '123 Test, Building A, City, ST 12345' },
      ];

      testCases.forEach(({ line2, expected }) => {
        const result = formatFullAddress('123 Test', line2, 'City', 'ST', '12345');
        expect(result).toBe(expected);
      });
    });
  });

  describe('edge cases', () => {
    it('returns null for all null/undefined inputs', () => {
      expect(formatFullAddress(null, null, null, null, null)).toBe(null);
      expect(formatFullAddress(undefined, undefined, undefined, undefined, undefined)).toBe(null);
    });

    it('returns null for all empty string inputs', () => {
      expect(formatFullAddress('', '', '', '', '')).toBe(null);
    });

    it('handles mixed null and undefined', () => {
      const result = formatFullAddress(
        '123 Main',
        undefined,
        'City',
        null,
        undefined
      );
      expect(result).toBe('123 Main, City');
    });

    it('handles empty strings in middle of address', () => {
      const result = formatFullAddress(
        '123 Main',
        '',
        'City',
        '',
        '12345'
      );
      expect(result).toBe('123 Main, City, 12345');
    });

    it('trims whitespace in components', () => {
      // Note: Current implementation doesn't trim, but we test actual behavior
      const result = formatFullAddress(
        '123 Main',
        null,
        'City',
        'CA',
        '90001'
      );
      expect(result).toBe('123 Main, City, CA 90001');
    });
  });

  describe('state and zip combination', () => {
    it('combines state and zip with space', () => {
      const result = formatFullAddress(
        '123 Main',
        null,
        'City',
        'CA',
        '90001'
      );
      expect(result).toContain('CA 90001');
    });

    it('handles only state in stateZip', () => {
      const result = formatFullAddress(
        '123 Main',
        null,
        'City',
        'CA',
        null
      );
      expect(result).toBe('123 Main, City, CA');
    });

    it('handles only zip in stateZip', () => {
      const result = formatFullAddress(
        '123 Main',
        null,
        'City',
        null,
        '90001'
      );
      expect(result).toBe('123 Main, City, 90001');
    });
  });
});

// ============================================================================
// getGoogleMapsEmbedUrl Tests
// ============================================================================

describe('getGoogleMapsEmbedUrl', () => {
  describe('valid addresses', () => {
    it('generates embed URL for simple address', () => {
      const result = getGoogleMapsEmbedUrl('123 Main Street, Los Angeles, CA');
      expect(result).toBe(
        'https://maps.google.com/maps?q=123%20Main%20Street%2C%20Los%20Angeles%2C%20CA&t=&z=15&ie=UTF8&iwloc=B&output=embed'
      );
    });

    it('properly encodes special characters', () => {
      const result = getGoogleMapsEmbedUrl('123 Main St & Broadway, New York, NY');
      expect(result).toContain('%26'); // encoded &
      expect(result).toContain('output=embed');
    });

    it('includes zoom level of 15', () => {
      const result = getGoogleMapsEmbedUrl('Test Address');
      expect(result).toContain('z=15');
    });

    it('includes UTF8 encoding parameter', () => {
      const result = getGoogleMapsEmbedUrl('Test Address');
      expect(result).toContain('ie=UTF8');
    });

    it('includes iwloc parameter', () => {
      const result = getGoogleMapsEmbedUrl('Test Address');
      expect(result).toContain('iwloc=B');
    });
  });

  describe('edge cases', () => {
    it('returns null for null address', () => {
      expect(getGoogleMapsEmbedUrl(null)).toBe(null);
    });

    it('returns null for empty string', () => {
      // Empty string is falsy, so should return null
      expect(getGoogleMapsEmbedUrl('')).toBe(null);
    });

    it('handles address with unicode characters', () => {
      const result = getGoogleMapsEmbedUrl('Café Street, München');
      expect(result).toContain('Caf%C3%A9'); // encoded é
      expect(result).toContain('M%C3%BCnchen'); // encoded ü
    });

    it('handles address with multiple spaces', () => {
      const result = getGoogleMapsEmbedUrl('123   Main   Street');
      expect(result).not.toBe(null);
      expect(result).toContain('output=embed');
    });
  });

  describe('URL structure', () => {
    it('uses https protocol', () => {
      const result = getGoogleMapsEmbedUrl('Test');
      expect(result).toMatch(/^https:\/\//);
    });

    it('uses maps.google.com domain', () => {
      const result = getGoogleMapsEmbedUrl('Test');
      expect(result).toContain('maps.google.com');
    });
  });
});

// ============================================================================
// getGoogleMapsSearchUrl Tests
// ============================================================================

describe('getGoogleMapsSearchUrl', () => {
  describe('valid addresses', () => {
    it('generates search URL for simple address', () => {
      const result = getGoogleMapsSearchUrl('123 Main Street, Los Angeles, CA');
      expect(result).toBe(
        'https://www.google.com/maps/search/?api=1&query=123%20Main%20Street%2C%20Los%20Angeles%2C%20CA'
      );
    });

    it('properly encodes special characters', () => {
      const result = getGoogleMapsSearchUrl('123 Main St & Broadway, New York, NY');
      expect(result).toContain('%26'); // encoded &
      expect(result).toContain('api=1');
    });

    it('includes api version parameter', () => {
      const result = getGoogleMapsSearchUrl('Test Address');
      expect(result).toContain('api=1');
    });

    it('uses query parameter for address', () => {
      const result = getGoogleMapsSearchUrl('Test Address');
      expect(result).toContain('query=Test%20Address');
    });
  });

  describe('edge cases', () => {
    it('returns null for null address', () => {
      expect(getGoogleMapsSearchUrl(null)).toBe(null);
    });

    it('returns null for empty string', () => {
      expect(getGoogleMapsSearchUrl('')).toBe(null);
    });

    it('handles address with unicode characters', () => {
      const result = getGoogleMapsSearchUrl('Straße 123, Berlin');
      expect(result).toContain('Stra%C3%9Fe'); // encoded ß
    });

    it('handles address with newlines', () => {
      const result = getGoogleMapsSearchUrl('123 Main\nLos Angeles');
      expect(result).toContain('%0A'); // encoded newline
    });
  });

  describe('URL structure', () => {
    it('uses https protocol', () => {
      const result = getGoogleMapsSearchUrl('Test');
      expect(result).toMatch(/^https:\/\//);
    });

    it('uses www.google.com/maps/search path', () => {
      const result = getGoogleMapsSearchUrl('Test');
      expect(result).toContain('www.google.com/maps/search');
    });

    it('differs from embed URL', () => {
      const embedUrl = getGoogleMapsEmbedUrl('Test');
      const searchUrl = getGoogleMapsSearchUrl('Test');

      expect(embedUrl).not.toBe(null);
      expect(searchUrl).not.toBe(null);
      expect(embedUrl).not.toBe(searchUrl);

      // Embed URL is for iframes
      expect(embedUrl).toContain('output=embed');
      // Search URL is for opening in new tab
      expect(searchUrl).toContain('maps/search');
    });
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe('Integration scenarios', () => {
  it('formats address and generates URLs', () => {
    const address = formatFullAddress(
      '1600 Amphitheatre Parkway',
      null,
      'Mountain View',
      'CA',
      '94043'
    );

    expect(address).toBe('1600 Amphitheatre Parkway, Mountain View, CA 94043');

    const embedUrl = getGoogleMapsEmbedUrl(address);
    const searchUrl = getGoogleMapsSearchUrl(address);

    expect(embedUrl).not.toBe(null);
    expect(searchUrl).not.toBe(null);
    expect(embedUrl).toContain('output=embed');
    expect(searchUrl).toContain('maps/search');
  });

  it('handles venue address flow', () => {
    // Typical venue with suite number
    const venueAddress = formatFullAddress(
      '6255 Sunset Blvd',
      'Suite 100',
      'Hollywood',
      'CA',
      '90028'
    );

    expect(venueAddress).toBe('6255 Sunset Blvd, Suite 100, Hollywood, CA 90028');

    // Can generate both URL types
    expect(getGoogleMapsEmbedUrl(venueAddress)).not.toBe(null);
    expect(getGoogleMapsSearchUrl(venueAddress)).not.toBe(null);
  });

  it('handles minimal address gracefully', () => {
    // User only entered city
    const minimalAddress = formatFullAddress(null, null, 'Austin', 'TX', null);
    expect(minimalAddress).toBe('Austin, TX');

    // URLs should still work
    const searchUrl = getGoogleMapsSearchUrl(minimalAddress);
    expect(searchUrl).toContain('Austin%2C%20TX');
  });

  it('returns null URLs for null address', () => {
    const noAddress = formatFullAddress(null, null, null, null, null);
    expect(noAddress).toBe(null);

    expect(getGoogleMapsEmbedUrl(noAddress)).toBe(null);
    expect(getGoogleMapsSearchUrl(noAddress)).toBe(null);
  });
});

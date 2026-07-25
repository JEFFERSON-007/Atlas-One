import { describe, it, expect } from 'vitest';
import {
  sanitizeInput,
  isValidUrl,
  isValidCoordinates,
  isValidSearchQuery,
  formatCoordinate,
  encodeQueryParam,
} from '../../utils/validators';

describe('sanitizeInput', () => {
  it('should strip HTML tags', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert(xss)/script');
  });

  it('should remove dangerous characters', () => {
    expect(sanitizeInput('hello <world> "test"')).toBe('hello world test');
  });

  it('should trim whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });

  it('should handle empty strings', () => {
    expect(sanitizeInput('')).toBe('');
  });
});

describe('isValidUrl', () => {
  it('should accept https URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
  });

  it('should accept http URLs', () => {
    expect(isValidUrl('http://example.com')).toBe(true);
  });

  it('should reject javascript URLs', () => {
    expect(isValidUrl('javascript:alert(1)')).toBe(false);
  });

  it('should reject invalid strings', () => {
    expect(isValidUrl('not-a-url')).toBe(false);
  });
});

describe('isValidCoordinates', () => {
  it('should accept valid coordinates', () => {
    expect(isValidCoordinates(40.7128, -74.006)).toBe(true);
  });

  it('should reject out-of-range latitude', () => {
    expect(isValidCoordinates(91, 0)).toBe(false);
  });

  it('should reject out-of-range longitude', () => {
    expect(isValidCoordinates(0, 181)).toBe(false);
  });

  it('should reject NaN', () => {
    expect(isValidCoordinates(NaN, 0)).toBe(false);
  });

  it('should reject Infinity', () => {
    expect(isValidCoordinates(Infinity, 0)).toBe(false);
  });
});

describe('isValidSearchQuery', () => {
  it('should accept valid queries', () => {
    expect(isValidSearchQuery('Tokyo')).toBe(true);
  });

  it('should reject too-short queries', () => {
    expect(isValidSearchQuery('a')).toBe(false);
  });

  it('should reject empty queries', () => {
    expect(isValidSearchQuery('')).toBe(false);
  });
});

describe('formatCoordinate', () => {
  it('should format to specified decimals', () => {
    expect(formatCoordinate(40.71283, 2)).toBe('40.71');
  });

  it('should default to 5 decimals', () => {
    expect(formatCoordinate(40.7)).toBe('40.70000');
  });
});

describe('encodeQueryParam', () => {
  it('should encode special characters', () => {
    const result = encodeQueryParam('hello world');
    expect(result).toBe('hello%20world');
  });
});

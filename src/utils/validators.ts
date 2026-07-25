/**
 * Input validation and sanitization utilities.
 * Used for search inputs, URLs, and coordinate values.
 */

/**
 * Sanitizes user input by removing potentially dangerous characters.
 * Strips HTML tags and trims whitespace.
 *
 * @param input - Raw user input string
 * @returns Sanitized string safe for display and API calls
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/[<>"'&]/g, '') // Remove dangerous characters
    .trim();
}

/**
 * Validates that a string is a safe URL (http/https only).
 *
 * @param url - URL string to validate
 * @returns True if the URL is safe
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validates geographic coordinates.
 *
 * @param lat - Latitude value
 * @param lng - Longitude value
 * @returns True if coordinates are within valid ranges
 */
export function isValidCoordinates(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Validates a search query string.
 * Must be non-empty and within length limits.
 *
 * @param query - Search query string
 * @returns True if the query is valid for geocoding
 */
export function isValidSearchQuery(query: string): boolean {
  const sanitized = sanitizeInput(query);
  return sanitized.length >= 2 && sanitized.length <= 200;
}

/**
 * Formats a coordinate value to a fixed number of decimal places.
 *
 * @param value - Coordinate value
 * @param decimals - Number of decimal places (default 5)
 * @returns Formatted coordinate string
 */
export function formatCoordinate(value: number, decimals = 5): string {
  return value.toFixed(decimals);
}

/**
 * Encodes a string for safe use in URL query parameters.
 *
 * @param value - String to encode
 * @returns URL-encoded string
 */
export function encodeQueryParam(value: string): string {
  return encodeURIComponent(sanitizeInput(value));
}

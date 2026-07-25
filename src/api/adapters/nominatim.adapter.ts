/**
 * NominatimAdapter — OpenStreetMap Nominatim geocoding service.
 * Provides location search with rate limiting and input sanitization.
 */

import { apiGet } from '../api-client';
import { NOMINATIM_CONFIG } from '../../config/cesium.config';
import { sanitizeInput, encodeQueryParam } from '../../utils/validators';
import { createLogger } from '../../utils/logger';

const log = createLogger('NominatimAdapter');

/** Raw Nominatim API response item. */
interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
  boundingbox?: string[];
  type?: string;
  importance?: number;
}

/** Standardized search result returned to consumers. */
export interface SearchResult {
  id: string;
  displayName: string;
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  type: string;
  importance: number;
}

let lastRequestTime = 0;

/**
 * Searches for a location using the Nominatim API.
 * Automatically rate-limits to 1 request per second per Nominatim policy.
 *
 * @param query - Search query string
 * @returns Array of search results
 */
export async function searchLocation(query: string): Promise<SearchResult[]> {
  const sanitized = sanitizeInput(query);
  if (sanitized.length < 2) {
    return [];
  }

  // Enforce rate limit
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < NOMINATIM_CONFIG.rateLimitMs) {
    await new Promise((resolve) =>
      setTimeout(resolve, NOMINATIM_CONFIG.rateLimitMs - elapsed),
    );
  }
  lastRequestTime = Date.now();

  const url = `${NOMINATIM_CONFIG.baseUrl}/search?q=${encodeQueryParam(sanitized)}&format=json&addressdetails=1&limit=${NOMINATIM_CONFIG.maxResults}`;

  const response = await apiGet<NominatimResult[]>(url, {
    headers: {
      'User-Agent': NOMINATIM_CONFIG.userAgent,
    },
  });

  if (response.error || !response.data) {
    log.error(`Search failed: ${response.error}`);
    return [];
  }

  return response.data.map(mapToSearchResult);
}

function mapToSearchResult(raw: NominatimResult): SearchResult {
  const address = raw.address;
  return {
    id: String(raw.place_id),
    displayName: raw.display_name,
    latitude: parseFloat(raw.lat),
    longitude: parseFloat(raw.lon),
    city: address?.city ?? address?.town ?? address?.village ?? '',
    country: address?.country ?? '',
    type: raw.type ?? 'unknown',
    importance: raw.importance ?? 0,
  };
}

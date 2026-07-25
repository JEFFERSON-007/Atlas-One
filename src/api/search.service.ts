/**
 * SearchService — High-level search orchestration.
 * Connects the search UI to the Nominatim adapter and camera fly-to.
 */

import { searchLocation, type SearchResult } from './adapters/nominatim.adapter';
import { eventBus } from '../hooks/use-event-bus';
import { createLogger } from '../utils/logger';
import { isValidSearchQuery } from '../utils/validators';

const log = createLogger('SearchService');

/**
 * Performs a location search and emits results via the event bus.
 *
 * @param query - User search query
 * @returns Search results array
 */
export async function performSearch(query: string): Promise<SearchResult[]> {
  if (!isValidSearchQuery(query)) {
    eventBus.emit('notification:show', {
      message: 'Please enter a valid search query (2+ characters)',
      type: 'warn',
    });
    return [];
  }

  try {
    const results = await searchLocation(query);

    if (results.length === 0) {
      eventBus.emit('notification:show', {
        message: `No results found for "${query}"`,
        type: 'info',
      });
    }

    return results;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Search failed';
    log.error(`Search error: ${message}`);
    eventBus.emit('search:error', { message });
    eventBus.emit('notification:show', {
      message: 'Search failed. Please try again.',
      type: 'error',
    });
    return [];
  }
}

/**
 * Flies to a search result and places a marker.
 *
 * @param result - The selected search result
 */
export function flyToResult(result: SearchResult): void {
  eventBus.emit('camera:flyTo', {
    lat: result.latitude,
    lng: result.longitude,
    altitude: 50_000,
  });

  log.info(`Flying to: ${result.displayName}`);
}

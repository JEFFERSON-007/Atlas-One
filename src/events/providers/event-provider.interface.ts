/**
 * Event Provider Interface — Strategy pattern contract for all data sources.
 * Every provider (USGS, NASA FIRMS, etc.) implements this interface.
 * Future providers are plug-and-play with zero engine modifications.
 */

import type { EarthEvent, EventType } from '../earth-event.types';

/** Metadata about an event provider. */
export interface EventProviderInfo {
  /** Unique provider identifier. */
  id: string;
  /** Human-readable display name. */
  name: string;
  /** Event type this provider supplies. */
  eventType: EventType;
  /** Attribution text for UI display. */
  attribution: string;
  /** Recommended polling interval in seconds. */
  updateIntervalSeconds: number;
  /** Whether this provider requires an API key. */
  requiresApiKey: boolean;
  /** Source URL for documentation. */
  sourceUrl: string;
}

/**
 * Interface that all event providers must implement.
 * Handles fetching, normalizing, and validating raw API data
 * into standardized EarthEvent objects.
 */
export interface IEventProvider {
  /** Provider metadata. */
  readonly info: EventProviderInfo;

  /**
   * Fetches and normalizes events from the data source.
   * Must handle its own error recovery and return [] on failure.
   *
   * @returns Normalized earth events
   */
  fetchEvents(): Promise<EarthEvent[]>;

  /**
   * Checks whether the provider is available and properly configured.
   * For key-based providers, verifies the key is set.
   */
  isAvailable(): boolean;

  /**
   * Optional cleanup when the provider is removed.
   */
  dispose?(): void;
}

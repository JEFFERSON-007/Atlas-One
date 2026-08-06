/**
 * Object Provider Interface — Strategy pattern contract for all mobility data sources.
 * Every provider (OpenSky, CelesTrak, ISS, AIS, etc.) implements this interface.
 * Future providers are plug-and-play with zero engine modifications.
 */

import type { DynamicObject, ObjectType } from '../dynamic-object.types';

/** Metadata about a mobility provider. */
export interface ObjectProviderInfo {
  /** Unique provider identifier. */
  id: string;
  /** Human-readable display name. */
  name: string;
  /** Object type this provider supplies. */
  objectType: ObjectType;
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
 * Interface that all mobility providers must implement.
 * Handles fetching, normalizing, and validating raw API data
 * into standardized DynamicObject instances.
 */
export interface IObjectProvider {
  /** Provider metadata. */
  readonly info: ObjectProviderInfo;

  /**
   * Fetches and normalizes objects from the data source.
   * Must handle its own error recovery and return [] on failure.
   *
   * @returns Normalized dynamic objects
   */
  fetchObjects(): Promise<DynamicObject[]>;

  /**
   * Checks whether the provider is available and properly configured.
   */
  isAvailable(): boolean;

  /**
   * Optional cleanup when the provider is removed.
   */
  dispose?(): void;
}

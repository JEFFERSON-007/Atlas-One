/**
 * Geospatial Provider Interface — Strategy pattern contract for all Digital Twin data sources.
 * Every provider (REST Countries, OpenStreetMap Overpass, Hydrology, etc.) implements this interface.
 */

import type { GeospatialEntity, EntityType } from '../entity/geospatial-entity.types';

/** Standardized provider error structure. */
export interface ProviderError {
  providerId: string;
  code: string;
  message: string;
  retryable: boolean;
  timestamp: Date;
}

/** Metadata describing a geospatial provider. */
export interface GeospatialProviderInfo {
  /** Unique provider identifier. */
  id: string;
  /** Human-readable display name. */
  name: string;
  /** Primary entity type this provider supplies. */
  primaryType: EntityType;
  /** Attribution text for UI. */
  attribution: string;
  /** Recommended update frequency in seconds (0 = static dataset). */
  updateIntervalSeconds: number;
  /** Whether provider requires an API key. */
  requiresApiKey: boolean;
  /** Documentation URL. */
  sourceUrl: string;
}

/** Interface that all Digital Twin geospatial data providers must implement. */
export interface IGeospatialProvider {
  /** Provider metadata info. */
  readonly info: GeospatialProviderInfo;

  /**
   * Fetches and normalizes entities from the data source.
   * Must catch its own exceptions and return [] on failure.
   */
  fetchEntities(): Promise<GeospatialEntity[]>;

  /** Checks whether provider is configured and available. */
  isAvailable(): boolean;

  /** Optional cleanup. */
  dispose?(): void;
}

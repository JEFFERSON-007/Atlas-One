/**
 * IEnvironmentalProvider — Interface that all environmental data providers must implement.
 * Mirrors the ILayer contract style. Providers are adapters around external APIs.
 */

import type {
  EnvironmentalVariable,
  DataState,
  EnvironmentalQuery,
  EnvironmentalResult,
} from '../types/environmental.types';

export interface IEnvironmentalProvider {
  /** Provider display name. */
  readonly name: string;

  /** Variables this provider can supply. */
  readonly supportedVariables: EnvironmentalVariable[];

  /** Default DataState for data from this provider. */
  readonly defaultDataState: DataState;

  /** Whether the provider requires an API key. */
  readonly requiresApiKey: boolean;

  /**
   * Fetches environmental data matching the query.
   * Must set DataState on every observation.
   * Must handle its own errors and return empty results on failure.
   */
  fetch(query: EnvironmentalQuery): Promise<EnvironmentalResult>;

  /**
   * Checks if the provider is currently available.
   * Returns false if API is unreachable or credentials are missing.
   */
  isAvailable(): Promise<boolean>;

  /** Cleans up provider resources. */
  dispose(): void;
}

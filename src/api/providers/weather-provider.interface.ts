/**
 * Weather Provider Interface — Defines the contract for all weather data providers.
 * Follows the Strategy pattern so providers can be swapped without modifying consumers.
 */

/** Current weather observation for a specific location. */
export interface WeatherResult {
  /** Latitude of the observation point. */
  latitude: number;
  /** Longitude of the observation point. */
  longitude: number;
  /** Temperature in Celsius. */
  temperature: number;
  /** Relative humidity percentage (0–100). */
  humidity: number;
  /** Atmospheric pressure in hPa. */
  pressure: number;
  /** Wind speed in km/h. */
  windSpeed: number;
  /** Wind direction in degrees (0 = North, 90 = East). */
  windDirection: number;
  /** Provider-specific weather code. */
  weatherCode: number;
  /** Human-readable weather description (e.g. "Partly cloudy"). */
  description: string;
  /** Timestamp of the observation. */
  timestamp: Date;
  /** Name of the provider that supplied this data. */
  provider: string;
}

/** Metadata about a weather provider. */
export interface WeatherProviderInfo {
  /** Unique identifier for the provider. */
  id: string;
  /** Display name. */
  name: string;
  /** Whether this provider requires an API key. */
  requiresApiKey: boolean;
  /** Attribution text to display in the UI. */
  attribution: string;
}

/**
 * Interface that all weather providers must implement.
 * Each provider handles fetching, parsing, and error handling for its own API.
 */
export interface IWeatherProvider {
  /** Provider metadata. */
  readonly info: WeatherProviderInfo;

  /**
   * Fetches current weather for a geographic location.
   *
   * @param latitude - Degrees latitude
   * @param longitude - Degrees longitude
   * @returns Weather observation or null if unavailable
   */
  fetchCurrentWeather(
    latitude: number,
    longitude: number,
  ): Promise<WeatherResult | null>;

  /**
   * Checks whether the provider is available and properly configured.
   * For key-based providers, verifies the key is set.
   */
  isAvailable(): boolean;
}

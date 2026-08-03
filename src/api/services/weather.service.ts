/**
 * WeatherService — Singleton service for fetching and caching weather data.
 * Manages the active weather provider and emits results via the event bus.
 */

import type { IWeatherProvider, WeatherResult } from '../providers/weather-provider.interface';
import { OpenMeteoProvider } from '../providers/open-meteo.provider';
import { eventBus } from '../../hooks/use-event-bus';
import { createLogger } from '../../utils/logger';

const log = createLogger('WeatherService');

/** Cache entry with TTL. */
interface CacheEntry {
  result: WeatherResult;
  expiresAt: number;
}

/** Default cache duration: 30 seconds. */
const CACHE_TTL_MS = 30_000;

/** Precision for cache key rounding (2 decimal places ≈ ~1km). */
const COORD_PRECISION = 2;

/**
 * Rounds a coordinate to the cache precision.
 */
function roundCoord(value: number): number {
  const factor = Math.pow(10, COORD_PRECISION);
  return Math.round(value * factor) / factor;
}

/**
 * Generates a cache key from coordinates.
 */
function cacheKey(lat: number, lng: number): string {
  return `${roundCoord(lat)},${roundCoord(lng)}`;
}

/**
 * Central weather service that manages providers and caches results.
 */
export class WeatherService {
  private provider: IWeatherProvider;
  private readonly cache = new Map<string, CacheEntry>();
  private pendingRequests = new Map<string, Promise<WeatherResult | null>>();

  constructor(provider?: IWeatherProvider) {
    this.provider = provider ?? new OpenMeteoProvider();
    log.info(`Weather service initialized with provider: ${this.provider.info.name}`);
  }

  /**
   * Swaps the active weather provider.
   */
  setProvider(provider: IWeatherProvider): void {
    this.provider = provider;
    this.cache.clear();
    log.info(`Weather provider changed to: ${provider.info.name}`);
  }

  /**
   * Returns the active provider info.
   */
  getProviderInfo(): IWeatherProvider['info'] {
    return this.provider.info;
  }

  /**
   * Fetches weather for a location with caching and deduplication.
   *
   * @param latitude - Degrees latitude
   * @param longitude - Degrees longitude
   * @returns Weather result or null
   */
  async getWeather(latitude: number, longitude: number): Promise<WeatherResult | null> {
    if (!this.provider.isAvailable()) {
      log.warn('Weather provider is not available');
      eventBus.emit('weather:error', { message: 'Weather provider unavailable' });
      return null;
    }

    const key = cacheKey(latitude, longitude);

    // Check cache
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.result;
    }

    // Deduplicate in-flight requests
    const pending = this.pendingRequests.get(key);
    if (pending) {
      return pending;
    }

    // Fetch new data
    const promise = this.fetchAndCache(key, latitude, longitude);
    this.pendingRequests.set(key, promise);

    try {
      return await promise;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Fetches weather and stores in cache.
   */
  private async fetchAndCache(
    key: string,
    latitude: number,
    longitude: number,
  ): Promise<WeatherResult | null> {
    try {
      const result = await this.provider.fetchCurrentWeather(latitude, longitude);

      if (result) {
        this.cache.set(key, {
          result,
          expiresAt: Date.now() + CACHE_TTL_MS,
        });
        eventBus.emit('weather:data', result);
        log.info(`Weather fetched: ${result.temperature}°C, ${result.description}`);
      }

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown weather error';
      log.error(`Weather fetch failed: ${message}`);
      eventBus.emit('weather:error', { message });
      return null;
    }
  }

  /**
   * Clears the weather cache.
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Cleans up expired cache entries.
   */
  pruneCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key);
      }
    }
  }
}

/** Global weather service singleton. */
let _weatherService: WeatherService | null = null;

/**
 * Returns the global weather service instance.
 * Creates one with the default Open-Meteo provider if not yet initialized.
 */
export function getWeatherService(): WeatherService {
  if (!_weatherService) {
    _weatherService = new WeatherService();
  }
  return _weatherService;
}

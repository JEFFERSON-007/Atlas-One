/**
 * WeatherAdapter — Facade over the WeatherService for backward compatibility.
 * Delegates to the pluggable provider system introduced in v0.2.
 * @see https://open-meteo.com/en/docs
 */

import { getWeatherService } from '../services/weather.service';
import type { WeatherResult } from '../providers/weather-provider.interface';

/** Re-export types from the provider interface for backward compatibility. */
export type { WeatherResult as WeatherData } from '../providers/weather-provider.interface';

/** Query parameters for weather data. */
export interface WeatherQuery {
  latitude: number;
  longitude: number;
  units?: 'metric' | 'imperial';
}

/**
 * Fetches current weather data using the active weather provider.
 *
 * @param query - Location and unit preferences
 * @returns Weather result or null if unavailable
 */
export async function fetchWeather(
  query: WeatherQuery,
): Promise<WeatherResult | null> {
  const service = getWeatherService();
  return service.getWeather(query.latitude, query.longitude);
}

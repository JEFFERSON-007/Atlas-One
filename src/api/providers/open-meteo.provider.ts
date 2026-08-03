/**
 * Open-Meteo Weather Provider — Free, no API key required.
 * Uses the Open-Meteo Forecast API for current weather observations.
 * @see https://open-meteo.com/en/docs
 */

import { apiGet } from '../api-client';
import type {
  IWeatherProvider,
  WeatherProviderInfo,
  WeatherResult,
} from './weather-provider.interface';
import { createLogger } from '../../utils/logger';

const log = createLogger('OpenMeteoProvider');

const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

/** Raw response shape from the Open-Meteo API. */
interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    surface_pressure: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    weather_code: number;
  };
}

/**
 * Maps WMO weather codes to human-readable descriptions.
 * @see https://open-meteo.com/en/docs#weathervariables
 */
function describeWeatherCode(code: number): string {
  const descriptions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snowfall',
    73: 'Moderate snowfall',
    75: 'Heavy snowfall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };

  return descriptions[code] ?? 'Unknown';
}

/**
 * Open-Meteo provider implementation.
 * Free tier, globally available, no authentication required.
 */
export class OpenMeteoProvider implements IWeatherProvider {
  readonly info: WeatherProviderInfo = {
    id: 'open-meteo',
    name: 'Open-Meteo',
    requiresApiKey: false,
    attribution: 'Weather data by Open-Meteo.com',
  };

  isAvailable(): boolean {
    // Open-Meteo is always available (no key needed)
    return true;
  }

  async fetchCurrentWeather(
    latitude: number,
    longitude: number,
  ): Promise<WeatherResult | null> {
    const params = new URLSearchParams({
      latitude: latitude.toFixed(4),
      longitude: longitude.toFixed(4),
      current: [
        'temperature_2m',
        'relative_humidity_2m',
        'surface_pressure',
        'wind_speed_10m',
        'wind_direction_10m',
        'weather_code',
      ].join(','),
      timezone: 'auto',
    });

    const url = `${BASE_URL}?${params.toString()}`;
    const response = await apiGet<OpenMeteoResponse>(url, { timeout: 8000, retries: 1 });

    if (response.error || !response.data) {
      log.warn(`Open-Meteo request failed: ${response.error ?? 'No data'}`);
      return null;
    }

    const data = response.data;
    const current = data.current;

    return {
      latitude: data.latitude,
      longitude: data.longitude,
      temperature: current.temperature_2m,
      humidity: current.relative_humidity_2m,
      pressure: current.surface_pressure,
      windSpeed: current.wind_speed_10m,
      windDirection: current.wind_direction_10m,
      weatherCode: current.weather_code,
      description: describeWeatherCode(current.weather_code),
      timestamp: new Date(current.time),
      provider: this.info.id,
    };
  }
}

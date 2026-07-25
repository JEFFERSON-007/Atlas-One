/**
 * WeatherAdapter — Open-Meteo API stub.
 * Future-ready module with types defined but no implementation.
 * Designed for the Open-Meteo free weather API.
 */

/** Current weather data point. */
export interface WeatherData {
  latitude: number;
  longitude: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  weatherCode: number;
  description: string;
  timestamp: Date;
}

/** Query parameters for weather data. */
export interface WeatherQuery {
  latitude: number;
  longitude: number;
  units?: 'metric' | 'imperial';
}

/**
 * Fetches current weather data from Open-Meteo.
 *
 * @stub This is a placeholder for future implementation.
 * @see https://open-meteo.com/en/docs
 */
export async function fetchWeather(
  _query: WeatherQuery,
): Promise<WeatherData | null> {
  // Future implementation will call:
  // https://api.open-meteo.com/v1/forecast?latitude=...&longitude=...
  return null;
}

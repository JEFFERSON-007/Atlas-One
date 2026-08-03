import { describe, it, expect, beforeEach } from 'vitest';
import { WeatherService } from '../../api/services/weather.service';
import type { IWeatherProvider, WeatherResult } from '../../api/providers/weather-provider.interface';

class MockWeatherProvider implements IWeatherProvider {
  readonly info = {
    id: 'mock',
    name: 'Mock Provider',
    requiresApiKey: false,
    attribution: 'Mock data',
  };

  available = true;
  callCount = 0;

  isAvailable(): boolean {
    return this.available;
  }

  fetchCurrentWeather(latitude: number, longitude: number): Promise<WeatherResult | null> {
    this.callCount++;
    return Promise.resolve({
      latitude,
      longitude,
      temperature: 22.5,
      humidity: 65,
      pressure: 1013.25,
      windSpeed: 12.0,
      windDirection: 180,
      weatherCode: 0,
      description: 'Clear sky',
      timestamp: new Date('2026-08-03T12:00:00Z'),
      provider: 'mock',
    });
  }
}

describe('WeatherService', () => {
  let mockProvider: MockWeatherProvider;
  let service: WeatherService;

  beforeEach(() => {
    mockProvider = new MockWeatherProvider();
    service = new WeatherService(mockProvider);
  });

  it('should fetch weather data from active provider', async () => {
    const data = await service.getWeather(40.7128, -74.006);
    expect(data).not.toBeNull();
    expect(data?.temperature).toBe(22.5);
    expect(data?.description).toBe('Clear sky');
    expect(mockProvider.callCount).toBe(1);
  });

  it('should cache weather results for nearby coordinates within TTL', async () => {
    const data1 = await service.getWeather(40.7128, -74.006);
    const data2 = await service.getWeather(40.7129, -74.0061); // Rounded to 40.71, -74.01
    expect(data1).toEqual(data2);
    expect(mockProvider.callCount).toBe(1); // Served from cache
  });

  it('should return null when provider is unavailable', async () => {
    mockProvider.available = false;
    const data = await service.getWeather(40.7128, -74.006);
    expect(data).toBeNull();
  });

  it('should allow clearing the cache', async () => {
    await service.getWeather(40.7128, -74.006);
    expect(mockProvider.callCount).toBe(1);

    service.clearCache();
    await service.getWeather(40.7128, -74.006);
    expect(mockProvider.callCount).toBe(2);
  });

  it('should support swapping weather providers', () => {
    const newProvider: IWeatherProvider = {
      info: { id: 'new', name: 'New Provider', requiresApiKey: false, attribution: '' },
      fetchCurrentWeather: () => Promise.resolve(null),
      isAvailable: () => true,
    };
    service.setProvider(newProvider);
    expect(service.getProviderInfo().id).toBe('new');
  });
});

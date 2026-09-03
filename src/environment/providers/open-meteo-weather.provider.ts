/**
 * Open-Meteo Weather Provider — Temperature, wind, precipitation, humidity, pressure.
 * Free API, no key required. https://open-meteo.com
 */

import { createLogger } from '../../utils/logger';
import type { IEnvironmentalProvider } from './environmental-provider.interface';
import {
  EnvironmentalVariable,
  DataState,
  DataQuality,
  type EnvironmentalQuery,
  type EnvironmentalResult,
  type EnvironmentalObservation,
} from '../types/environmental.types';

const log = createLogger('OpenMeteoProvider');

const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

/** Variables to Open-Meteo parameter mapping. */
const VARIABLE_MAP: Partial<Record<EnvironmentalVariable, string>> = {
  [EnvironmentalVariable.Temperature]: 'temperature_2m',
  [EnvironmentalVariable.Humidity]: 'relative_humidity_2m',
  [EnvironmentalVariable.WindSpeed]: 'wind_speed_10m',
  [EnvironmentalVariable.WindDirection]: 'wind_direction_10m',
  [EnvironmentalVariable.Precipitation]: 'precipitation',
  [EnvironmentalVariable.Pressure]: 'surface_pressure',
  [EnvironmentalVariable.SnowDepth]: 'snow_depth',
  [EnvironmentalVariable.SnowCover]: 'snowfall',
};

const UNIT_MAP: Partial<Record<EnvironmentalVariable, string>> = {
  [EnvironmentalVariable.Temperature]: '°C',
  [EnvironmentalVariable.Humidity]: '%',
  [EnvironmentalVariable.WindSpeed]: 'm/s',
  [EnvironmentalVariable.WindDirection]: '°',
  [EnvironmentalVariable.Precipitation]: 'mm',
  [EnvironmentalVariable.Pressure]: 'hPa',
  [EnvironmentalVariable.SnowDepth]: 'm',
  [EnvironmentalVariable.SnowCover]: 'cm',
};

export class OpenMeteoWeatherProvider implements IEnvironmentalProvider {
  readonly name = 'open-meteo';
  readonly supportedVariables = [
    EnvironmentalVariable.Temperature,
    EnvironmentalVariable.Humidity,
    EnvironmentalVariable.WindSpeed,
    EnvironmentalVariable.WindDirection,
    EnvironmentalVariable.Precipitation,
    EnvironmentalVariable.Pressure,
    EnvironmentalVariable.SnowDepth,
    EnvironmentalVariable.SnowCover,
  ];
  readonly defaultDataState = DataState.LIVE;
  readonly requiresApiKey = false;

  async fetch(query: EnvironmentalQuery): Promise<EnvironmentalResult> {
    const paramName = VARIABLE_MAP[query.variable];
    if (!paramName) {
      return this.emptyResult();
    }

    // Grid-based fetch: generate sample points within bounds
    const points = this.generateGridPoints(query);
    if (points.length === 0) {
      return this.emptyResult();
    }

    const observations: EnvironmentalObservation[] = [];
    const now = new Date();

    // Batch queries (Open-Meteo supports single lat/lon per call, so we batch)
    const batchSize = Math.min(points.length, 25); // Limit concurrent requests
    const batchPoints = points.slice(0, batchSize);

    const fetchPromises = batchPoints.map(async (point) => {
      try {
        const url = `${BASE_URL}?latitude=${point.lat}&longitude=${point.lon}` +
          `&current=${paramName}&wind_speed_unit=ms&timezone=auto`;

        const response = await fetch(url);
        if (!response.ok) return null;

        const data = await response.json();
        if (!data.current || data.current[paramName] === undefined) return null;

        const obs: EnvironmentalObservation = {
          id: `open-meteo-${query.variable}-${point.lat.toFixed(2)}-${point.lon.toFixed(2)}`,
          dataset: 'open-meteo-current',
          variable: query.variable,
          latitude: data.latitude ?? point.lat,
          longitude: data.longitude ?? point.lon,
          altitude: data.elevation ?? null,
          value: data.current[paramName],
          unit: UNIT_MAP[query.variable] ?? '',
          timestamp: new Date(data.current.time),
          startTime: null,
          endTime: null,
          resolution: 0.25,
          source: 'https://open-meteo.com',
          quality: DataQuality.High,
          confidence: 0.9,
          dataState: DataState.LIVE,
          metadata: { elevation: data.elevation },
        };

        return obs;
      } catch (error) {
        log.warn(`Failed to fetch point ${point.lat},${point.lon}:`, error);
        return null;
      }
    });

    const results = await Promise.allSettled(fetchPromises);
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        observations.push(result.value);
      }
    }

    log.info(`Fetched ${observations.length} ${query.variable} observations from Open-Meteo`);

    return {
      observations,
      provider: this.name,
      fetchedAt: now,
      dataState: DataState.LIVE,
      totalCount: observations.length,
      isTruncated: points.length > batchSize,
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${BASE_URL}?latitude=0&longitude=0&current=temperature_2m`);
      return response.ok;
    } catch {
      return false;
    }
  }

  dispose(): void {
    // No resources to clean up
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private generateGridPoints(query: EnvironmentalQuery): Array<{ lat: number; lon: number }> {
    const points: Array<{ lat: number; lon: number }> = [];

    if (query.center) {
      // Single point query
      points.push({ lat: query.center.latitude, lon: query.center.longitude });
      return points;
    }

    if (query.bounds) {
      // Grid within bounds — ~5° spacing for global, ~2° for regional
      const latSpan = query.bounds.north - query.bounds.south;
      const lonSpan = query.bounds.east - query.bounds.west;
      const step = Math.max(2, Math.min(10, Math.max(latSpan, lonSpan) / 5));

      for (let lat = query.bounds.south; lat <= query.bounds.north; lat += step) {
        for (let lon = query.bounds.west; lon <= query.bounds.east; lon += step) {
          points.push({ lat: Math.round(lat * 10) / 10, lon: Math.round(lon * 10) / 10 });
        }
      }
    }

    // Fallback: major global points
    if (points.length === 0) {
      const globalLats = [-60, -30, 0, 30, 60];
      const globalLons = [-150, -90, -30, 30, 90, 150];
      for (const lat of globalLats) {
        for (const lon of globalLons) {
          points.push({ lat, lon });
        }
      }
    }

    return points;
  }

  private emptyResult(): EnvironmentalResult {
    return {
      observations: [],
      provider: this.name,
      fetchedAt: new Date(),
      dataState: DataState.UNAVAILABLE,
      totalCount: 0,
      isTruncated: false,
    };
  }
}

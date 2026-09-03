/**
 * OpenAQ Air Quality Provider — AQI, PM2.5, PM10, NO2, O3, SO2, CO.
 * Public API v3, no key required for basic queries.
 * https://docs.openaq.org/
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

const log = createLogger('OpenAQProvider');

const BASE_URL = 'https://api.openaq.org/v3';

/** Maps our variables to OpenAQ parameter names. */
const VARIABLE_PARAM_MAP: Partial<Record<EnvironmentalVariable, string>> = {
  [EnvironmentalVariable.PM25]: 'pm25',
  [EnvironmentalVariable.PM10]: 'pm10',
  [EnvironmentalVariable.NO2]: 'no2',
  [EnvironmentalVariable.O3]: 'o3',
  [EnvironmentalVariable.SO2]: 'so2',
  [EnvironmentalVariable.CO]: 'co',
};

export class OpenAQAirQualityProvider implements IEnvironmentalProvider {
  readonly name = 'openaq';
  readonly supportedVariables = [
    EnvironmentalVariable.AirQualityIndex,
    EnvironmentalVariable.PM25,
    EnvironmentalVariable.PM10,
    EnvironmentalVariable.NO2,
    EnvironmentalVariable.O3,
    EnvironmentalVariable.SO2,
    EnvironmentalVariable.CO,
  ];
  readonly defaultDataState = DataState.LIVE;
  readonly requiresApiKey = false;

  async fetch(query: EnvironmentalQuery): Promise<EnvironmentalResult> {
    const now = new Date();
    const observations: EnvironmentalObservation[] = [];

    try {
      let url = `${BASE_URL}/locations?limit=${query.limit ?? 50}`;

      if (query.bounds) {
        // OpenAQ v3 uses bbox parameter
        url += `&bbox=${query.bounds.west},${query.bounds.south},${query.bounds.east},${query.bounds.north}`;
      } else if (query.center && query.radiusKm) {
        url += `&coordinates=${query.center.latitude},${query.center.longitude}&radius=${query.radiusKm * 1000}`;
      }

      // Filter by parameter if not AQI (AQI is derived from all parameters)
      const paramName = VARIABLE_PARAM_MAP[query.variable];
      if (paramName) {
        url += `&parameter=${paramName}`;
      }

      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        log.warn(`OpenAQ returned ${response.status}`);
        return this.emptyResult();
      }

      const data = await response.json();
      const results = data.results ?? [];

      for (const location of results) {
        if (!location.coordinates?.latitude || !location.coordinates?.longitude) continue;

        const parameters = location.parameters ?? [];
        for (const param of parameters) {
          const variable = this.mapParameterToVariable(param.name ?? param.parameter);
          if (!variable) continue;

          // If user asked for a specific variable, skip others
          if (query.variable !== EnvironmentalVariable.AirQualityIndex && variable !== query.variable) {
            continue;
          }

          const obs: EnvironmentalObservation = {
            id: `openaq-${location.id}-${param.id ?? param.name}`,
            dataset: 'openaq-v3',
            variable,
            latitude: location.coordinates.latitude,
            longitude: location.coordinates.longitude,
            altitude: null,
            value: param.lastValue ?? param.average ?? 0,
            unit: param.unit ?? 'µg/m³',
            timestamp: param.lastUpdated ? new Date(param.lastUpdated) : now,
            startTime: null,
            endTime: null,
            resolution: null,
            source: 'https://openaq.org',
            quality: DataQuality.Medium,
            confidence: 0.8,
            dataState: DataState.LIVE,
            metadata: {
              stationName: location.name,
              stationId: location.id,
              country: location.country?.code,
              provider: location.provider?.name,
            },
          };

          observations.push(obs);
        }
      }

      log.info(`Fetched ${observations.length} air quality observations from OpenAQ`);
    } catch (error) {
      log.error('OpenAQ fetch failed:', error);
      return this.emptyResult();
    }

    return {
      observations,
      provider: this.name,
      fetchedAt: now,
      dataState: DataState.LIVE,
      totalCount: observations.length,
      isTruncated: false,
    };
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${BASE_URL}/locations?limit=1`);
      return response.ok;
    } catch {
      return false;
    }
  }

  dispose(): void {}

  private mapParameterToVariable(paramName: string): EnvironmentalVariable | null {
    const lower = paramName.toLowerCase();
    if (lower === 'pm25' || lower === 'pm2.5') return EnvironmentalVariable.PM25;
    if (lower === 'pm10') return EnvironmentalVariable.PM10;
    if (lower === 'no2') return EnvironmentalVariable.NO2;
    if (lower === 'o3') return EnvironmentalVariable.O3;
    if (lower === 'so2') return EnvironmentalVariable.SO2;
    if (lower === 'co') return EnvironmentalVariable.CO;
    return null;
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

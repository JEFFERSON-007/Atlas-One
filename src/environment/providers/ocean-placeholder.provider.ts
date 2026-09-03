/**
 * Ocean Placeholder Provider — Structured adapter for future NOAA/Copernicus integration.
 * Returns UNAVAILABLE gracefully until a backend proxy is configured.
 * Demonstrates the adapter interface pattern for key-required services.
 */

import { createLogger } from '../../utils/logger';
import type { IEnvironmentalProvider } from './environmental-provider.interface';
import {
  EnvironmentalVariable,
  DataState,
  type EnvironmentalQuery,
  type EnvironmentalResult,
} from '../types/environmental.types';

const log = createLogger('OceanPlaceholderProvider');

export class OceanPlaceholderProvider implements IEnvironmentalProvider {
  readonly name = 'ocean-placeholder';
  readonly supportedVariables = [
    EnvironmentalVariable.SeaSurfaceTemperature,
    EnvironmentalVariable.OceanCurrentSpeed,
    EnvironmentalVariable.OceanCurrentDirection,
    EnvironmentalVariable.WaveHeight,
    EnvironmentalVariable.Chlorophyll,
  ];
  readonly defaultDataState = DataState.UNAVAILABLE;
  readonly requiresApiKey = true; // NOAA/Copernicus require credentials

  async fetch(_query: EnvironmentalQuery): Promise<EnvironmentalResult> {
    log.info(
      'Ocean data requires a backend proxy (NOAA ERDDAP / Copernicus Marine). ' +
      'Configure a secure proxy endpoint in production.'
    );

    return {
      observations: [],
      provider: this.name,
      fetchedAt: new Date(),
      dataState: DataState.UNAVAILABLE,
      totalCount: 0,
      isTruncated: false,
    };
  }

  async isAvailable(): Promise<boolean> {
    // Always returns false until a backend proxy is configured
    return false;
  }

  dispose(): void {}
}

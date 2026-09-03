/**
 * NASA FIRMS Active Fire Provider — Fire Radiative Power (FRP).
 * Uses the public NRT JSON endpoint (no key for basic access).
 * Higher resolution requires a backend proxy with MAP_KEY.
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

const log = createLogger('FIRMSProvider');

// Public endpoint for VIIRS NRT data (last 24h, global)
const FIRMS_URL = 'https://firms.modaps.eosdis.nasa.gov/api/area/csv/VIIRS_SNPP_NRT';

export class FIRMSActiveFireProvider implements IEnvironmentalProvider {
  readonly name = 'nasa-firms';
  readonly supportedVariables = [
    EnvironmentalVariable.FireRadiativePower,
  ];
  readonly defaultDataState = DataState.LIVE;
  readonly requiresApiKey = false; // Basic NRT endpoint is public

  async fetch(query: EnvironmentalQuery): Promise<EnvironmentalResult> {
    const now = new Date();
    const observations: EnvironmentalObservation[] = [];

    try {
      // Use area query if bounds are available
      let url: string;
      if (query.bounds) {
        const area = `${query.bounds.west},${query.bounds.south},${query.bounds.east},${query.bounds.north}`;
        url = `${FIRMS_URL}/${area}/1`;
      } else {
        // World extent, last 24h
        url = `${FIRMS_URL}/-180,-90,180,90/1`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        // FIRMS may require MAP_KEY — fall back gracefully
        log.warn(`FIRMS returned ${response.status}. A MAP_KEY may be required for this endpoint.`);
        return this.emptyResult('FIRMS may require a MAP_KEY for direct API access. Configure a backend proxy for production.');
      }

      const csvText = await response.text();
      const lines = csvText.split('\n');

      if (lines.length < 2) {
        return this.emptyResult();
      }

      const firstLine = lines[0];
      if (!firstLine) return this.emptyResult();
      const headers = firstLine.split(',').map(h => h.trim().toLowerCase());
      const latIdx = headers.indexOf('latitude');
      const lonIdx = headers.indexOf('longitude');
      const frpIdx = headers.indexOf('frp');
      const dateIdx = headers.indexOf('acq_date');
      const timeIdx = headers.indexOf('acq_time');
      const confIdx = headers.indexOf('confidence');

      if (latIdx === -1 || lonIdx === -1) {
        log.warn('FIRMS CSV missing required columns');
        return this.emptyResult();
      }

      // Limit to 500 points for performance
      const maxPoints = Math.min(lines.length - 1, query.limit ?? 500);

      for (let i = 1; i <= maxPoints; i++) {
        const cols = lines[i]?.split(',');
        if (!cols || cols.length < Math.max(latIdx, lonIdx) + 1) continue;

        const lat = parseFloat(cols[latIdx] ?? '');
        const lon = parseFloat(cols[lonIdx] ?? '');
        if (isNaN(lat) || isNaN(lon)) continue;

        const frp = frpIdx !== -1 ? parseFloat(cols[frpIdx] ?? '') : 0;
        const dateStr = dateIdx !== -1 ? cols[dateIdx] : '';
        const timeStr = timeIdx !== -1 ? cols[timeIdx] : '0000';
        const confStr = confIdx !== -1 ? cols[confIdx]?.trim() : '';

        let timestamp = now;
        if (dateStr) {
          const timePadded = (timeStr ?? '0000').padStart(4, '0');
          timestamp = new Date(`${dateStr}T${timePadded.slice(0, 2)}:${timePadded.slice(2, 4)}:00Z`);
          if (isNaN(timestamp.getTime())) timestamp = now;
        }

        const confidence = confStr === 'high' ? 0.9 : confStr === 'nominal' ? 0.7 : 0.5;

        const obs: EnvironmentalObservation = {
          id: `firms-${lat.toFixed(3)}-${lon.toFixed(3)}-${i}`,
          dataset: 'nasa-firms-viirs-nrt',
          variable: EnvironmentalVariable.Wildfires,
          latitude: lat,
          longitude: lon,
          altitude: null,
          value: isNaN(frp) ? 0 : frp,
          unit: 'MW',
          timestamp,
          startTime: null,
          endTime: null,
          resolution: 0.00375, // 375m VIIRS resolution
          source: 'https://firms.modaps.eosdis.nasa.gov',
          quality: DataQuality.High,
          confidence,
          dataState: DataState.LIVE,
          metadata: {},
        };

        observations.push(obs);
      }

      log.info(`Fetched ${observations.length} active fire observations from FIRMS`);
    } catch (error) {
      log.error('FIRMS fetch failed:', error);
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
      // Simple health check — short area, just see if endpoint responds
      const response = await fetch(`${FIRMS_URL}/0,0,1,1/1`);
      return response.ok;
    } catch {
      return false;
    }
  }

  dispose(): void {}

  private emptyResult(message?: string): EnvironmentalResult {
    if (message) log.info(message);
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

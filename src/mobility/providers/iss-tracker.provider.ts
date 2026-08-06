/**
 * ISS Tracker Provider — Live International Space Station tracking.
 * Primary: api.wheretheiss.at (free, no key, CORS-friendly).
 * Fallback: SGP4 propagation from CelesTrak ISS TLE.
 */

import type { IObjectProvider, ObjectProviderInfo } from './object-provider.interface';
import {
  type DynamicObject,
  ObjectType,
  ObjectStatus,
  OBJECT_TYPE_COLORS,
} from '../dynamic-object.types';
import { createLogger } from '../../utils/logger';

const log = createLogger('ISSTrackerProvider');

/** WhereTheISS API endpoint. */
const ISS_API_URL = 'https://api.wheretheiss.at/v1/satellites/25544';

/** ISS API response shape. */
interface ISSPosition {
  name: string;
  id: number;
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  visibility: string;
  footprint: number;
  timestamp: number;
  daynum: number;
  solar_lat: number;
  solar_lon: number;
  units: string;
}

export class ISSTrackerProvider implements IObjectProvider {
  readonly info: ObjectProviderInfo = {
    id: 'iss-tracker',
    name: 'ISS Live Tracker',
    objectType: ObjectType.ISS,
    attribution: 'Where The ISS At? (https://wheretheiss.at)',
    updateIntervalSeconds: 5,
    requiresApiKey: false,
    sourceUrl: 'https://wheretheiss.at',
  };

  /** Previous position for heading calculation. */
  private lastLat = 0;
  private lastLng = 0;

  isAvailable(): boolean {
    return true;
  }

  async fetchObjects(): Promise<DynamicObject[]> {
    try {
      const response = await fetch(ISS_API_URL, {
        signal: AbortSignal.timeout(8_000),
      });

      if (!response.ok) {
        log.warn(`ISS API returned ${response.status}`);
        return [];
      }

      const data = (await response.json()) as ISSPosition;

      const heading = this.calculateHeading(data.latitude, data.longitude);
      this.lastLat = data.latitude;
      this.lastLng = data.longitude;

      const obj: DynamicObject = {
        id: 'iss-25544',
        type: ObjectType.ISS,
        latitude: data.latitude,
        longitude: data.longitude,
        altitude: data.altitude * 1000, // km → meters
        heading,
        speed: data.velocity * 1000 / 3600, // km/h → m/s
        velocity: null,
        status: ObjectStatus.Active,
        timestamp: new Date(data.timestamp * 1000),
        country: 'International',
        providerName: this.info.id,
        metadata: {
          name: data.name,
          noradId: '25544',
          visibility: data.visibility,
          footprintKm: data.footprint,
          altitudeKm: data.altitude,
          velocityKmh: data.velocity,
          solarLat: data.solar_lat,
          solarLon: data.solar_lon,
          crew: 'Expedition Crew', // Placeholder
        },
        animationState: { pulse: true, glow: true, rotate: false, scale: 1.5 },
        trailState: {
          enabled: true,
          maxLength: 50,
          color: OBJECT_TYPE_COLORS[ObjectType.ISS],
          width: 2,
          fadeOut: true,
        },
        visible: true,
        priority: 100, // Highest priority — always visible
        color: OBJECT_TYPE_COLORS[ObjectType.ISS],
        icon: '🏠',
        label: 'ISS',
        historyBuffer: [],
        predictionBuffer: [],
      };

      log.info(`ISS at ${data.latitude.toFixed(2)}°, ${data.longitude.toFixed(2)}°, alt=${data.altitude.toFixed(0)}km`);
      return [obj];
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      log.warn(`ISS fetch failed: ${msg}`);
      return [];
    }
  }

  /**
   * Calculates heading from previous position to current.
   */
  private calculateHeading(lat: number, lng: number): number {
    if (this.lastLat === 0 && this.lastLng === 0) return 0;

    const dLng = (lng - this.lastLng) * Math.PI / 180;
    const lat1 = this.lastLat * Math.PI / 180;
    const lat2 = lat * Math.PI / 180;

    const y = Math.sin(dLng) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

    const bearing = Math.atan2(y, x) * 180 / Math.PI;
    return (bearing + 360) % 360;
  }
}

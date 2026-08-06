/**
 * CelesTrak Satellite Provider — Satellite tracking via TLE data + SGP4 propagation.
 * Uses CelesTrak GP API (JSON format) + satellite.js for local orbit propagation.
 * Free, no API key required.
 *
 * Architecture:
 * 1. Fetch TLE data from CelesTrak (every 4 hours)
 * 2. Propagate positions locally using satellite.js SGP4 (every call)
 */

import type { IObjectProvider, ObjectProviderInfo } from './object-provider.interface';
import {
  type DynamicObject,
  ObjectType,
  ObjectStatus,
  OrbitType,
  OBJECT_TYPE_COLORS,
} from '../dynamic-object.types';
import { createLogger } from '../../utils/logger';

const log = createLogger('CelesTrakProvider');

/** CelesTrak GP API endpoints for different satellite groups. */
const TLE_SOURCES: Record<string, { url: string; type: ObjectType; label: string }> = {
  stations: {
    url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle',
    type: ObjectType.ISS,
    label: 'Space Stations',
  },
  starlink: {
    url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=starlink&FORMAT=tle',
    type: ObjectType.Starlink,
    label: 'Starlink',
  },
  gps: {
    url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=gps-ops&FORMAT=tle',
    type: ObjectType.GPS,
    label: 'GPS Constellation',
  },
  glonass: {
    url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=glo-ops&FORMAT=tle',
    type: ObjectType.GLONASS,
    label: 'GLONASS',
  },
  galileo: {
    url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=galileo&FORMAT=tle',
    type: ObjectType.Galileo,
    label: 'Galileo',
  },
  beidou: {
    url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=beidou&FORMAT=tle',
    type: ObjectType.BeiDou,
    label: 'BeiDou',
  },
  active: {
    url: 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle',
    type: ObjectType.Satellite,
    label: 'Active Satellites',
  },
};

/** Parsed TLE entry. */
interface TLEEntry {
  name: string;
  line1: string;
  line2: string;
  type: ObjectType;
  noradId: string;
}

/** CORS proxy fallback URLs. */
const CORS_PROXIES = [
  '',
  'https://corsproxy.io/?',
];

/**
 * Determines orbit type from altitude in km.
 */
function classifyOrbit(altKm: number): OrbitType {
  if (altKm < 2000) return OrbitType.LEO;
  if (altKm < 35786 - 200) return OrbitType.MEO;
  if (altKm < 35786 + 200) return OrbitType.GEO;
  return OrbitType.HEO;
}

export class CelesTrakSatelliteProvider implements IObjectProvider {
  readonly info: ObjectProviderInfo = {
    id: 'celestrak-satellites',
    name: 'CelesTrak — Satellite Tracker',
    objectType: ObjectType.Satellite,
    attribution: '© CelesTrak (https://celestrak.org)',
    updateIntervalSeconds: 30,
    requiresApiKey: false,
    sourceUrl: 'https://celestrak.org',
  };

  /** Cached TLE data — refreshed every 4 hours. */
  private tleCache: TLEEntry[] = [];
  private tleCacheTime = 0;
  private readonly TLE_CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

  /** satellite.js module (dynamically imported). */
  private satLib: typeof import('satellite.js') | null = null;

  isAvailable(): boolean {
    return true;
  }

  async fetchObjects(): Promise<DynamicObject[]> {
    // Lazy-load satellite.js
    if (!this.satLib) {
      try {
        this.satLib = await import('satellite.js');
      } catch {
        log.warn('Failed to import satellite.js — satellite tracking unavailable');
        return [];
      }
    }

    // Refresh TLE cache if stale
    if (Date.now() - this.tleCacheTime > this.TLE_CACHE_TTL || this.tleCache.length === 0) {
      await this.refreshTLECache();
    }

    if (this.tleCache.length === 0) {
      return [];
    }

    // Propagate all cached TLEs to current time
    const now = new Date();
    const objects: DynamicObject[] = [];

    for (const tle of this.tleCache) {
      const obj = this.propagateTLE(tle, now);
      if (obj) objects.push(obj);
    }

    log.info(`Propagated ${objects.length} satellites`);
    return objects;
  }

  /**
   * Fetches and parses TLE data from CelesTrak for selected groups.
   */
  private async refreshTLECache(): Promise<void> {
    const newCache: TLEEntry[] = [];

    // Fetch selected groups (not 'active' — too many)
    const groups = ['stations', 'starlink', 'gps', 'glonass', 'galileo', 'beidou'];

    for (const group of groups) {
      const source = TLE_SOURCES[group];
      if (!source) continue;

      const tles = await this.fetchTLEGroup(source.url, source.type);

      // Limit Starlink to 100 (there are thousands)
      if (group === 'starlink') {
        newCache.push(...tles.slice(0, 100));
      } else {
        newCache.push(...tles);
      }
    }

    if (newCache.length > 0) {
      this.tleCache = newCache;
      this.tleCacheTime = Date.now();
      log.info(`TLE cache refreshed: ${newCache.length} satellites`);
    }
  }

  /**
   * Fetches TLE text from a CelesTrak URL and parses into TLEEntry[].
   */
  private async fetchTLEGroup(url: string, type: ObjectType): Promise<TLEEntry[]> {
    for (const proxy of CORS_PROXIES) {
      try {
        const fetchUrl = proxy
          ? `${proxy}${encodeURIComponent(url)}`
          : url;

        const response = await fetch(fetchUrl, {
          signal: AbortSignal.timeout(15_000),
        });

        if (!response.ok) continue;

        const text = await response.text();
        return this.parseTLEText(text, type);
      } catch {
        // Try next proxy
      }
    }
    return [];
  }

  /**
   * Parses raw TLE text (3-line format) into TLEEntry[].
   */
  private parseTLEText(text: string, type: ObjectType): TLEEntry[] {
    const lines = text.trim().split('\n').map((l) => l.trim());
    const entries: TLEEntry[] = [];

    for (let i = 0; i + 2 < lines.length; i += 3) {
      const name = lines[i];
      const line1 = lines[i + 1];
      const line2 = lines[i + 2];

      if (!name || !line1?.startsWith('1 ') || !line2?.startsWith('2 ')) continue;

      const noradId = line1.substring(2, 7).trim();

      entries.push({ name, line1, line2, type, noradId });
    }

    return entries;
  }

  /**
   * Propagates a single TLE to a given time using satellite.js SGP4.
   */
  private propagateTLE(tle: TLEEntry, time: Date): DynamicObject | null {
    if (!this.satLib) return null;

    try {
      const satrec = this.satLib.twoline2satrec(tle.line1, tle.line2);
      const posVel = this.satLib.propagate(satrec, time);

      if (
        typeof posVel.position === 'boolean' ||
        !posVel.position ||
        typeof posVel.velocity === 'boolean' ||
        !posVel.velocity
      ) {
        return null;
      }

      const gmst = this.satLib.gstime(time);
      const geo = this.satLib.eciToGeodetic(posVel.position, gmst);

      const latDeg = this.satLib.degreesLat(geo.latitude);
      const lngDeg = this.satLib.degreesLong(geo.longitude);
      const altKm = geo.height;

      if (Number.isNaN(latDeg) || Number.isNaN(lngDeg) || Number.isNaN(altKm)) {
        return null;
      }

      const speedKms = Math.sqrt(
        posVel.velocity.x ** 2 +
        posVel.velocity.y ** 2 +
        posVel.velocity.z ** 2,
      );

      const orbit = classifyOrbit(altKm);
      const color = OBJECT_TYPE_COLORS[tle.type];

      return {
        id: `celestrak-${tle.noradId}`,
        type: tle.type,
        latitude: latDeg,
        longitude: lngDeg,
        altitude: altKm * 1000, // Convert to meters
        heading: 0,
        speed: speedKms * 1000, // Convert to m/s
        velocity: {
          vx: posVel.velocity.x * 1000,
          vy: posVel.velocity.y * 1000,
          vz: posVel.velocity.z * 1000,
        },
        status: ObjectStatus.Active,
        timestamp: time,
        country: '',
        providerName: this.info.id,
        metadata: {
          noradId: tle.noradId,
          name: tle.name,
          orbitType: orbit,
          altitudeKm: altKm,
          speedKms,
          tleLine1: tle.line1,
          tleLine2: tle.line2,
        },
        animationState: { pulse: false, glow: true, rotate: false, scale: 1.0 },
        trailState: {
          enabled: false,
          maxLength: 20,
          color,
          width: 1,
          fadeOut: true,
        },
        visible: true,
        priority: tle.type === ObjectType.ISS ? 10 : 1,
        color,
        icon: '🛰️',
        label: tle.name,
        historyBuffer: [],
        predictionBuffer: [],
      };
    } catch {
      return null;
    }
  }
}

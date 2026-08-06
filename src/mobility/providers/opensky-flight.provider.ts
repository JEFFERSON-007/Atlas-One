/**
 * OpenSky Flight Provider — Live aircraft tracking via OpenSky Network REST API.
 * Free, no API key required for anonymous access.
 * Returns ~5,000–12,000 live aircraft positions worldwide.
 *
 * API Docs: https://openskynetwork.github.io/opensky-api/rest.html
 */

import type { IObjectProvider, ObjectProviderInfo } from './object-provider.interface';
import {
  type DynamicObject,
  ObjectType,
  ObjectStatus,
  OBJECT_TYPE_COLORS,
} from '../dynamic-object.types';
import { createLogger } from '../../utils/logger';

const log = createLogger('OpenSkyProvider');

/** OpenSky API base URL. */
const API_URL = 'https://opensky-network.org/api/states/all';

/** CORS proxy fallback. */
const CORS_PROXIES = [
  '', // Direct first
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
];

/**
 * Raw state vector from OpenSky API.
 * Fields documented at: https://openskynetwork.github.io/opensky-api/rest.html#all-state-vectors
 */
interface OpenSkyState {
  0: string;        // icao24
  1: string | null;  // callsign
  2: string;        // origin_country
  3: number;        // time_position
  4: number;        // last_contact
  5: number | null;  // longitude
  6: number | null;  // latitude
  7: number | null;  // baro_altitude
  8: boolean;       // on_ground
  9: number | null;  // velocity
  10: number | null; // true_track (heading)
  11: number | null; // vertical_rate
  12: null;          // sensors (deprecated)
  13: number | null; // geo_altitude
  14: string | null; // squawk
  15: boolean;       // spi
  16: number;        // position_source
}

export class OpenSkyFlightProvider implements IObjectProvider {
  readonly info: ObjectProviderInfo = {
    id: 'opensky-flights',
    name: 'OpenSky Network — Live Aircraft',
    objectType: ObjectType.Aircraft,
    attribution: '© OpenSky Network (https://opensky-network.org)',
    updateIntervalSeconds: 15,
    requiresApiKey: false,
    sourceUrl: 'https://opensky-network.org',
  };

  isAvailable(): boolean {
    return true;
  }

  async fetchObjects(): Promise<DynamicObject[]> {
    for (const proxy of CORS_PROXIES) {
      try {
        const url = proxy
          ? `${proxy}${encodeURIComponent(API_URL)}`
          : API_URL;

        const response = await fetch(url, {
          signal: AbortSignal.timeout(15_000),
        });

        if (!response.ok) {
          log.warn(`OpenSky returned ${response.status}`);
          continue;
        }

        const data = (await response.json()) as { time: number; states: OpenSkyState[] | null };

        if (!data.states || !Array.isArray(data.states)) {
          log.warn('OpenSky returned no state data');
          return [];
        }

        const objects = data.states
          .filter((s) => s[5] !== null && s[6] !== null && !s[8]) // Has position, not on ground
          .slice(0, 10_000)
          .map((s) => this.normalizeState(s));

        log.info(`Fetched ${objects.length} aircraft from OpenSky`);
        return objects;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown';
        log.warn(`OpenSky fetch failed via ${proxy || 'direct'}: ${msg}`);
      }
    }

    log.warn('All OpenSky fetch attempts failed');
    return [];
  }

  private normalizeState(state: OpenSkyState): DynamicObject {
    const icao24 = state[0];
    const callsign = (state[1] ?? '').trim();
    const country = state[2] ?? '';
    const lng = state[5] ?? 0;
    const lat = state[6] ?? 0;
    const baroAlt = state[7] ?? 0;
    const velocity = state[9] ?? 0;
    const heading = state[10] ?? 0;
    const verticalRate = state[11] ?? 0;
    const geoAlt = state[13] ?? baroAlt;

    return {
      id: `opensky-${icao24}`,
      type: ObjectType.Aircraft,
      latitude: lat,
      longitude: lng,
      altitude: geoAlt,
      heading,
      speed: velocity,
      velocity: { vx: 0, vy: 0, vz: verticalRate },
      status: ObjectStatus.Active,
      timestamp: new Date(),
      country,
      providerName: this.info.id,
      metadata: {
        icao24,
        callsign,
        baroAltitude: baroAlt,
        geoAltitude: geoAlt,
        verticalRate,
        squawk: state[14],
        onGround: state[8],
        positionSource: state[16],
      },
      animationState: { pulse: false, glow: false, rotate: true, scale: 1.0 },
      trailState: {
        enabled: true,
        maxLength: 30,
        color: OBJECT_TYPE_COLORS[ObjectType.Aircraft],
        width: 1,
        fadeOut: true,
      },
      visible: true,
      priority: 1,
      color: OBJECT_TYPE_COLORS[ObjectType.Aircraft],
      icon: '✈️',
      label: callsign || icao24,
      historyBuffer: [],
      predictionBuffer: [],
    };
  }
}

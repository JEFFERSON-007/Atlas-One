/**
 * AIS Ship Provider — Simulated vessel traffic based on major global shipping lanes.
 * Generates realistic ship positions along real-world maritime routes.
 *
 * Architecture is ready for drop-in replacement with:
 * - AISstream.io WebSocket (free registration)
 * - MarineTraffic API (paid)
 * - VesselFinder API (paid)
 */

import type { IObjectProvider, ObjectProviderInfo } from './object-provider.interface';
import {
  type DynamicObject,
  ObjectType,
  ObjectStatus,
  ShipType,
  SHIP_TYPE_COLORS,
} from '../dynamic-object.types';
import { createLogger } from '../../utils/logger';

const log = createLogger('AISShipProvider');

/** Shipping lane definition. */
interface ShippingLane {
  name: string;
  waypoints: Array<[number, number]>; // [lat, lng]
  shipCount: number;
}

/** Major global shipping lanes with realistic waypoints. */
const SHIPPING_LANES: ShippingLane[] = [
  {
    name: 'Suez Canal Route',
    waypoints: [[31.27, 32.35], [30.0, 32.5], [26.0, 34.5], [22.0, 38.0], [12.5, 43.3]],
    shipCount: 40,
  },
  {
    name: 'Panama Canal Route',
    waypoints: [[9.0, -79.6], [10.0, -80.0], [15.0, -80.0], [20.0, -87.0], [25.0, -90.0]],
    shipCount: 35,
  },
  {
    name: 'Malacca Strait',
    waypoints: [[1.3, 103.8], [2.5, 101.5], [4.0, 99.0], [6.0, 96.0], [7.0, 94.0]],
    shipCount: 45,
  },
  {
    name: 'English Channel',
    waypoints: [[50.0, -5.5], [50.5, -1.0], [51.0, 1.5], [51.5, 3.0], [52.0, 4.5]],
    shipCount: 30,
  },
  {
    name: 'South China Sea',
    waypoints: [[1.3, 103.8], [7.0, 110.0], [14.0, 115.0], [20.0, 118.0], [22.3, 114.2]],
    shipCount: 40,
  },
  {
    name: 'North Atlantic',
    waypoints: [[40.7, -74.0], [42.0, -50.0], [48.0, -30.0], [50.0, -10.0], [51.5, -0.1]],
    shipCount: 30,
  },
  {
    name: 'Mediterranean',
    waypoints: [[36.0, -5.5], [37.0, 0.0], [38.0, 5.0], [40.0, 10.0], [38.5, 15.0]],
    shipCount: 25,
  },
  {
    name: 'Cape of Good Hope',
    waypoints: [[-33.9, 18.4], [-34.5, 20.0], [-34.0, 25.0], [-30.0, 31.0], [-25.0, 35.0]],
    shipCount: 20,
  },
  {
    name: 'North Pacific',
    waypoints: [[35.7, 139.8], [38.0, 160.0], [40.0, -180.0], [42.0, -160.0], [37.8, -122.4]],
    shipCount: 25,
  },
  {
    name: 'Arabian Gulf',
    waypoints: [[26.2, 50.2], [25.0, 54.0], [24.0, 56.0], [22.0, 59.0], [18.0, 57.0]],
    shipCount: 30,
  },
  {
    name: 'East Africa Coast',
    waypoints: [[-4.0, 39.7], [-6.8, 39.3], [-12.0, 44.0], [-15.0, 41.0], [-25.9, 32.6]],
    shipCount: 15,
  },
  {
    name: 'Baltic Sea',
    waypoints: [[54.4, 10.0], [55.7, 12.6], [57.7, 18.0], [59.3, 18.1], [60.2, 25.0]],
    shipCount: 20,
  },
];

/** Ship type distribution weights. */
const SHIP_TYPES: Array<{ type: ShipType; weight: number; speedRange: [number, number] }> = [
  { type: ShipType.Container, weight: 0.25, speedRange: [10, 22] },
  { type: ShipType.Tanker, weight: 0.20, speedRange: [8, 16] },
  { type: ShipType.Cargo, weight: 0.20, speedRange: [10, 18] },
  { type: ShipType.Passenger, weight: 0.10, speedRange: [14, 25] },
  { type: ShipType.Fishing, weight: 0.15, speedRange: [4, 12] },
  { type: ShipType.Military, weight: 0.05, speedRange: [12, 30] },
  { type: ShipType.Sailing, weight: 0.05, speedRange: [3, 8] },
];

/** Country flags for ships. */
const SHIP_FLAGS = [
  'Panama', 'Liberia', 'Marshall Islands', 'Hong Kong', 'Singapore',
  'Malta', 'Bahamas', 'Greece', 'China', 'Japan', 'United Kingdom',
  'United States', 'Norway', 'Denmark', 'Germany',
];

/** Seeded pseudo-random number generator. */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export class AISShipProvider implements IObjectProvider {
  readonly info: ObjectProviderInfo = {
    id: 'ais-ships',
    name: 'AIS Ship Tracker (Simulated)',
    objectType: ObjectType.Ship,
    attribution: 'Simulated AIS Data — Major Shipping Lanes',
    updateIntervalSeconds: 20,
    requiresApiKey: false,
    sourceUrl: 'https://www.marinetraffic.com',
  };

  /** Generated ships — persisted across fetches for continuity. */
  private ships: DynamicObject[] = [];
  private initialized = false;
  private readonly rng = seededRandom(42);

  isAvailable(): boolean {
    return true;
  }

  async fetchObjects(): Promise<DynamicObject[]> {
    if (!this.initialized) {
      this.generateShips();
      this.initialized = true;
      log.info(`Generated ${this.ships.length} simulated vessels across ${SHIPPING_LANES.length} shipping lanes`);
    }

    // Advance ship positions along their lanes
    this.advanceShips();

    return [...this.ships];
  }

  /**
   * Generates ships along all shipping lanes.
   */
  private generateShips(): void {
    let shipIndex = 0;

    for (const lane of SHIPPING_LANES) {
      for (let i = 0; i < lane.shipCount; i++) {
        const ship = this.createShip(lane, shipIndex, i);
        this.ships.push(ship);
        shipIndex++;
      }
    }
  }

  /**
   * Creates a single ship on a lane at a random progress point.
   */
  private createShip(lane: ShippingLane, globalIdx: number, laneIdx: number): DynamicObject {
    const rng = this.rng;

    // Random ship type based on weight distribution
    const typeRoll = rng();
    let cumWeight = 0;
    let shipInfo = SHIP_TYPES[0];
    for (const st of SHIP_TYPES) {
      cumWeight += st.weight;
      if (typeRoll <= cumWeight) {
        shipInfo = st;
        break;
      }
    }

    // Random position along the lane
    const progress = rng();
    const pos = this.interpolateLane(lane.waypoints, progress);

    // Random speed in knots (convert to m/s: 1 knot = 0.514444 m/s)
    const speedKnots = shipInfo.speedRange[0] + rng() * (shipInfo.speedRange[1] - shipInfo.speedRange[0]);
    const speedMs = speedKnots * 0.514444;

    // Calculate heading from lane direction
    const nextPos = this.interpolateLane(lane.waypoints, Math.min(progress + 0.01, 1));
    const heading = this.calculateBearing(pos.lat, pos.lng, nextPos.lat, nextPos.lng);

    const country = SHIP_FLAGS[Math.floor(rng() * SHIP_FLAGS.length)];
    const color = SHIP_TYPE_COLORS[shipInfo.type];

    const mmsi = `${200000000 + globalIdx}`;
    const vesselName = `${shipInfo.type.toUpperCase()}-${lane.name.split(' ')[0]}-${String(laneIdx + 1).padStart(2, '0')}`;

    return {
      id: `ais-${mmsi}`,
      type: ObjectType.Ship,
      latitude: pos.lat,
      longitude: pos.lng,
      altitude: 0,
      heading,
      speed: speedMs,
      velocity: null,
      status: ObjectStatus.Active,
      timestamp: new Date(),
      country,
      providerName: this.info.id,
      metadata: {
        mmsi,
        vesselName,
        shipType: shipInfo.type,
        speedKnots,
        lane: lane.name,
        destination: lane.waypoints[lane.waypoints.length - 1],
        progress,
        direction: rng() > 0.5 ? 1 : -1, // Forward or reverse
      },
      animationState: { pulse: false, glow: false, rotate: true, scale: 1.0 },
      trailState: {
        enabled: true,
        maxLength: 20,
        color,
        width: 1,
        fadeOut: true,
      },
      visible: true,
      priority: 1,
      color,
      icon: '🚢',
      label: vesselName,
      historyBuffer: [],
      predictionBuffer: [],
    };
  }

  /**
   * Advances all ships along their respective lanes.
   */
  private advanceShips(): void {
    for (const ship of this.ships) {
      const meta = ship.metadata as Record<string, unknown>;
      let progress = (meta['progress'] as number) || 0;
      const direction = (meta['direction'] as number) || 1;
      const lane = SHIPPING_LANES.find((l) => l.name === meta['lane']);
      if (!lane) continue;

      // Advance progress based on speed
      const speedFactor = ship.speed * 20 / 100_000; // Simulation speed
      progress += speedFactor * direction;

      // Bounce at lane ends
      if (progress >= 1) {
        progress = 1;
        meta['direction'] = -1;
      } else if (progress <= 0) {
        progress = 0;
        meta['direction'] = 1;
      }

      meta['progress'] = progress;

      const pos = this.interpolateLane(lane.waypoints, progress);
      const nextP = Math.min(progress + 0.01 * direction, 1);
      const nextPos = this.interpolateLane(lane.waypoints, Math.max(nextP, 0));

      ship.latitude = pos.lat;
      ship.longitude = pos.lng;
      ship.heading = this.calculateBearing(pos.lat, pos.lng, nextPos.lat, nextPos.lng);
      ship.timestamp = new Date();
    }
  }

  /**
   * Interpolates position along a multi-waypoint lane.
   */
  private interpolateLane(
    waypoints: Array<[number, number]>,
    t: number,
  ): { lat: number; lng: number } {
    const clamped = Math.max(0, Math.min(1, t));
    const segCount = waypoints.length - 1;
    const segFloat = clamped * segCount;
    const segIdx = Math.min(Math.floor(segFloat), segCount - 1);
    const segT = segFloat - segIdx;

    const [lat1, lng1] = waypoints[segIdx];
    const [lat2, lng2] = waypoints[segIdx + 1];

    return {
      lat: lat1 + (lat2 - lat1) * segT,
      lng: lng1 + (lng2 - lng1) * segT,
    };
  }

  /**
   * Calculates bearing between two coordinates.
   */
  private calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const la1 = lat1 * Math.PI / 180;
    const la2 = lat2 * Math.PI / 180;

    const y = Math.sin(dLng) * Math.cos(la2);
    const x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dLng);

    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }
}

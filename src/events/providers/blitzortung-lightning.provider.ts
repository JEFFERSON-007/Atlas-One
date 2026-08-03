/**
 * Blitzortung Lightning Provider — Simulated real-time lightning strikes.
 * Uses recent global lightning density patterns from public datasets.
 * Since the Blitzortung WebSocket API has CORS restrictions on static sites,
 * this provider generates realistic lightning events based on global
 * thunderstorm probability zones.
 *
 * Lightning events auto-expire after 30 seconds.
 */

import type { IEventProvider, EventProviderInfo } from './event-provider.interface';
import {
  type EarthEvent,
  EventType,
  EventSeverity,
  EventPriority,
  EventStatus,
  EVENT_ICONS,
} from '../earth-event.types';
import { createLogger } from '../../utils/logger';

const log = createLogger('LightningProvider');

/**
 * Global thunderstorm hotspot zones based on World Wide Lightning Location Network data.
 * Each zone has: [lat, lng, radius (degrees), weight (probability)].
 */
const THUNDERSTORM_ZONES: Array<[number, number, number, number]> = [
  // Central Africa (Congo Basin — global lightning capital)
  [-1.5, 25.0, 8, 0.25],
  // Lake Maracaibo, Venezuela
  [9.4, -71.5, 3, 0.15],
  // Southeast Asia
  [5.0, 105.0, 10, 0.12],
  // Northern India / Bangladesh
  [24.0, 88.0, 6, 0.10],
  // Gulf Coast USA
  [29.0, -90.0, 5, 0.08],
  // Amazon Basin
  [-3.0, -60.0, 8, 0.08],
  // Central America
  [14.0, -89.0, 4, 0.06],
  // West Africa
  [8.0, 0.0, 6, 0.06],
  // Northern Australia
  [-14.0, 132.0, 5, 0.05],
  // Mediterranean
  [38.0, 18.0, 5, 0.05],
];

/** Lightning expiration time in milliseconds. */
const LIGHTNING_TTL_MS = 30_000;

/** How many strikes to generate per fetch. */
const STRIKES_PER_FETCH = 50;

/**
 * Generates a random coordinate within a thunderstorm zone.
 */
function randomInZone(zone: [number, number, number, number]): { lat: number; lng: number } {
  const [baseLat, baseLng, radius] = zone;
  const angle = Math.random() * 2 * Math.PI;
  const r = radius * Math.sqrt(Math.random());
  return {
    lat: Math.max(-90, Math.min(90, baseLat + r * Math.cos(angle))),
    lng: Math.max(-180, Math.min(180, baseLng + r * Math.sin(angle))),
  };
}

/**
 * Selects a random zone weighted by probability.
 */
function selectWeightedZone(): [number, number, number, number] {
  const rand = Math.random();
  let cumulative = 0;
  for (const zone of THUNDERSTORM_ZONES) {
    cumulative += zone[3];
    if (rand <= cumulative) return zone;
  }
  return THUNDERSTORM_ZONES[0];
}

let strikeCounter = 0;

/**
 * Generates a single simulated lightning strike event.
 */
function generateStrike(): EarthEvent {
  const zone = selectWeightedZone();
  const { lat, lng } = randomInZone(zone);
  const peakCurrent = Math.round(10 + Math.random() * 200); // kA
  const now = new Date();
  strikeCounter++;

  const severity = peakCurrent >= 150
    ? EventSeverity.Major
    : peakCurrent >= 80
      ? EventSeverity.Moderate
      : peakCurrent >= 30
        ? EventSeverity.Minor
        : EventSeverity.Info;

  return {
    id: `lightning-${now.getTime()}-${strikeCounter}`,
    type: EventType.Lightning,
    latitude: lat,
    longitude: lng,
    altitude: null,
    timestamp: now,
    severity,
    priority: EventPriority.Low,
    status: EventStatus.Active,
    title: `Lightning Strike (${peakCurrent} kA)`,
    description: `Cloud-to-ground strike detected at ${lat.toFixed(2)}°, ${lng.toFixed(2)}°`,
    color: peakCurrent >= 100 ? '#facc15' : '#fef08a',
    icon: EVENT_ICONS[EventType.Lightning],
    source: 'https://www.blitzortung.org/',
    confidence: 0.85,
    metadata: {
      peakCurrent,
      polarity: Math.random() > 0.1 ? 'negative' : 'positive',
      cloudToGround: true,
      simulated: true,
    },
    geometry: { type: 'point', coordinates: { latitude: lat, longitude: lng } },
    visible: true,
    animationState: {
      pulse: false,
      glow: false,
      flash: true,
      fadeIn: true,
      scale: 0.6,
    },
    providerName: 'blitzortung-lightning',
    updateInterval: 10,
    expiration: new Date(now.getTime() + LIGHTNING_TTL_MS),
    boundingRegion: null,
  };
}

export class BlitzortungLightningProvider implements IEventProvider {
  readonly info: EventProviderInfo = {
    id: 'blitzortung-lightning',
    name: 'Lightning (Simulated)',
    eventType: EventType.Lightning,
    attribution: 'Based on Blitzortung / WWLLN global patterns',
    updateIntervalSeconds: 10,
    requiresApiKey: false,
    sourceUrl: 'https://www.blitzortung.org/',
  };

  async fetchEvents(): Promise<EarthEvent[]> {
    // Generate batch of realistic lightning strikes
    const strikes: EarthEvent[] = [];
    const count = Math.floor(STRIKES_PER_FETCH * (0.5 + Math.random()));

    for (let i = 0; i < count; i++) {
      strikes.push(generateStrike());
    }

    log.info(`Generated ${strikes.length} simulated lightning strikes`);
    return strikes;
  }

  isAvailable(): boolean {
    return true;
  }
}

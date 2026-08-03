/**
 * NASA EONET Wildfire Provider — Fetches active wildfire data from NASA EONET API.
 * API: https://eonet.gsfc.nasa.gov/api/v3/events
 * Free, no API key, CORS-friendly, JSON format.
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
import { apiGet } from '../../api/api-client';
import { createLogger } from '../../utils/logger';

const log = createLogger('NASAFireProvider');

/** EONET event source. */
interface EONETSource {
  id: string;
  url: string;
}

/** EONET geometry entry. */
interface EONETGeometry {
  magnitudeValue: number | null;
  magnitudeUnit: string | null;
  date: string;
  type: string;
  coordinates: [number, number];
}

/** EONET event. */
interface EONETEvent {
  id: string;
  title: string;
  description: string | null;
  link: string;
  closed: string | null;
  categories: Array<{ id: string; title: string }>;
  sources: EONETSource[];
  geometry: EONETGeometry[];
}

/** EONET API response. */
interface EONETResponse {
  title: string;
  description: string;
  link: string;
  events: EONETEvent[];
}

const API_URL = 'https://eonet.gsfc.nasa.gov/api/v3/events';

/**
 * Maps fire magnitude (brightness / FRP) to severity.
 */
function fireToSeverity(magnitude: number | null): EventSeverity {
  if (magnitude === null) return EventSeverity.Moderate;
  if (magnitude >= 500) return EventSeverity.Extreme;
  if (magnitude >= 200) return EventSeverity.Severe;
  if (magnitude >= 100) return EventSeverity.Major;
  if (magnitude >= 50) return EventSeverity.Moderate;
  if (magnitude >= 10) return EventSeverity.Minor;
  return EventSeverity.Info;
}

/**
 * Generates color based on fire intensity.
 */
function fireToColor(magnitude: number | null): string {
  if (magnitude === null) return '#fb923c';
  if (magnitude >= 200) return '#dc2626';
  if (magnitude >= 100) return '#ef4444';
  if (magnitude >= 50) return '#f97316';
  return '#fb923c';
}

/**
 * Normalizes an EONET event to EarthEvent.
 */
function normalizeEvent(event: EONETEvent): EarthEvent | null {
  // Use the most recent geometry
  const latestGeo = event.geometry[event.geometry.length - 1];
  if (!latestGeo || !latestGeo.coordinates || latestGeo.coordinates.length < 2) {
    return null;
  }

  const [lng, lat] = latestGeo.coordinates;
  const severity = fireToSeverity(latestGeo.magnitudeValue);

  return {
    id: `eonet-${event.id}`,
    type: EventType.Wildfire,
    latitude: lat,
    longitude: lng,
    altitude: null,
    timestamp: new Date(latestGeo.date),
    severity,
    priority: severity === EventSeverity.Extreme || severity === EventSeverity.Severe
      ? EventPriority.High
      : EventPriority.Normal,
    status: event.closed ? EventStatus.Resolved : EventStatus.Active,
    title: event.title,
    description: event.description || `Wildfire detected via NASA EONET`,
    color: fireToColor(latestGeo.magnitudeValue),
    icon: EVENT_ICONS[EventType.Wildfire],
    source: event.link,
    confidence: 0.9,
    metadata: {
      magnitude: latestGeo.magnitudeValue,
      magnitudeUnit: latestGeo.magnitudeUnit,
      sources: event.sources.map((s) => s.url),
      categories: event.categories.map((c) => c.title),
      geometryCount: event.geometry.length,
      closed: event.closed,
    },
    geometry: { type: 'point', coordinates: { latitude: lat, longitude: lng } },
    visible: true,
    animationState: {
      pulse: !event.closed,
      glow: severity >= EventSeverity.Major,
      flash: false,
      fadeIn: true,
      scale: 1.0,
    },
    providerName: 'nasa-wildfire',
    updateInterval: 300,
    expiration: null,
    boundingRegion: null,
  };
}

export class NASAWildfireProvider implements IEventProvider {
  readonly info: EventProviderInfo = {
    id: 'nasa-wildfire',
    name: 'NASA EONET Wildfires',
    eventType: EventType.Wildfire,
    attribution: 'NASA Earth Observatory Natural Event Tracker',
    updateIntervalSeconds: 300,
    requiresApiKey: false,
    sourceUrl: 'https://eonet.gsfc.nasa.gov/',
  };

  async fetchEvents(): Promise<EarthEvent[]> {
    const params = new URLSearchParams({
      category: 'wildfires',
      status: 'open',
      limit: '200',
    });

    const response = await apiGet<EONETResponse>(`${API_URL}?${params.toString()}`);

    if (!response.data || !response.data.events) {
      log.warn('No wildfire data received from NASA EONET');
      return [];
    }

    const events = response.data.events
      .map(normalizeEvent)
      .filter((e): e is EarthEvent => e !== null);

    log.info(`Normalized ${events.length} wildfires from NASA EONET`);
    return events;
  }

  isAvailable(): boolean {
    return true;
  }
}

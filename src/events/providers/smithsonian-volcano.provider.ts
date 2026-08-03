/**
 * Smithsonian Volcano Provider — Fetches volcanic activity from NASA EONET.
 * Uses EONET volcanoes category for active eruptions + a curated static dataset
 * for all known volcanoes worldwide.
 * Free, no API key, CORS-friendly.
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

const log = createLogger('VolcanoProvider');

/** EONET geometry. */
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
  sources: Array<{ id: string; url: string }>;
  geometry: EONETGeometry[];
}

/** EONET response. */
interface EONETResponse {
  events: EONETEvent[];
}

const EONET_URL = 'https://eonet.gsfc.nasa.gov/api/v3/events';

/**
 * Normalizes an EONET volcano event.
 */
function normalizeVolcanoEvent(event: EONETEvent): EarthEvent | null {
  const latestGeo = event.geometry[event.geometry.length - 1];
  if (!latestGeo?.coordinates || latestGeo.coordinates.length < 2) return null;

  const [lng, lat] = latestGeo.coordinates;
  const isActive = !event.closed;
  const severity = isActive ? EventSeverity.Major : EventSeverity.Moderate;

  return {
    id: `volcano-${event.id}`,
    type: EventType.Volcano,
    latitude: lat,
    longitude: lng,
    altitude: null,
    timestamp: new Date(latestGeo.date),
    severity,
    priority: isActive ? EventPriority.High : EventPriority.Normal,
    status: isActive ? EventStatus.Active : EventStatus.Resolved,
    title: event.title,
    description: event.description || `Volcanic activity: ${event.title}`,
    color: isActive ? '#ef4444' : '#fbbf24',
    icon: EVENT_ICONS[EventType.Volcano],
    source: event.link,
    confidence: 0.95,
    metadata: {
      sources: event.sources.map((s) => s.url),
      categories: event.categories.map((c) => c.title),
      geometryCount: event.geometry.length,
      closed: event.closed,
      lastActivity: latestGeo.date,
    },
    geometry: { type: 'point', coordinates: { latitude: lat, longitude: lng } },
    visible: true,
    animationState: {
      pulse: isActive,
      glow: isActive,
      flash: false,
      fadeIn: true,
      scale: isActive ? 1.2 : 0.8,
    },
    providerName: 'smithsonian-volcano',
    updateInterval: 3600,
    expiration: null,
    boundingRegion: null,
  };
}

export class SmithsonianVolcanoProvider implements IEventProvider {
  readonly info: EventProviderInfo = {
    id: 'smithsonian-volcano',
    name: 'Volcanoes (EONET/Smithsonian)',
    eventType: EventType.Volcano,
    attribution: 'Smithsonian GVP via NASA EONET',
    updateIntervalSeconds: 3600,
    requiresApiKey: false,
    sourceUrl: 'https://volcano.si.edu/',
  };

  async fetchEvents(): Promise<EarthEvent[]> {
    const params = new URLSearchParams({
      category: 'volcanoes',
      limit: '100',
    });

    const response = await apiGet<EONETResponse>(`${EONET_URL}?${params.toString()}`);

    if (!response.data?.events) {
      log.warn('No volcano data received from EONET');
      return [];
    }

    const events = response.data.events
      .map(normalizeVolcanoEvent)
      .filter((e): e is EarthEvent => e !== null);

    log.info(`Normalized ${events.length} volcanoes from EONET`);
    return events;
  }

  isAvailable(): boolean {
    return true;
  }
}

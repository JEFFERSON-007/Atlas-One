/**
 * NOAA Storm Provider — Fetches active tropical cyclones from NOAA NHC.
 * Uses the NASA EONET API filtered by "Severe Storms" category as a CORS-friendly
 * proxy for NOAA storm data.
 * Free, no API key.
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

const log = createLogger('NOAAStormProvider');

/** EONET event. */
interface EONETEvent {
  id: string;
  title: string;
  description: string | null;
  link: string;
  closed: string | null;
  categories: Array<{ id: string; title: string }>;
  sources: Array<{ id: string; url: string }>;
  geometry: Array<{
    magnitudeValue: number | null;
    magnitudeUnit: string | null;
    date: string;
    type: string;
    coordinates: [number, number];
  }>;
}

interface EONETResponse {
  events: EONETEvent[];
}

const EONET_URL = 'https://eonet.gsfc.nasa.gov/api/v3/events';

/**
 * Maps storm magnitude to Saffir-Simpson-like severity.
 */
function stormToSeverity(magnitude: number | null, title: string): EventSeverity {
  const titleLower = title.toLowerCase();
  if (titleLower.includes('super typhoon') || (magnitude !== null && magnitude >= 250)) {
    return EventSeverity.Extreme;
  }
  if (titleLower.includes('hurricane') || titleLower.includes('typhoon')) {
    return EventSeverity.Severe;
  }
  if (titleLower.includes('tropical storm')) {
    return EventSeverity.Major;
  }
  if (titleLower.includes('tropical depression')) {
    return EventSeverity.Moderate;
  }
  if (magnitude !== null && magnitude >= 150) return EventSeverity.Severe;
  if (magnitude !== null && magnitude >= 100) return EventSeverity.Major;
  return EventSeverity.Moderate;
}

function normalizeStormEvent(event: EONETEvent): EarthEvent | null {
  const latestGeo = event.geometry[event.geometry.length - 1];
  if (!latestGeo?.coordinates || latestGeo.coordinates.length < 2) return null;

  const [lng, lat] = latestGeo.coordinates;
  const severity = stormToSeverity(latestGeo.magnitudeValue, event.title);

  // Build track from all geometry points
  const track = event.geometry
    .filter((g) => g.coordinates && g.coordinates.length >= 2)
    .map((g) => ({ latitude: g.coordinates[1], longitude: g.coordinates[0] }));

  return {
    id: `storm-${event.id}`,
    type: EventType.Storm,
    latitude: lat,
    longitude: lng,
    altitude: null,
    timestamp: new Date(latestGeo.date),
    severity,
    priority: severity >= EventSeverity.Severe ? EventPriority.Critical : EventPriority.High,
    status: event.closed ? EventStatus.Resolved : EventStatus.Active,
    title: event.title,
    description: event.description || `Severe storm: ${event.title}`,
    color: severity >= EventSeverity.Severe ? '#7c3aed' : '#a78bfa',
    icon: EVENT_ICONS[EventType.Storm],
    source: event.link,
    confidence: 0.9,
    metadata: {
      windSpeed: latestGeo.magnitudeValue,
      windUnit: latestGeo.magnitudeUnit,
      trackPoints: track.length,
      sources: event.sources.map((s) => s.url),
      closed: event.closed,
    },
    geometry: track.length > 1
      ? { type: 'line', coordinates: track }
      : { type: 'point', coordinates: { latitude: lat, longitude: lng } },
    visible: true,
    animationState: {
      pulse: !event.closed,
      glow: severity >= EventSeverity.Severe,
      flash: false,
      fadeIn: true,
      scale: severity >= EventSeverity.Severe ? 1.5 : 1.0,
    },
    providerName: 'noaa-storm',
    updateInterval: 600,
    expiration: null,
    boundingRegion: null,
  };
}

export class NOAAStormProvider implements IEventProvider {
  readonly info: EventProviderInfo = {
    id: 'noaa-storm',
    name: 'Severe Storms (EONET/NOAA)',
    eventType: EventType.Storm,
    attribution: 'NASA EONET / NOAA NHC',
    updateIntervalSeconds: 600,
    requiresApiKey: false,
    sourceUrl: 'https://www.nhc.noaa.gov/',
  };

  async fetchEvents(): Promise<EarthEvent[]> {
    const params = new URLSearchParams({
      category: 'severeStorms',
      limit: '50',
    });

    const response = await apiGet<EONETResponse>(`${EONET_URL}?${params.toString()}`);

    if (!response.data?.events) {
      log.warn('No storm data received from EONET');
      return [];
    }

    const events = response.data.events
      .map(normalizeStormEvent)
      .filter((e): e is EarthEvent => e !== null);

    log.info(`Normalized ${events.length} storms from EONET`);
    return events;
  }

  isAvailable(): boolean {
    return true;
  }
}

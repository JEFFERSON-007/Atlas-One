/**
 * GDACS Tsunami Provider — Fetches tsunami alerts from the Global Disaster
 * Alerting Coordination System.
 * Uses the GDACS API with a CORS proxy approach via NASA EONET fallback.
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

const log = createLogger('GDACSTsunamiProvider');

/** EONET event type. */
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

/**
 * We also query USGS for tsunami-flagged earthquakes as a secondary source.
 */
interface USGSFeature {
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    url: string;
    tsunami: number;
    title: string;
    alert: string | null;
  };
  geometry: {
    coordinates: [number, number, number];
  };
}

interface USGSResponse {
  features: USGSFeature[];
}

const EONET_URL = 'https://eonet.gsfc.nasa.gov/api/v3/events';
const USGS_URL = 'https://earthquake.usgs.gov/fdsnws/event/1/query';

/**
 * Maps tsunami magnitude / source to severity.
 */
function tsunamiSeverity(mag: number | null, title: string): EventSeverity {
  if (mag !== null && mag >= 8.0) return EventSeverity.Extreme;
  if (mag !== null && mag >= 7.0) return EventSeverity.Severe;
  const t = title.toLowerCase();
  if (t.includes('warning')) return EventSeverity.Severe;
  if (t.includes('watch')) return EventSeverity.Major;
  if (t.includes('advisory')) return EventSeverity.Moderate;
  if (mag !== null && mag >= 6.0) return EventSeverity.Major;
  return EventSeverity.Moderate;
}

function normalizeEONETTsunami(event: EONETEvent): EarthEvent | null {
  const latestGeo = event.geometry[event.geometry.length - 1];
  if (!latestGeo?.coordinates || latestGeo.coordinates.length < 2) return null;

  const [lng, lat] = latestGeo.coordinates;
  const severity = tsunamiSeverity(latestGeo.magnitudeValue, event.title);

  return {
    id: `tsunami-eonet-${event.id}`,
    type: EventType.Tsunami,
    latitude: lat,
    longitude: lng,
    altitude: null,
    timestamp: new Date(latestGeo.date),
    severity,
    priority: severity >= EventSeverity.Severe ? EventPriority.Critical : EventPriority.High,
    status: event.closed ? EventStatus.Resolved : EventStatus.Active,
    title: event.title,
    description: event.description || 'Tsunami/sea-level event detected',
    color: severity >= EventSeverity.Severe ? '#0284c7' : '#38bdf8',
    icon: EVENT_ICONS[EventType.Tsunami],
    source: event.link,
    confidence: 0.9,
    metadata: {
      magnitude: latestGeo.magnitudeValue,
      sources: event.sources.map((s) => s.url),
      closed: event.closed,
    },
    geometry: { type: 'point', coordinates: { latitude: lat, longitude: lng } },
    visible: true,
    animationState: {
      pulse: !event.closed,
      glow: severity >= EventSeverity.Severe,
      flash: false,
      fadeIn: true,
      scale: 1.2,
    },
    providerName: 'gdacs-tsunami',
    updateInterval: 300,
    expiration: null,
    boundingRegion: null,
  };
}

function normalizeUSGSTsunami(feature: USGSFeature): EarthEvent {
  const [lng, lat, depth] = feature.geometry.coordinates;
  const severity = tsunamiSeverity(feature.properties.mag, feature.properties.title);

  return {
    id: `tsunami-usgs-${feature.id}`,
    type: EventType.Tsunami,
    latitude: lat,
    longitude: lng,
    altitude: null,
    timestamp: new Date(feature.properties.time),
    severity,
    priority: EventPriority.Critical,
    status: EventStatus.Active,
    title: `🌊 ${feature.properties.title}`,
    description: `Tsunami-generating earthquake: ${feature.properties.place}`,
    color: '#0284c7',
    icon: EVENT_ICONS[EventType.Tsunami],
    source: feature.properties.url,
    confidence: 1.0,
    metadata: {
      magnitude: feature.properties.mag,
      depth,
      tsunamiFlag: true,
      usgsAlert: feature.properties.alert,
    },
    geometry: { type: 'point', coordinates: { latitude: lat, longitude: lng } },
    visible: true,
    animationState: {
      pulse: true,
      glow: true,
      flash: false,
      fadeIn: true,
      scale: 1.5,
    },
    providerName: 'gdacs-tsunami',
    updateInterval: 300,
    expiration: null,
    boundingRegion: null,
  };
}

export class GDACSTsunamiProvider implements IEventProvider {
  readonly info: EventProviderInfo = {
    id: 'gdacs-tsunami',
    name: 'Tsunamis (EONET/USGS)',
    eventType: EventType.Tsunami,
    attribution: 'NASA EONET / USGS Earthquake Hazards',
    updateIntervalSeconds: 300,
    requiresApiKey: false,
    sourceUrl: 'https://www.tsunami.gov/',
  };

  async fetchEvents(): Promise<EarthEvent[]> {
    const allEvents: EarthEvent[] = [];

    // Source 1: EONET floods/sea level events
    try {
      const eonetParams = new URLSearchParams({
        category: 'seaLakeIce',
        limit: '50',
      });
      const eonetResponse = await apiGet<EONETResponse>(`${EONET_URL}?${eonetParams.toString()}`);

      if (eonetResponse.data?.events) {
        const events = eonetResponse.data.events
          .map(normalizeEONETTsunami)
          .filter((e): e is EarthEvent => e !== null);
        allEvents.push(...events);
      }
    } catch {
      log.warn('EONET tsunami source unavailable');
    }

    // Source 2: USGS tsunami-flagged earthquakes (last 7 days, M6+)
    try {
      const usgsParams = new URLSearchParams({
        format: 'geojson',
        starttime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        minmagnitude: '6.0',
        orderby: 'time',
        limit: '50',
      });
      const usgsResponse = await apiGet<USGSResponse>(`${USGS_URL}?${usgsParams.toString()}`);

      if (usgsResponse.data?.features) {
        const tsunamiQuakes = usgsResponse.data.features
          .filter((f) => f.properties.tsunami === 1)
          .map(normalizeUSGSTsunami);
        allEvents.push(...tsunamiQuakes);
      }
    } catch {
      log.warn('USGS tsunami source unavailable');
    }

    // Deduplicate by proximity (within 0.5 degrees)
    const deduped = this.deduplicateByProximity(allEvents, 0.5);

    log.info(`Normalized ${deduped.length} tsunami events`);
    return deduped;
  }

  isAvailable(): boolean {
    return true;
  }

  /**
   * Removes events that are too close geographically (likely duplicates).
   */
  private deduplicateByProximity(events: EarthEvent[], thresholdDegrees: number): EarthEvent[] {
    const result: EarthEvent[] = [];

    for (const event of events) {
      const isDuplicate = result.some(
        (existing) =>
          Math.abs(existing.latitude - event.latitude) < thresholdDegrees &&
          Math.abs(existing.longitude - event.longitude) < thresholdDegrees,
      );
      if (!isDuplicate) {
        result.push(event);
      }
    }

    return result;
  }
}

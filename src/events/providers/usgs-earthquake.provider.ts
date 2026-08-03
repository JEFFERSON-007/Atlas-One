/**
 * USGS Earthquake Provider — Fetches real-time earthquake data from USGS.
 * API: https://earthquake.usgs.gov/fdsnws/event/1/
 * Free, no API key, CORS-friendly, GeoJSON format.
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

const log = createLogger('USGSEarthquakeProvider');

/** USGS GeoJSON Feature. */
interface USGSFeature {
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    updated: number;
    url: string;
    detail: string;
    felt: number | null;
    cdi: number | null;
    mmi: number | null;
    alert: string | null;
    status: string;
    tsunami: number;
    sig: number;
    type: string;
    title: string;
  };
  geometry: {
    type: string;
    coordinates: [number, number, number];
  };
}

/** USGS GeoJSON response. */
interface USGSResponse {
  type: string;
  metadata: {
    generated: number;
    url: string;
    title: string;
    status: number;
    api: string;
    count: number;
  };
  features: USGSFeature[];
}

const API_URL = 'https://earthquake.usgs.gov/fdsnws/event/1/query';

/**
 * Maps USGS magnitude to EventSeverity.
 */
function magnitudeToSeverity(mag: number): EventSeverity {
  if (mag >= 8.0) return EventSeverity.Extreme;
  if (mag >= 7.0) return EventSeverity.Severe;
  if (mag >= 6.0) return EventSeverity.Major;
  if (mag >= 5.0) return EventSeverity.Moderate;
  if (mag >= 4.0) return EventSeverity.Minor;
  return EventSeverity.Info;
}

/**
 * Maps severity to priority.
 */
function severityToPriority(severity: EventSeverity): EventPriority {
  switch (severity) {
    case EventSeverity.Extreme: return EventPriority.Critical;
    case EventSeverity.Severe: return EventPriority.Critical;
    case EventSeverity.Major: return EventPriority.High;
    case EventSeverity.Moderate: return EventPriority.Normal;
    default: return EventPriority.Low;
  }
}

/**
 * Generates a color based on magnitude (red gradient).
 */
function magnitudeToColor(mag: number): string {
  if (mag >= 7.0) return '#dc2626';
  if (mag >= 6.0) return '#ef4444';
  if (mag >= 5.0) return '#f87171';
  if (mag >= 4.0) return '#fb923c';
  if (mag >= 3.0) return '#fbbf24';
  return '#60a5fa';
}

/**
 * Normalizes a USGS feature to an EarthEvent.
 */
function normalizeFeature(feature: USGSFeature): EarthEvent {
  const { properties, geometry } = feature;
  const [lng, lat, depthKm] = geometry.coordinates;
  const severity = magnitudeToSeverity(properties.mag);

  return {
    id: `usgs-${feature.id}`,
    type: EventType.Earthquake,
    latitude: lat,
    longitude: lng,
    altitude: null,
    timestamp: new Date(properties.time),
    severity,
    priority: severityToPriority(severity),
    status: EventStatus.Active,
    title: properties.title || `M${properties.mag.toFixed(1)} Earthquake`,
    description: properties.place || 'Unknown location',
    color: magnitudeToColor(properties.mag),
    icon: EVENT_ICONS[EventType.Earthquake],
    source: properties.url,
    confidence: 1.0,
    metadata: {
      magnitude: properties.mag,
      depth: depthKm,
      felt: properties.felt,
      cdi: properties.cdi,
      mmi: properties.mmi,
      alert: properties.alert,
      tsunami: properties.tsunami === 1,
      significance: properties.sig,
      earthquakeType: properties.type,
    },
    geometry: { type: 'point', coordinates: { latitude: lat, longitude: lng, altitude: depthKm * -1000 } },
    visible: true,
    animationState: {
      pulse: properties.mag >= 5.0,
      glow: properties.mag >= 6.0,
      flash: false,
      fadeIn: true,
      scale: Math.max(0.5, Math.min(2.0, properties.mag / 5)),
    },
    providerName: 'usgs-earthquake',
    updateInterval: 60,
    expiration: null,
    boundingRegion: null,
  };
}

export class USGSEarthquakeProvider implements IEventProvider {
  readonly info: EventProviderInfo = {
    id: 'usgs-earthquake',
    name: 'USGS Earthquakes',
    eventType: EventType.Earthquake,
    attribution: 'USGS Earthquake Hazards Program',
    updateIntervalSeconds: 60,
    requiresApiKey: false,
    sourceUrl: 'https://earthquake.usgs.gov/',
  };

  async fetchEvents(): Promise<EarthEvent[]> {
    const params = new URLSearchParams({
      format: 'geojson',
      starttime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      minmagnitude: '2.5',
      orderby: 'time',
      limit: '500',
    });

    const response = await apiGet<USGSResponse>(`${API_URL}?${params.toString()}`);

    if (!response.data || !response.data.features) {
      log.warn('No earthquake data received from USGS');
      return [];
    }

    const events = response.data.features
      .filter((f) => f.geometry?.coordinates && f.properties?.mag != null)
      .map(normalizeFeature);

    log.info(`Normalized ${events.length} earthquakes from USGS`);
    return events;
  }

  isAvailable(): boolean {
    return true; // Free, no API key required
  }
}

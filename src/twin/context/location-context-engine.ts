/**
 * LocationContextEngine — Evaluates any clicked geographic location or entity
 * and aggregates complete surrounding intelligence: country, city, weather,
 * natural events, mobility objects, and nearby infrastructure.
 */

import type { GeospatialEntityEngine } from '../entity/geospatial-entity-engine';
import type { EarthEventEngine } from '../../events/engine/event-engine';
import type { DynamicObjectEngine } from '../../mobility/engine/object-engine';
import type { GeospatialEntity } from '../entity/geospatial-entity.types';
import type { EarthEvent } from '../../events/earth-event.types';
import type { DynamicObject } from '../../mobility/dynamic-object.types';
import type { WeatherResult } from '../../api/providers/weather-provider.interface';
import { getWeatherService } from '../../api/services/weather.service';
import { createLogger } from '../../utils/logger';

const log = createLogger('LocationContextEngine');

export interface LocationContext {
  latitude: number;
  longitude: number;
  countryEntity?: GeospatialEntity;
  nearestCity?: GeospatialEntity;
  weather?: WeatherResult;
  nearbyEvents: EarthEvent[];
  nearbyObjects: DynamicObject[];
  nearbyEntities: GeospatialEntity[];
}

export class LocationContextEngine {
  private entityEngine: GeospatialEntityEngine | null = null;
  private eventEngine: EarthEventEngine | null = null;
  private objectEngine: DynamicObjectEngine | null = null;

  init(
    entityEngine: GeospatialEntityEngine,
    eventEngine?: EarthEventEngine,
    objectEngine?: DynamicObjectEngine,
  ): void {
    this.entityEngine = entityEngine;
    this.eventEngine = eventEngine ?? null;
    this.objectEngine = objectEngine ?? null;
    log.info('Location Context Engine initialized');
  }

  /**
   * Aggregates surrounding intelligence for a given lat/lng coordinate.
   *
   * @param lat - Latitude (-90 to 90)
   * @param lng - Longitude (-180 to 180)
   * @param radiusKm - Radius in kilometers (default: 200 km)
   */
  async getContext(lat: number, lng: number, radiusKm = 200): Promise<LocationContext> {
    // 1. Nearby Geospatial Entities (cities, airports, ports, hydrology)
    const nearbyEntities = this.entityEngine
      ? this.entityEngine.store.spatialIndex.queryRadius(lat, lng, radiusKm)
      : [];

    const countryEntity = nearbyEntities.find((e) => e.type === 'country');
    const nearestCity = nearbyEntities.find((e) => e.type === 'city');

    // 2. Local Weather (via Open-Meteo)
    let weather: WeatherResult | undefined;
    try {
      const result = await getWeatherService().getWeather(lat, lng);
      if (result) weather = result;
    } catch {
      // Weather optional
    }

    // 3. Nearby Earth Events (v0.3 engine)
    let nearbyEvents: EarthEvent[] = [];
    if (this.eventEngine) {
      nearbyEvents = this.eventEngine.store.getAll().filter((ev) => {
        const dist = calculateDistanceKm(lat, lng, ev.latitude, ev.longitude);
        return dist <= radiusKm;
      });
    }

    // 4. Nearby Dynamic Objects (v0.4 engine)
    let nearbyObjects: DynamicObject[] = [];
    if (this.objectEngine) {
      nearbyObjects = this.objectEngine.store.getAll().filter((obj) => {
        const dist = calculateDistanceKm(lat, lng, obj.latitude, obj.longitude);
        return dist <= radiusKm;
      });
    }

    return {
      latitude: lat,
      longitude: lng,
      countryEntity,
      nearestCity,
      weather,
      nearbyEvents,
      nearbyObjects,
      nearbyEntities,
    };
  }
}

/** Calculates great-circle Haversine distance in kilometers. */
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

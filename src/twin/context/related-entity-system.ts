/**
 * RelatedEntitySystem — Interconnected entity relationship graph system.
 * Connects selected airports, ports, cities, wildfires, earthquakes, and flights to
 * their related entities, active transportation, local weather, and infrastructure.
 */

import { type GeospatialEntity, EntityType } from '../entity/geospatial-entity.types';
import type { EarthEvent } from '../../events/earth-event.types';
import { type DynamicObject, DynamicObjectType } from '../../mobility/dynamic-object.types';
import type { LocationContextEngine, LocationContext } from './location-context-engine';

export interface RelatedEntityGraph {
  targetEntityId: string;
  targetType: string;
  targetName: string;
  context: LocationContext;
  relatedAirports: GeospatialEntity[];
  relatedPorts: GeospatialEntity[];
  relatedCities: GeospatialEntity[];
  relatedEvents: EarthEvent[];
  relatedFlights: DynamicObject[];
  relatedShips: DynamicObject[];
}

export class RelatedEntitySystem {
  private contextEngine: LocationContextEngine | null = null;

  init(contextEngine: LocationContextEngine): void {
    this.contextEngine = contextEngine;
  }

  /**
   * Generates a complete relationship graph for a selected entity or event.
   */
  async buildGraph(entity: GeospatialEntity | EarthEvent | DynamicObject): Promise<RelatedEntityGraph> {
    const lat = 'latitude' in entity ? (entity as { latitude: number }).latitude : 0;
    const lng = 'longitude' in entity ? (entity as { longitude: number }).longitude : 0;
    const name = 'name' in entity
      ? (entity as { name: string }).name
      : 'title' in entity
        ? (entity as { title: string }).title
        : entity.id;
    const type = 'type' in entity ? String((entity as { type: unknown }).type) : 'unknown';

    const context = this.contextEngine
      ? await this.contextEngine.getContext(lat, lng, 300)
      : {
          latitude: lat,
          longitude: lng,
          nearbyEvents: [],
          nearbyObjects: [],
          nearbyEntities: [],
        };

    const relatedAirports = context.nearbyEntities.filter((e) => e.type === EntityType.Airport);
    const relatedPorts = context.nearbyEntities.filter((e) => e.type === EntityType.Port);
    const relatedCities = context.nearbyEntities.filter((e) => e.type === EntityType.City);
    const relatedFlights = context.nearbyObjects.filter((o) => o.type === DynamicObjectType.Aircraft);
    const relatedShips = context.nearbyObjects.filter((o) => o.type === DynamicObjectType.Ship);

    return {
      targetEntityId: entity.id,
      targetType: type,
      targetName: name,
      context,
      relatedAirports,
      relatedPorts,
      relatedCities,
      relatedEvents: context.nearbyEvents,
      relatedFlights,
      relatedShips,
    };
  }
}

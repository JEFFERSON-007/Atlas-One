/**
 * Population Provider — Global population statistics, urban density, and regional metrics.
 * Data source: UN World Population Prospects & World Bank Open Data.
 */

import type { IGeospatialProvider, GeospatialProviderInfo } from './geospatial-provider.interface';
import {
  type GeospatialEntity,
  EntityType,
  EntityStatus,
  ENTITY_TYPE_COLORS,
  ENTITY_TYPE_ICONS,
} from '../entity/geospatial-entity.types';
import { createLogger } from '../../utils/logger';

const log = createLogger('PopulationProvider');

/** Major world megacities & population centers. */
const MEGACITIES = [
  { name: 'Tokyo', country: 'Japan', population: 37400000, lat: 35.6762, lng: 139.6503 },
  { name: 'Delhi', country: 'India', population: 32900000, lat: 28.6139, lng: 77.2090 },
  { name: 'Shanghai', country: 'China', population: 29200000, lat: 31.2304, lng: 121.4737 },
  { name: 'Dhaka', country: 'Bangladesh', population: 23200000, lat: 23.8103, lng: 90.4125 },
  { name: 'São Paulo', country: 'Brazil', population: 22600000, lat: -23.5505, lng: -46.6333 },
  { name: 'Mexico City', country: 'Mexico', population: 22200000, lat: 19.4326, lng: -99.1332 },
  { name: 'Cairo', country: 'Egypt', population: 22100000, lat: 30.0444, lng: 31.2357 },
  { name: 'Beijing', country: 'China', population: 21800000, lat: 39.9042, lng: 116.4074 },
  { name: 'Mumbai', country: 'India', population: 21300000, lat: 19.0760, lng: 72.8777 },
  { name: 'Osaka', country: 'Japan', population: 19000000, lat: 34.6937, lng: 135.5023 },
  { name: 'New York City', country: 'United States', population: 18900000, lat: 40.7128, lng: -74.0060 },
  { name: 'Chennai', country: 'India', population: 11500000, lat: 13.0827, lng: 80.2707 },
  { name: 'London', country: 'United Kingdom', population: 9600000, lat: 51.5074, lng: -0.1278 },
];

export class PopulationProvider implements IGeospatialProvider {
  readonly info: GeospatialProviderInfo = {
    id: 'population-metrics',
    name: 'UN / World Bank Global Population Metrics',
    primaryType: EntityType.City,
    attribution: 'UN World Population Prospects & World Bank Data',
    updateIntervalSeconds: 0,
    requiresApiKey: false,
    sourceUrl: 'https://data.worldbank.org',
  };

  isAvailable(): boolean {
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async fetchEntities(): Promise<GeospatialEntity[]> {
    const entities: GeospatialEntity[] = [];

    for (const city of MEGACITIES) {
      entities.push({
        id: `pop-city-${city.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        type: EntityType.City,
        name: city.name,
        latitude: city.lat,
        longitude: city.lng,
        altitude: 0,
        geometry: { type: 'point', coordinates: { latitude: city.lat, longitude: city.lng } },
        country: city.country,
        region: city.country,
        properties: {
          population: city.population,
          isMegacity: city.population >= 10_000_000,
        },
        metadata: { population: city.population },
        source: this.info.name,
        timestamp: new Date(),
        lastUpdated: new Date(),
        visibility: true,
        priority: 90,
        status: EntityStatus.Active,
        color: ENTITY_TYPE_COLORS[EntityType.City],
        icon: ENTITY_TYPE_ICONS[EntityType.City],
      });
    }

    log.info(`Loaded ${entities.length} population center entities`);
    return entities;
  }
}

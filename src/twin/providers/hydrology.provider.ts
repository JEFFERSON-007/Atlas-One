/**
 * Hydrology Provider — Global major rivers, lakes, reservoirs, and dams.
 * Data source: Natural Earth Hydrology & OpenStreetMap Hydrography.
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

const log = createLogger('HydrologyProvider');

/** Curated major global rivers dataset. */
const MAJOR_RIVERS = [
  { name: 'Amazon River', lengthKm: 6992, lat: -3.4653, lng: -62.2159, country: 'Brazil / South America' },
  { name: 'Nile River', lengthKm: 6650, lat: 15.5527, lng: 32.5324, country: 'Egypt / Africa' },
  { name: 'Yangtze River', lengthKm: 6300, lat: 30.5928, lng: 114.3055, country: 'China' },
  { name: 'Mississippi River', lengthKm: 3766, lat: 37.0, lng: -89.18, country: 'United States' },
  { name: 'Yenisei River', lengthKm: 5539, lat: 56.0, lng: 92.8, country: 'Russia' },
  { name: 'Yellow River (Huang He)', lengthKm: 5464, lat: 37.78, lng: 119.25, country: 'China' },
  { name: 'Danube River', lengthKm: 2850, lat: 45.2, lng: 29.7, country: 'Europe' },
  { name: 'Ganges River', lengthKm: 2525, lat: 25.28, lng: 82.96, country: 'India' },
  { name: 'Rhine River', lengthKm: 1230, lat: 51.96, lng: 4.12, country: 'Europe' },
];

/** Curated major global lakes & dams. */
const MAJOR_LAKES = [
  { name: 'Caspian Sea', areaKm2: 371000, lat: 41.9, lng: 50.6, country: 'Eurasia' },
  { name: 'Lake Superior', areaKm2: 82100, lat: 47.7, lng: -87.5, country: 'United States / Canada' },
  { name: 'Lake Victoria', areaKm2: 68800, lat: -1.0, lng: 33.0, country: 'Tanzania / Uganda / Kenya' },
  { name: 'Lake Baikal', areaKm2: 31722, lat: 53.5, lng: 108.0, country: 'Russia' },
  { name: 'Three Gorges Dam', capacityMW: 22500, lat: 30.823, lng: 111.003, country: 'China', type: EntityType.Dam },
  { name: 'Hoover Dam', capacityMW: 2080, lat: 36.015, lng: -114.737, country: 'United States', type: EntityType.Dam },
];

export class HydrologyProvider implements IGeospatialProvider {
  readonly info: GeospatialProviderInfo = {
    id: 'hydrology-waterways',
    name: 'Global Hydrology — Rivers, Lakes & Dams',
    primaryType: EntityType.River,
    attribution: 'Natural Earth Hydrology & OpenStreetMap',
    updateIntervalSeconds: 0,
    requiresApiKey: false,
    sourceUrl: 'https://www.naturalearthdata.com',
  };

  isAvailable(): boolean {
    return true;
  }

  async fetchEntities(): Promise<GeospatialEntity[]> {
    const entities: GeospatialEntity[] = [];

    // Rivers
    for (const r of MAJOR_RIVERS) {
      entities.push({
        id: `river-${r.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        type: EntityType.River,
        name: r.name,
        latitude: r.lat,
        longitude: r.lng,
        altitude: 0,
        geometry: { type: 'point', coordinates: { latitude: r.lat, longitude: r.lng } },
        country: r.country,
        region: r.country,
        properties: { lengthKm: r.lengthKm },
        metadata: { lengthKm: r.lengthKm },
        source: this.info.name,
        timestamp: new Date(),
        lastUpdated: new Date(),
        visibility: true,
        priority: 70,
        status: EntityStatus.Active,
        color: ENTITY_TYPE_COLORS[EntityType.River],
        icon: ENTITY_TYPE_ICONS[EntityType.River],
      });
    }

    // Lakes & Dams
    for (const l of MAJOR_LAKES) {
      const type = l.type ?? EntityType.Lake;
      entities.push({
        id: `hydro-${l.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        type,
        name: l.name,
        latitude: l.lat,
        longitude: l.lng,
        altitude: 0,
        geometry: { type: 'point', coordinates: { latitude: l.lat, longitude: l.lng } },
        country: l.country,
        region: l.country,
        properties: { areaKm2: l.areaKm2, capacityMW: l.capacityMW },
        metadata: { areaKm2: l.areaKm2, capacityMW: l.capacityMW },
        source: this.info.name,
        timestamp: new Date(),
        lastUpdated: new Date(),
        visibility: true,
        priority: 65,
        status: EntityStatus.Active,
        color: ENTITY_TYPE_COLORS[type],
        icon: ENTITY_TYPE_ICONS[type],
      });
    }

    log.info(`Loaded ${entities.length} hydrology entities`);
    return entities;
  }
}

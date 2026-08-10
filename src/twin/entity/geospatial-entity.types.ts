/**
 * Geospatial Entity Types — Universal type system for the Digital Twin Engine.
 * Normalizes all persistent geographic features (countries, cities, buildings, roads,
 * hydrology, infrastructure) into a unified, extensible architecture.
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

/** Supported geospatial entity types. Extensible for future modules. */
export enum EntityType {
  Country = 'country',
  State = 'state',
  Province = 'province',
  City = 'city',
  District = 'district',
  Building = 'building',
  Road = 'road',
  Airport = 'airport',
  Port = 'port',
  Railway = 'railway',
  River = 'river',
  Lake = 'lake',
  Dam = 'dam',
  PowerPlant = 'power-plant',
  Hospital = 'hospital',
  School = 'school',
  University = 'university',
  WeatherStation = 'weather-station',
  SatelliteGroundStation = 'satellite-ground-station',
  TelecommunicationFacility = 'telecommunication-facility',
  IndustrialFacility = 'industrial-facility',
  Forest = 'forest',
  ProtectedArea = 'protected-area',
}

/** Operational lifecycle status of an entity. */
export enum EntityStatus {
  Active = 'active',
  Inactive = 'inactive',
  Proposed = 'proposed',
  UnderConstruction = 'under-construction',
  Decommissioned = 'decommissioned',
}

/** Level of detail classification for frustum culling. */
export enum LODLevel {
  Space = 'space',       // > 5,000 km altitude
  Country = 'country',   // 500 km – 5,000 km altitude
  City = 'city',         // 50 km – 500 km altitude
  Street = 'street',     // < 50 km altitude
}

// ---------------------------------------------------------------------------
// Geometry Models
// ---------------------------------------------------------------------------

export interface GeoPoint {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export type GeospatialGeometry =
  | { type: 'point'; coordinates: GeoPoint }
  | { type: 'line'; coordinates: GeoPoint[] }
  | { type: 'polygon'; coordinates: GeoPoint[][] }
  | { type: 'box'; bounds: BoundingBox };

// ---------------------------------------------------------------------------
// Core Geospatial Entity Model
// ---------------------------------------------------------------------------

/**
 * Universal Geospatial Entity model.
 * Every Digital Twin data provider normalizes raw data into this shape.
 */
export interface GeospatialEntity {
  /** Unique entity identifier (e.g. "country-IND", "city-chennai", "osm-bldg-12345"). */
  id: string;
  /** Entity classification. */
  type: EntityType;
  /** Display name. */
  name: string;
  /** Primary geographic latitude (-90 to 90). */
  latitude: number;
  /** Primary geographic longitude (-180 to 180). */
  longitude: number;
  /** Elevation / altitude in meters above sea level. */
  altitude: number;
  /** Detailed geometry for rendering (point, line, polygon, bounding box). */
  geometry: GeospatialGeometry;
  /** ISO Country name or code. */
  country: string;
  /** Administrative region / state / province. */
  region: string;
  /** Key-value attributes (population, area, height, IATA, capacity, etc.). */
  properties: Record<string, unknown>;
  /** Arbitrary provider-specific metadata. */
  metadata: Record<string, unknown>;
  /** Data provider attribution. */
  source: string;
  /** Record creation timestamp. */
  timestamp: Date;
  /** Record last updated timestamp. */
  lastUpdated: Date;
  /** Current visibility flag. */
  visibility: boolean;
  /** Rendering priority (higher = rendered on top). */
  priority: number;
  /** Operational status. */
  status: EntityStatus;
  /** Primary display color (hex). */
  color?: string;
  /** Icon identifier. */
  icon?: string;
  /** Minimum LOD level required for rendering. */
  minLOD?: LODLevel;
}

// ---------------------------------------------------------------------------
// Display Maps
// ---------------------------------------------------------------------------

/** Maps EntityType to default display color. */
export const ENTITY_TYPE_COLORS: Record<EntityType, string> = {
  [EntityType.Country]: '#38bdf8',                  // Sky Blue
  [EntityType.State]: '#60a5fa',                    // Blue
  [EntityType.Province]: '#818cf8',                 // Indigo
  [EntityType.City]: '#fbbf24',                     // Amber
  [EntityType.District]: '#fcd34d',                 // Yellow
  [EntityType.Building]: '#94a3b8',                 // Slate
  [EntityType.Road]: '#cbd5e1',                     // Light Gray
  [EntityType.Airport]: '#a78bfa',                 // Purple
  [EntityType.Port]: '#22d3ee',                    // Cyan
  [EntityType.Railway]: '#f97316',                 // Orange
  [EntityType.River]: '#3b82f6',                    // Royal Blue
  [EntityType.Lake]: '#0284c7',                     // Deep Blue
  [EntityType.Dam]: '#0ea5e9',                      // Light Blue
  [EntityType.PowerPlant]: '#ef4444',               // Red
  [EntityType.Hospital]: '#f43f5e',                 // Rose
  [EntityType.School]: '#10b981',                   // Emerald
  [EntityType.University]: '#059669',               // Green
  [EntityType.WeatherStation]: '#06b6d4',           // Cyan
  [EntityType.SatelliteGroundStation]: '#8b5cf6',   // Violet
  [EntityType.TelecommunicationFacility]: '#d946ef',// Fuchsia
  [EntityType.IndustrialFacility]: '#f59e0b',       // Amber-Orange
  [EntityType.Forest]: '#22c55e',                   // Green
  [EntityType.ProtectedArea]: '#16a34a',            // Dark Green
};

/** Maps EntityType to default icon. */
export const ENTITY_TYPE_ICONS: Record<EntityType, string> = {
  [EntityType.Country]: '🌐',
  [EntityType.State]: '🏛️',
  [EntityType.Province]: '🗺️',
  [EntityType.City]: '🏙️',
  [EntityType.District]: '🏡',
  [EntityType.Building]: '🏢',
  [EntityType.Road]: '🛣️',
  [EntityType.Airport]: '🛫',
  [EntityType.Port]: '⚓',
  [EntityType.Railway]: '🚆',
  [EntityType.River]: '🌊',
  [EntityType.Lake]: '💧',
  [EntityType.Dam]: '🧱',
  [EntityType.PowerPlant]: '⚡',
  [EntityType.Hospital]: '🏥',
  [EntityType.School]: '🏫',
  [EntityType.University]: '🎓',
  [EntityType.WeatherStation]: '🌡️',
  [EntityType.SatelliteGroundStation]: '📡',
  [EntityType.TelecommunicationFacility]: '📶',
  [EntityType.IndustrialFacility]: '🏭',
  [EntityType.Forest]: '🌲',
  [EntityType.ProtectedArea]: '🏞️',
};

/** Minimum LOD level per entity type to optimize rendering performance. */
export const ENTITY_MIN_LOD: Record<EntityType, LODLevel> = {
  [EntityType.Country]: LODLevel.Space,
  [EntityType.City]: LODLevel.Country,
  [EntityType.State]: LODLevel.Space,
  [EntityType.Province]: LODLevel.Country,
  [EntityType.District]: LODLevel.City,
  [EntityType.Airport]: LODLevel.Country,
  [EntityType.Port]: LODLevel.Country,
  [EntityType.PowerPlant]: LODLevel.City,
  [EntityType.River]: LODLevel.Country,
  [EntityType.Lake]: LODLevel.Country,
  [EntityType.Dam]: LODLevel.City,
  [EntityType.Hospital]: LODLevel.City,
  [EntityType.School]: LODLevel.Street,
  [EntityType.University]: LODLevel.City,
  [EntityType.WeatherStation]: LODLevel.City,
  [EntityType.SatelliteGroundStation]: LODLevel.City,
  [EntityType.TelecommunicationFacility]: LODLevel.City,
  [EntityType.IndustrialFacility]: LODLevel.City,
  [EntityType.Road]: LODLevel.City,
  [EntityType.Railway]: LODLevel.City,
  [EntityType.Building]: LODLevel.Street,
  [EntityType.Forest]: LODLevel.Country,
  [EntityType.ProtectedArea]: LODLevel.Country,
};

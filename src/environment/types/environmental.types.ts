/**
 * Environmental Data Types — Core type system for Atlas One v0.8.
 * Every environmental provider normalizes its data into these types.
 * DataState is mandatory on every observation — never omit it.
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

/** Data provenance — MUST be set on every observation. */
export enum DataState {
  LIVE = 'LIVE',
  HISTORICAL = 'HISTORICAL',
  FORECAST = 'FORECAST',
  SIMULATED = 'SIMULATED',
  DERIVED = 'DERIVED',
  UNAVAILABLE = 'UNAVAILABLE',
}

/** Supported environmental variable types. */
export enum EnvironmentalVariable {
  Temperature = 'temperature',
  TemperatureAnomaly = 'temperature_anomaly',
  Precipitation = 'precipitation',
  Humidity = 'humidity',
  Pressure = 'pressure',
  WindSpeed = 'wind_speed',
  WindDirection = 'wind_direction',
  AirQualityIndex = 'aqi',
  PM25 = 'pm25',
  PM10 = 'pm10',
  NO2 = 'no2',
  O3 = 'o3',
  SO2 = 'so2',
  CO = 'co',
  Vegetation = 'vegetation',
  NDVI = 'ndvi',
  SoilMoisture = 'soil_moisture',
  SnowCover = 'snow_cover',
  SnowDepth = 'snow_depth',
  SeaIce = 'sea_ice',
  WaterLevel = 'water_level',
  SeaSurfaceTemperature = 'sst',
  Chlorophyll = 'chlorophyll',
  FireRadiativePower = 'frp',
  WaveHeight = 'wave_height',
  OceanCurrentSpeed = 'ocean_current_speed',
  OceanCurrentDirection = 'ocean_current_direction',
  DroughtIndex = 'drought_index',
  FloodExtent = 'flood_extent',
  ForestCover = 'forest_cover',
  ForestLoss = 'forest_loss',
}

/** Data quality classification. */
export enum DataQuality {
  High = 'high',
  Medium = 'medium',
  Low = 'low',
  Unknown = 'unknown',
}

// ---------------------------------------------------------------------------
// Core Observation Model
// ---------------------------------------------------------------------------

/**
 * Universal Environmental Observation.
 * Every environmental provider normalizes its raw API data into this shape.
 */
export interface EnvironmentalObservation {
  /** Unique identifier (provider-prefixed). */
  id: string;
  /** Dataset name (e.g. "open-meteo-forecast"). */
  dataset: string;
  /** What is being measured. */
  variable: EnvironmentalVariable;
  /** Geographic latitude (-90 to 90). */
  latitude: number;
  /** Geographic longitude (-180 to 180). */
  longitude: number;
  /** Altitude in meters (null if not applicable). */
  altitude: number | null;
  /** The measured/modeled value. */
  value: number;
  /** Measurement unit string (e.g. "°C", "µg/m³"). */
  unit: string;
  /** Primary timestamp of the observation. */
  timestamp: Date;
  /** Start of observation period (null for instantaneous). */
  startTime: Date | null;
  /** End of observation period (null for instantaneous). */
  endTime: Date | null;
  /** Spatial resolution in degrees (null if point). */
  resolution: number | null;
  /** Source URL or identifier. */
  source: string;
  /** Data quality classification. */
  quality: DataQuality;
  /** Provider confidence (0–1). */
  confidence: number;
  /** MANDATORY — provenance of this data point. */
  dataState: DataState;
  /** Arbitrary provider-specific metadata. */
  metadata: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Environmental Station Model
// ---------------------------------------------------------------------------

/** Monitoring station measurement. */
export interface StationMeasurement {
  variable: EnvironmentalVariable;
  value: number;
  unit: string;
  timestamp: Date;
  dataState: DataState;
}

/** Environmental monitoring station. */
export interface EnvironmentalStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  provider: string;
  measurements: StationMeasurement[];
  lastUpdated: Date;
  status: 'active' | 'inactive' | 'maintenance';
}

// ---------------------------------------------------------------------------
// Filter and Query
// ---------------------------------------------------------------------------

/** Query parameters for environmental data. */
export interface EnvironmentalQuery {
  variable: EnvironmentalVariable;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  center?: { latitude: number; longitude: number };
  radiusKm?: number;
  timeRange?: {
    start: Date;
    end: Date;
  };
  dataStates?: DataState[];
  resolution?: number;
  limit?: number;
}

/** Result wrapper with metadata. */
export interface EnvironmentalResult {
  observations: EnvironmentalObservation[];
  provider: string;
  fetchedAt: Date;
  dataState: DataState;
  totalCount: number;
  isTruncated: boolean;
}

// ---------------------------------------------------------------------------
// Color Scale
// ---------------------------------------------------------------------------

/** Color stop for visualization legends. */
export interface ColorStop {
  value: number;
  color: string;
  label?: string;
}

/** Legend descriptor for a rendered layer. */
export interface EnvironmentalLegend {
  variable: EnvironmentalVariable;
  title: string;
  unit: string;
  min: number;
  max: number;
  stops: ColorStop[];
  dataState: DataState;
  timestamp: Date | null;
}

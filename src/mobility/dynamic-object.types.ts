/**
 * Dynamic Object Types — Universal type system for the Dynamic Object Engine.
 * Every moving object (aircraft, ship, satellite, ISS, etc.) normalizes to these types.
 * Designed for unlimited extensibility — new object types require zero structural changes.
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

/** Supported dynamic object types. Extensible for future modules. */
export enum ObjectType {
  Aircraft = 'aircraft',
  Ship = 'ship',
  Satellite = 'satellite',
  ISS = 'iss',
  Starlink = 'starlink',
  GPS = 'gps',
  GLONASS = 'glonass',
  Galileo = 'galileo',
  BeiDou = 'beidou',
  WeatherBalloon = 'weather-balloon',
  Drone = 'drone',
  Custom = 'custom',
}

/** Ship sub-types for filtering and display. */
export enum ShipType {
  Cargo = 'cargo',
  Tanker = 'tanker',
  Container = 'container',
  Passenger = 'passenger',
  Fishing = 'fishing',
  Military = 'military',
  Sailing = 'sailing',
  Unknown = 'unknown',
}

/** Orbit classification for satellites. */
export enum OrbitType {
  LEO = 'leo',
  MEO = 'meo',
  GEO = 'geo',
  HEO = 'heo',
  SSO = 'sso',
  Unknown = 'unknown',
}

/** Lifecycle status of a dynamic object. */
export enum ObjectStatus {
  Active = 'active',
  Inactive = 'inactive',
  Lost = 'lost',
  Predicted = 'predicted',
  Grounded = 'grounded',
}

// ---------------------------------------------------------------------------
// Geometry & Motion
// ---------------------------------------------------------------------------

/** 3D velocity vector in m/s. */
export interface VelocityVector {
  vx: number;
  vy: number;
  vz: number;
}

/** Position snapshot for history/prediction buffers. */
export interface PositionSnapshot {
  latitude: number;
  longitude: number;
  altitude: number;
  heading: number;
  speed: number;
  timestamp: Date;
}

/** Trail rendering state. */
export interface TrailState {
  enabled: boolean;
  maxLength: number;
  color: string;
  width: number;
  fadeOut: boolean;
}

/** Animation state for object markers. */
export interface ObjectAnimationState {
  pulse: boolean;
  glow: boolean;
  rotate: boolean;
  scale: number;
}

// ---------------------------------------------------------------------------
// Core Dynamic Object Model
// ---------------------------------------------------------------------------

/**
 * Universal Dynamic Object model.
 * Every provider normalizes its raw API data into this shape.
 */
export interface DynamicObject {
  /** Unique identifier (provider-prefixed, e.g. "opensky-abc123"). */
  id: string;
  /** Object classification. */
  type: ObjectType;
  /** Geographic latitude (-90 to 90). */
  latitude: number;
  /** Geographic longitude (-180 to 180). */
  longitude: number;
  /** Altitude in meters. */
  altitude: number;
  /** Heading in degrees (0–360, 0=North). */
  heading: number;
  /** Ground speed in m/s. */
  speed: number;
  /** 3D velocity vector (optional). */
  velocity: VelocityVector | null;
  /** Lifecycle status. */
  status: ObjectStatus;
  /** Last update timestamp. */
  timestamp: Date;
  /** Country of origin/registration. */
  country: string;
  /** Data source provider ID. */
  providerName: string;
  /** Arbitrary provider-specific metadata. */
  metadata: Record<string, unknown>;
  /** Visual animation state. */
  animationState: ObjectAnimationState;
  /** Trail rendering state. */
  trailState: TrailState;
  /** Whether the object is currently visible on the globe. */
  visible: boolean;
  /** Display priority (higher = rendered first). */
  priority: number;
  /** Hex color for marker rendering. */
  color: string;
  /** Icon identifier (emoji or SVG key). */
  icon: string;
  /** Display label (e.g. flight number, vessel name). */
  label: string;
  /** Recent position history for trail rendering. */
  historyBuffer: PositionSnapshot[];
  /** Future predicted positions. */
  predictionBuffer: PositionSnapshot[];
}

// ---------------------------------------------------------------------------
// Filter Criteria
// ---------------------------------------------------------------------------

/**
 * Universal filter criteria for dynamic objects.
 */
export interface ObjectFilter {
  types?: ObjectType[];
  statuses?: ObjectStatus[];
  providers?: string[];
  country?: string;
  altitudeRange?: { min: number; max: number };
  speedRange?: { min: number; max: number };
  headingRange?: { min: number; max: number };
  searchText?: string;
  /** Sub-type filters */
  shipTypes?: ShipType[];
  orbitTypes?: OrbitType[];
  operator?: string;
  airline?: string;
}

// ---------------------------------------------------------------------------
// Color, Icon & Size Maps
// ---------------------------------------------------------------------------

/** Maps object type to default display color. */
export const OBJECT_TYPE_COLORS: Record<ObjectType, string> = {
  [ObjectType.Aircraft]: '#60a5fa',    // Blue
  [ObjectType.Ship]: '#34d399',        // Green
  [ObjectType.Satellite]: '#a78bfa',   // Purple
  [ObjectType.ISS]: '#fbbf24',         // Amber
  [ObjectType.Starlink]: '#f0abfc',    // Pink
  [ObjectType.GPS]: '#38bdf8',         // Cyan
  [ObjectType.GLONASS]: '#fb923c',     // Orange
  [ObjectType.Galileo]: '#4ade80',     // Emerald
  [ObjectType.BeiDou]: '#f87171',      // Red
  [ObjectType.WeatherBalloon]: '#94a3b8', // Slate
  [ObjectType.Drone]: '#fcd34d',       // Yellow
  [ObjectType.Custom]: '#64748b',      // Gray
};

/** Maps object type to default icon. */
export const OBJECT_TYPE_ICONS: Record<ObjectType, string> = {
  [ObjectType.Aircraft]: '✈️',
  [ObjectType.Ship]: '🚢',
  [ObjectType.Satellite]: '🛰️',
  [ObjectType.ISS]: '🏠',
  [ObjectType.Starlink]: '⭐',
  [ObjectType.GPS]: '📡',
  [ObjectType.GLONASS]: '📡',
  [ObjectType.Galileo]: '📡',
  [ObjectType.BeiDou]: '📡',
  [ObjectType.WeatherBalloon]: '🎈',
  [ObjectType.Drone]: '🤖',
  [ObjectType.Custom]: '📌',
};

/** Maps object type to marker pixel size. */
export const OBJECT_TYPE_SIZES: Record<ObjectType, number> = {
  [ObjectType.Aircraft]: 12,
  [ObjectType.Ship]: 10,
  [ObjectType.Satellite]: 6,
  [ObjectType.ISS]: 20,
  [ObjectType.Starlink]: 4,
  [ObjectType.GPS]: 8,
  [ObjectType.GLONASS]: 8,
  [ObjectType.Galileo]: 8,
  [ObjectType.BeiDou]: 8,
  [ObjectType.WeatherBalloon]: 8,
  [ObjectType.Drone]: 10,
  [ObjectType.Custom]: 8,
};

/** Maps ship type to display color. */
export const SHIP_TYPE_COLORS: Record<ShipType, string> = {
  [ShipType.Cargo]: '#34d399',
  [ShipType.Tanker]: '#fb923c',
  [ShipType.Container]: '#60a5fa',
  [ShipType.Passenger]: '#fbbf24',
  [ShipType.Fishing]: '#a78bfa',
  [ShipType.Military]: '#f87171',
  [ShipType.Sailing]: '#38bdf8',
  [ShipType.Unknown]: '#94a3b8',
};

/** Maximum history buffer entries per object. */
export const MAX_HISTORY_LENGTH = 50;

/** Maximum prediction buffer entries per object. */
export const MAX_PREDICTION_LENGTH = 20;

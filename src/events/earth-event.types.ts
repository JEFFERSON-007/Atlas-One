/**
 * Earth Event Types — Universal type system for the Earth Event Engine.
 * Every event type (earthquake, wildfire, volcano, etc.) normalizes to these types.
 * Designed for unlimited extensibility — new event types require zero structural changes.
 */

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

/** Supported event types. Extensible for future modules. */
export enum EventType {
  Earthquake = 'earthquake',
  Wildfire = 'wildfire',
  Volcano = 'volcano',
  Lightning = 'lightning',
  Storm = 'storm',
  Tsunami = 'tsunami',
  Flood = 'flood',
  Tornado = 'tornado',
  Landslide = 'landslide',
  Avalanche = 'avalanche',
  Custom = 'custom',
}

/** Severity classification (ISO-style). */
export enum EventSeverity {
  Info = 'info',
  Minor = 'minor',
  Moderate = 'moderate',
  Major = 'major',
  Severe = 'severe',
  Extreme = 'extreme',
}

/** Priority for display ordering and alerting. */
export enum EventPriority {
  Low = 'low',
  Normal = 'normal',
  High = 'high',
  Critical = 'critical',
}

/** Lifecycle status of an event. */
export enum EventStatus {
  Active = 'active',
  Expired = 'expired',
  Resolved = 'resolved',
  Archived = 'archived',
}

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

/** Geographic point. */
export interface GeoPoint {
  latitude: number;
  longitude: number;
  altitude?: number;
}

/** Geographic bounding region. */
export interface EventBoundingRegion {
  north: number;
  south: number;
  east: number;
  west: number;
}

/** Supported geometry shapes for event visualization. */
export type EventGeometry =
  | { type: 'point'; coordinates: GeoPoint }
  | { type: 'circle'; center: GeoPoint; radiusKm: number }
  | { type: 'line'; coordinates: GeoPoint[] }
  | { type: 'polygon'; coordinates: GeoPoint[] };

// ---------------------------------------------------------------------------
// Animation
// ---------------------------------------------------------------------------

/** Visual animation state for markers. */
export interface EventAnimationState {
  pulse: boolean;
  glow: boolean;
  flash: boolean;
  fadeIn: boolean;
  scale: number;
}

// ---------------------------------------------------------------------------
// Core Event Model
// ---------------------------------------------------------------------------

/**
 * Universal Earth Event model.
 * Every event provider normalizes its raw API data into this shape.
 * Contains all 25+ fields specified in the v0.3 requirements.
 */
export interface EarthEvent {
  /** Unique identifier (provider-prefixed, e.g. "usgs-us7000abc"). */
  id: string;
  /** Event classification. */
  type: EventType;
  /** Geographic latitude (-90 to 90). */
  latitude: number;
  /** Geographic longitude (-180 to 180). */
  longitude: number;
  /** Altitude in meters (optional). */
  altitude: number | null;
  /** When the event occurred. */
  timestamp: Date;
  /** Severity classification. */
  severity: EventSeverity;
  /** Display priority. */
  priority: EventPriority;
  /** Lifecycle status. */
  status: EventStatus;
  /** Short title for display. */
  title: string;
  /** Detailed description. */
  description: string;
  /** Hex color for marker rendering. */
  color: string;
  /** Emoji or SVG icon identifier. */
  icon: string;
  /** Data source URL. */
  source: string;
  /** Provider confidence (0–1). */
  confidence: number;
  /** Arbitrary provider-specific metadata. */
  metadata: Record<string, unknown>;
  /** Event geometry for rendering. */
  geometry: EventGeometry;
  /** Whether the event is currently visible on the globe. */
  visible: boolean;
  /** Animation state for the marker. */
  animationState: EventAnimationState;
  /** Provider that supplied this event. */
  providerName: string;
  /** Recommended refresh interval in seconds. */
  updateInterval: number;
  /** When this event should be automatically removed. Null = never. */
  expiration: Date | null;
  /** Geographic bounds for spatial queries. */
  boundingRegion: EventBoundingRegion | null;
}

// ---------------------------------------------------------------------------
// Filter Criteria
// ---------------------------------------------------------------------------

/**
 * Universal filter criteria.
 * Adding new filter fields requires only extending this interface —
 * the FilterEngine handles arbitrary criteria without structural changes.
 */
export interface EventFilter {
  types?: EventType[];
  severities?: EventSeverity[];
  statuses?: EventStatus[];
  providers?: string[];
  timeRange?: { start: Date; end: Date };
  magnitudeRange?: { min: number; max: number };
  depthRange?: { min: number; max: number };
  confidenceMin?: number;
  country?: string;
  searchText?: string;
  boundingRegion?: EventBoundingRegion;
}

// ---------------------------------------------------------------------------
// Severity Color & Size Mapping
// ---------------------------------------------------------------------------

/** Maps severity to display color (hex). */
export const SEVERITY_COLORS: Record<EventSeverity, string> = {
  [EventSeverity.Info]: '#60a5fa',     // Blue
  [EventSeverity.Minor]: '#34d399',    // Green
  [EventSeverity.Moderate]: '#fbbf24', // Amber
  [EventSeverity.Major]: '#fb923c',    // Orange
  [EventSeverity.Severe]: '#f87171',   // Red
  [EventSeverity.Extreme]: '#dc2626',  // Dark Red
};

/** Maps severity to marker pixel size. */
export const SEVERITY_SIZES: Record<EventSeverity, number> = {
  [EventSeverity.Info]: 6,
  [EventSeverity.Minor]: 8,
  [EventSeverity.Moderate]: 10,
  [EventSeverity.Major]: 14,
  [EventSeverity.Severe]: 18,
  [EventSeverity.Extreme]: 24,
};

/** Maps event type to default icon. */
export const EVENT_ICONS: Record<EventType, string> = {
  [EventType.Earthquake]: '🌍',
  [EventType.Wildfire]: '🔥',
  [EventType.Volcano]: '🌋',
  [EventType.Lightning]: '⚡',
  [EventType.Storm]: '🌀',
  [EventType.Tsunami]: '🌊',
  [EventType.Flood]: '💧',
  [EventType.Tornado]: '🌪️',
  [EventType.Landslide]: '⛰️',
  [EventType.Avalanche]: '❄️',
  [EventType.Custom]: '📌',
};

/** Maps event type to display color. */
export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  [EventType.Earthquake]: '#f87171',
  [EventType.Wildfire]: '#fb923c',
  [EventType.Volcano]: '#fbbf24',
  [EventType.Lightning]: '#facc15',
  [EventType.Storm]: '#a78bfa',
  [EventType.Tsunami]: '#38bdf8',
  [EventType.Flood]: '#22d3ee',
  [EventType.Tornado]: '#c084fc',
  [EventType.Landslide]: '#a3a3a3',
  [EventType.Avalanche]: '#e2e8f0',
  [EventType.Custom]: '#94a3b8',
};

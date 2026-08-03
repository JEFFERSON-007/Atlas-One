/**
 * MarkerFactory — Creates Cesium billboard entities from EarthEvent data.
 * Generates SVG data URI markers with color/size coding by event type and severity.
 */

import {
  type EarthEvent,
  SEVERITY_SIZES,
  EVENT_TYPE_COLORS,
} from '../earth-event.types';

/** Canvas cache for generated marker images. */
const markerCache = new Map<string, string>();

/**
 * Generates a circular marker SVG as a data URI.
 *
 * @param color - Fill color (hex)
 * @param size - Diameter in pixels
 * @param pulse - Whether to include pulse animation ring
 * @returns Data URI string
 */
export function createMarkerSVG(color: string, size: number, pulse: boolean): string {
  const cacheKey = `${color}-${size}-${String(pulse)}`;
  const cached = markerCache.get(cacheKey);
  if (cached) return cached;

  const svgSize = size * 3;
  const center = svgSize / 2;
  const radius = size / 2;

  const pulseRing = pulse
    ? `<circle cx="${center}" cy="${center}" r="${radius * 1.5}" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.4">
         <animate attributeName="r" values="${radius};${radius * 2.5}" dur="2s" repeatCount="indefinite"/>
         <animate attributeName="opacity" values="0.6;0" dur="2s" repeatCount="indefinite"/>
       </circle>`
    : '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}">
    ${pulseRing}
    <circle cx="${center}" cy="${center}" r="${radius}" fill="${color}" opacity="0.85"/>
    <circle cx="${center}" cy="${center}" r="${radius * 0.5}" fill="white" opacity="0.4"/>
  </svg>`;

  const dataUri = `data:image/svg+xml;base64,${btoa(svg)}`;
  markerCache.set(cacheKey, dataUri);
  return dataUri;
}

/**
 * Returns the marker size for an event based on its severity.
 */
export function getMarkerSize(event: EarthEvent): number {
  return SEVERITY_SIZES[event.severity] ?? 10;
}

/**
 * Returns the marker color for an event.
 * Uses the event's own color if set, otherwise falls back to type color.
 */
export function getMarkerColor(event: EarthEvent): string {
  return event.color || EVENT_TYPE_COLORS[event.type] || '#94a3b8';
}

/**
 * Builds the label text shown on hover for an event marker.
 */
export function buildMarkerLabel(event: EarthEvent): string {
  const parts = [event.title];

  const mag = event.metadata['magnitude'] as number | undefined;
  if (mag !== undefined) {
    parts.push(`M${mag.toFixed(1)}`);
  }

  const depth = event.metadata['depth'] as number | undefined;
  if (depth !== undefined) {
    parts.push(`Depth: ${depth.toFixed(1)} km`);
  }

  return parts.join(' | ');
}

/**
 * Returns the Cesium billboard properties for an event.
 */
export function createMarkerProperties(event: EarthEvent): {
  image: string;
  width: number;
  height: number;
  label: string;
  color: string;
} {
  const size = getMarkerSize(event);
  const color = getMarkerColor(event);
  const pulse = event.animationState.pulse;

  return {
    image: createMarkerSVG(color, size, pulse),
    width: size * 3,
    height: size * 3,
    label: buildMarkerLabel(event),
    color,
  };
}

/**
 * Clears the marker image cache.
 */
export function clearMarkerCache(): void {
  markerCache.clear();
}

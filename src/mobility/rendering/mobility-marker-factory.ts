/**
 * MobilityMarkerFactory — Creates SVG markers for all dynamic object types.
 * Generates rotatable aircraft, ship, satellite, ISS, and constellation markers.
 */

import {
  type DynamicObject,
  ObjectType,
  OBJECT_TYPE_COLORS,
  OBJECT_TYPE_SIZES,
} from '../dynamic-object.types';

/** Marker image cache. */
const markerCache = new Map<string, string>();

/**
 * Creates an aircraft SVG marker (rotatable airplane silhouette).
 */
function createAircraftSVG(color: string, size: number): string {
  const s = size * 3;
  const c = s / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
    <g transform="translate(${c},${c})">
      <polygon points="0,-${size} ${size * 0.3},${size * 0.15} 0,${size * 0.05} -${size * 0.3},${size * 0.15}" fill="${color}" opacity="0.9"/>
      <line x1="-${size * 0.7}" y1="0" x2="${size * 0.7}" y2="0" stroke="${color}" stroke-width="2" opacity="0.9"/>
      <line x1="-${size * 0.25}" y1="${size * 0.35}" x2="${size * 0.25}" y2="${size * 0.35}" stroke="${color}" stroke-width="1.5" opacity="0.9"/>
    </g>
  </svg>`;
}

/**
 * Creates a ship SVG marker.
 */
function createShipSVG(color: string, size: number): string {
  const s = size * 3;
  const c = s / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
    <g transform="translate(${c},${c})">
      <polygon points="0,-${size * 0.6} ${size * 0.35},${size * 0.3} ${size * 0.3},${size * 0.5} -${size * 0.3},${size * 0.5} -${size * 0.35},${size * 0.3}" fill="${color}" opacity="0.85"/>
      <circle cx="0" cy="0" r="${size * 0.15}" fill="white" opacity="0.4"/>
    </g>
  </svg>`;
}

/**
 * Creates a satellite dot marker with glow.
 */
function createSatelliteSVG(color: string, size: number, glow: boolean): string {
  const s = size * 4;
  const c = s / 2;
  const glowRing = glow
    ? `<circle cx="${c}" cy="${c}" r="${size}" fill="none" stroke="${color}" stroke-width="0.5" opacity="0.3"/>`
    : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
    ${glowRing}
    <circle cx="${c}" cy="${c}" r="${size * 0.5}" fill="${color}" opacity="0.9"/>
    <circle cx="${c}" cy="${c}" r="${size * 0.2}" fill="white" opacity="0.5"/>
  </svg>`;
}

/**
 * Creates an ISS marker with distinctive appearance.
 */
function createISSSVG(color: string, size: number): string {
  const s = size * 3;
  const c = s / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
    <circle cx="${c}" cy="${c}" r="${size * 1.2}" fill="none" stroke="${color}" stroke-width="1" opacity="0.3">
      <animate attributeName="r" values="${size};${size * 2}" dur="2s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.5;0" dur="2s" repeatCount="indefinite"/>
    </circle>
    <rect x="${c - size * 0.8}" y="${c - size * 0.15}" width="${size * 1.6}" height="${size * 0.3}" fill="${color}" opacity="0.9" rx="1"/>
    <rect x="${c - size * 0.15}" y="${c - size * 0.5}" width="${size * 0.3}" height="${size}" fill="${color}" opacity="0.9" rx="1"/>
    <circle cx="${c}" cy="${c}" r="${size * 0.2}" fill="white" opacity="0.6"/>
  </svg>`;
}

/**
 * Returns the marker image data URI for a dynamic object.
 */
export function createMobilityMarker(obj: DynamicObject): {
  image: string;
  width: number;
  height: number;
  label: string;
  color: string;
} {
  const color = obj.color || OBJECT_TYPE_COLORS[obj.type] || '#94a3b8';
  const size = OBJECT_TYPE_SIZES[obj.type] || 8;
  const cacheKey = `${obj.type}-${color}-${size}`;

  let image = markerCache.get(cacheKey);
  if (!image) {
    let svg: string;
    switch (obj.type) {
      case ObjectType.Aircraft:
        svg = createAircraftSVG(color, size);
        break;
      case ObjectType.Ship:
        svg = createShipSVG(color, size);
        break;
      case ObjectType.ISS:
        svg = createISSSVG(color, size);
        break;
      case ObjectType.Satellite:
      case ObjectType.Starlink:
      case ObjectType.GPS:
      case ObjectType.GLONASS:
      case ObjectType.Galileo:
      case ObjectType.BeiDou:
        svg = createSatelliteSVG(color, size, obj.animationState.glow);
        break;
      default:
        svg = createSatelliteSVG(color, size, false);
    }
    image = `data:image/svg+xml;base64,${btoa(svg)}`;
    markerCache.set(cacheKey, image);
  }

  return {
    image,
    width: size * 3,
    height: size * 3,
    label: obj.label,
    color,
  };
}

/**
 * Clears the marker image cache.
 */
export function clearMobilityMarkerCache(): void {
  markerCache.clear();
}

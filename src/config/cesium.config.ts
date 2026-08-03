/**
 * CesiumJS-specific configuration constants and defaults.
 * Separates Cesium settings from general app configuration.
 */

import type { GraphicsQuality } from './app.config';

/** Default camera position — looking at Earth from space. */
export const DEFAULT_CAMERA = {
  longitude: 10.0, // degrees (roughly Europe)
  latitude: 25.0, // degrees
  height: 20_000_000, // meters (~20,000 km — full Earth view)
} as const;

/** Camera fly-to defaults. */
export const FLY_TO_DEFAULTS = {
  duration: 3.0, // seconds
  searchZoomHeight: 50_000, // meters (50 km above target)
  homeHeight: 20_000_000, // meters
} as const;

/** Camera control limits. */
export const CAMERA_LIMITS = {
  minimumZoomDistance: 250, // meters
  maximumZoomDistance: 50_000_000, // meters (~50,000 km)
  minimumPitch: -89, // degrees
  maximumPitch: 0, // degrees (no looking underground)
} as const;

/** Graphics quality presets for Cesium terrain and imagery. */
export interface CesiumQualityPreset {
  terrainDetailLevel: number;
  maximumScreenSpaceError: number;
  fxaa: boolean;
  msaa: number;
  shadows: boolean;
  fog: boolean;
  groundAtmosphere: boolean;
  skyAtmosphere: boolean;
  requestRenderMode: boolean;
  hdr: boolean;
}

export const QUALITY_PRESETS: Record<GraphicsQuality, CesiumQualityPreset> = {
  low: {
    terrainDetailLevel: 4,
    maximumScreenSpaceError: 8,
    fxaa: false,
    msaa: 1,
    shadows: false,
    fog: false,
    groundAtmosphere: false,
    skyAtmosphere: true,
    requestRenderMode: true,
    hdr: false,
  },
  medium: {
    terrainDetailLevel: 8,
    maximumScreenSpaceError: 4,
    fxaa: true,
    msaa: 1,
    shadows: false,
    fog: true,
    groundAtmosphere: true,
    skyAtmosphere: true,
    requestRenderMode: false,
    hdr: false,
  },
  high: {
    terrainDetailLevel: 12,
    maximumScreenSpaceError: 2,
    fxaa: true,
    msaa: 4,
    shadows: true,
    fog: true,
    groundAtmosphere: true,
    skyAtmosphere: true,
    requestRenderMode: false,
    hdr: true,
  },
  ultra: {
    terrainDetailLevel: 16,
    maximumScreenSpaceError: 1.5,
    fxaa: true,
    msaa: 8,
    shadows: true,
    fog: true,
    groundAtmosphere: true,
    skyAtmosphere: true,
    requestRenderMode: false,
    hdr: true,
  },
} as const;

/** Nominatim API configuration. */
export const NOMINATIM_CONFIG = {
  baseUrl: 'https://nominatim.openstreetmap.org',
  userAgent: 'Atlas One/0.1 (Earth Intelligence Platform)',
  maxResults: 5,
  rateLimitMs: 1000, // 1 request per second per Nominatim policy
} as const;

/** NASA GIBS WMTS configuration. */
export const NASA_GIBS_CONFIG = {
  baseUrl: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best',
  layers: {
    blueMarble: 'BlueMarble_ShadedRelief_Bathymetry',
    viirsTrueColor: 'VIIRS_NOAA20_CorrectedReflectance_TrueColor',
    earthAtNight: 'VIIRS_SNPP_DayNightBand_AtSensor_M15',
  },
} as const;

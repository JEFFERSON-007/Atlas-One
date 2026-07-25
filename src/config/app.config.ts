/**
 * Central application configuration.
 * Reads values from environment variables with graceful fallbacks.
 * Features are automatically disabled when required API keys are missing.
 */

import { createLogger } from '../utils/logger';
import { estimatePerformanceTier, type PerformanceTier } from '../utils/device';

const log = createLogger('AppConfig');

/** Graphics quality presets that control rendering detail. */
export type GraphicsQuality = 'low' | 'medium' | 'high' | 'ultra';

/** Resolved configuration values for the entire application. */
export interface AppConfigValues {
  /** Cesium Ion access token. Empty string if not provided. */
  cesiumIonToken: string;
  /** Whether Cesium Ion features (terrain, premium imagery) are available. */
  hasCesiumIon: boolean;
  /** OpenWeatherMap API key (future use). */
  openWeatherApiKey: string;
  /** Whether weather features are available. */
  hasWeatherApi: boolean;
  /** MapTiler API key (future use). */
  mapTilerApiKey: string;
  /** Whether MapTiler features are available. */
  hasMapTiler: boolean;
  /** Detected performance tier of the device. */
  performanceTier: PerformanceTier;
  /** Current graphics quality setting. */
  graphicsQuality: GraphicsQuality;
  /** Whether the app is running in production mode. */
  isProduction: boolean;
  /** Base path for asset resolution. */
  basePath: string;
}

function resolveGraphicsQuality(tier: PerformanceTier): GraphicsQuality {
  const mapping: Record<PerformanceTier, GraphicsQuality> = {
    low: 'low',
    medium: 'medium',
    high: 'high',
  };
  return mapping[tier];
}

function readEnvToken(key: string): string {
  const value = import.meta.env[key as keyof ImportMetaEnv] ?? '';
  // Filter out placeholder values
  if (
    value === '' ||
    value.startsWith('YOUR_') ||
    value === 'undefined' ||
    value === 'null'
  ) {
    return '';
  }
  return value;
}

/**
 * Loads and resolves the application configuration.
 * Logs warnings for missing optional API keys.
 *
 * @returns Fully resolved configuration object
 */
export function loadAppConfig(): AppConfigValues {
  const cesiumIonToken = readEnvToken('VITE_CESIUM_ION_TOKEN');
  const openWeatherApiKey = readEnvToken('VITE_OPENWEATHER_API_KEY');
  const mapTilerApiKey = readEnvToken('VITE_MAPTILER_API_KEY');
  const performanceTier = estimatePerformanceTier();

  if (!cesiumIonToken) {
    log.warn(
      'VITE_CESIUM_ION_TOKEN not set. Terrain and premium imagery will be unavailable. ' +
        'Get a free token at https://ion.cesium.com/tokens',
    );
  }

  if (!openWeatherApiKey) {
    log.info('VITE_OPENWEATHER_API_KEY not set. Weather features are disabled.');
  }

  if (!mapTilerApiKey) {
    log.info('VITE_MAPTILER_API_KEY not set. MapTiler features are disabled.');
  }

  log.info(`Performance tier detected: ${performanceTier}`);

  return {
    cesiumIonToken,
    hasCesiumIon: cesiumIonToken.length > 0,
    openWeatherApiKey,
    hasWeatherApi: openWeatherApiKey.length > 0,
    mapTilerApiKey,
    hasMapTiler: mapTilerApiKey.length > 0,
    performanceTier,
    graphicsQuality: resolveGraphicsQuality(performanceTier),
    isProduction: import.meta.env.PROD,
    basePath: import.meta.env.VITE_BASE_PATH ?? '/Atlas-One/',
  };
}

/** Global config singleton — initialized once at startup. */
let _config: AppConfigValues | null = null;

/**
 * Returns the initialized application configuration.
 * Must call loadAppConfig() first during bootstrap.
 */
export function getAppConfig(): AppConfigValues {
  if (!_config) {
    _config = loadAppConfig();
  }
  return _config;
}

/**
 * Updates a runtime-changeable setting.
 * Only graphics quality is changeable at runtime.
 */
export function updateGraphicsQuality(quality: GraphicsQuality): void {
  if (_config) {
    _config = { ..._config, graphicsQuality: quality };
  }
}

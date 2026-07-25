/// <reference types="vite/client" />

/**
 * CesiumJS base URL for static asset resolution.
 * Defined in vite.config.ts via the `define` option.
 */
declare const CESIUM_BASE_URL: string;

/**
 * Type-safe environment variable declarations for Vite.
 */
interface ImportMetaEnv {
  readonly VITE_CESIUM_ION_TOKEN?: string;
  readonly VITE_OPENWEATHER_API_KEY?: string;
  readonly VITE_MAPTILER_API_KEY?: string;
  readonly VITE_BASE_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

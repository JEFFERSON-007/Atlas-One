/**
 * Initializes Cesium global variables before any Cesium modules are imported.
 * Vite replaces CESIUM_BASE_URL at build time based on the base path.
 */
if (typeof window !== 'undefined') {
  (window as unknown as { CESIUM_BASE_URL: string }).CESIUM_BASE_URL = CESIUM_BASE_URL;
}
